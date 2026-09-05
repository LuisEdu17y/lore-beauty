"""Regras de agenda: janela de disponibilidade, geração de horários e validação.

Módulo sem dependência do FastAPI — é usado tanto pelo router de disponibilidade
quanto pela validação do POST /api/agendamentos, para que as duas pontas apliquem
exatamente a mesma regra.
"""
import os
import re
from datetime import date, datetime, time, timedelta, timezone

from sqlmodel import Session, select

from models import DIAS_SEMANA, STATUS_QUE_OCUPAM_HORARIO, Agendamento, Disponibilidade

# Intervalo entre um horário e o seguinte dentro da janela do dia.
INTERVALO_MINUTOS = 30

FORMATO_HORARIO = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")

# Janela usada para criar as linhas na primeira execução — reproduz o comportamento
# que o formulário tinha com os horários fixos (14h às 20h, todos os dias).
# A partir daí quem manda é o que a Lore configurar no painel.
HORA_INICIO_PADRAO = time(14, 0)
HORA_FIM_PADRAO = time(20, 0)


def _fuso_local():
    """Fuso de Brasília. O servidor de produção roda em UTC, então usar a data do
    servidor faria uma solicitação feita às 21h já cair no dia seguinte."""
    nome = os.environ.get("LORE_TIMEZONE", "America/Sao_Paulo")
    try:
        from zoneinfo import ZoneInfo

        return ZoneInfo(nome)
    except Exception:  # noqa: BLE001 - sem o pacote tzdata, cai no offset fixo
        return timezone(timedelta(hours=-3))


FUSO_LOCAL = _fuso_local()


def agora_local() -> datetime:
    return datetime.now(FUSO_LOCAL)


def hoje_local() -> date:
    return agora_local().date()


def formatar_hora(valor: time) -> str:
    """time(14, 0) -> '14:00'"""
    return valor.strftime("%H:%M")


def converter_horario(texto: str) -> time | None:
    """'14:30' -> time(14, 30). Devolve None se o formato não for HH:MM."""
    if not isinstance(texto, str) or not FORMATO_HORARIO.match(texto.strip()):
        return None
    horas, minutos = texto.strip().split(":")
    return time(int(horas), int(minutos))


def gerar_horarios(hora_inicio: time, hora_fim: time) -> list[str]:
    """Fatia a janela em intervalos de 30 min.

    O horário final não é oferecido: 14:00–18:00 gera de 14:00 até 17:30.
    """
    if hora_fim <= hora_inicio:
        return []

    base = datetime(2000, 1, 1)
    atual = base.replace(hour=hora_inicio.hour, minute=hora_inicio.minute)
    limite = base.replace(hour=hora_fim.hour, minute=hora_fim.minute)

    horarios = []
    while atual < limite:
        horarios.append(atual.strftime("%H:%M"))
        atual += timedelta(minutes=INTERVALO_MINUTOS)
    return horarios


def obter_configuracao(session: Session) -> list[Disponibilidade]:
    """Devolve as 7 linhas de disponibilidade, criando as que faltarem.

    Evita depender de um seed separado: na primeira chamada (ou se alguém apagar
    uma linha no banco) a configuração se completa sozinha.
    """
    existentes = {
        registro.dia_semana: registro
        for registro in session.exec(select(Disponibilidade)).all()
    }

    faltando = [dia for dia in range(len(DIAS_SEMANA)) if dia not in existentes]
    for dia in faltando:
        registro = Disponibilidade(
            dia_semana=dia,
            hora_inicio=HORA_INICIO_PADRAO,
            hora_fim=HORA_FIM_PADRAO,
            ativo=True,
        )
        session.add(registro)
        existentes[dia] = registro

    if faltando:
        session.commit()
        for dia in faltando:
            session.refresh(existentes[dia])

    return [existentes[dia] for dia in range(len(DIAS_SEMANA))]


def obter_disponibilidade_do_dia(session: Session, data: date) -> Disponibilidade | None:
    """Configuração do dia da semana correspondente à data, ou None se indisponível.

    date.weekday() já usa 0 = segunda ... 6 = domingo, a mesma convenção do modelo.
    """
    configuracao = obter_configuracao(session)
    registro = configuracao[data.weekday()]
    return registro if registro.ativo else None


def horarios_ocupados(session: Session, data: date) -> set[str]:
    """Horários com agendamento pendente, confirmado ou atendido na data."""
    agendamentos = session.exec(
        select(Agendamento).where(
            Agendamento.data_preferida == data,
            Agendamento.status.in_(STATUS_QUE_OCUPAM_HORARIO),  # type: ignore[attr-defined]
        )
    ).all()
    return {agendamento.horario_preferido for agendamento in agendamentos}


def horarios_livres(session: Session, data: date) -> list[str]:
    """Horários que ainda podem ser escolhidos na data — só os horários, nada de cliente."""
    if data < hoje_local():
        return []

    registro = obter_disponibilidade_do_dia(session, data)
    if registro is None:
        return []

    ocupados = horarios_ocupados(session, data)
    livres = [
        horario
        for horario in gerar_horarios(registro.hora_inicio, registro.hora_fim)
        if horario not in ocupados
    ]

    # No dia de hoje, não faz sentido oferecer horário que já passou.
    if data == hoje_local():
        agora = agora_local().time()
        livres = [horario for horario in livres if converter_horario(horario) > agora]

    return livres


class HorarioIndisponivel(Exception):
    """Erro de regra de agenda — vira HTTP 400 na camada de rota."""


def validar_solicitacao(session: Session, data: date, horario: str) -> None:
    """Revalida no backend o par data/horário enviado pelo formulário.

    Levanta HorarioIndisponivel com uma mensagem legível para a cliente. Existe para
    que ninguém consiga burlar o frontend mandando um POST direto na API.
    """
    if converter_horario(horario) is None:
        raise HorarioIndisponivel("Horário em formato inválido. Use HH:MM, por exemplo 14:30.")

    if data < hoje_local():
        raise HorarioIndisponivel("Não é possível agendar em uma data que já passou.")

    registro = obter_disponibilidade_do_dia(session, data)
    if registro is None:
        raise HorarioIndisponivel(
            f"Não há atendimento na {DIAS_SEMANA[data.weekday()].lower()}. Escolha outra data."
        )

    if horario not in gerar_horarios(registro.hora_inicio, registro.hora_fim):
        raise HorarioIndisponivel(
            "Esse horário está fora do horário de atendimento do dia escolhido."
        )

    if horario in horarios_ocupados(session, data):
        raise HorarioIndisponivel("Esse horário acabou de ser reservado. Escolha outro, por favor.")

    if data == hoje_local() and converter_horario(horario) <= agora_local().time():
        raise HorarioIndisponivel("Esse horário já passou. Escolha um horário mais tarde.")
    