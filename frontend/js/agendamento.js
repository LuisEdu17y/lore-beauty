// Lógica da página de agendamento: máscara de telefone, horários, envio e fallback WhatsApp

const WHATSAPP_LORE = "5561999386313";

const NOMES_SERVICOS = {
  cilios_tela: "Cílios em Tela",
  brow_lamination: "Brow Lamination",
  design_sobrancelha: "Design de Sobrancelha",
  buco: "Buço",
  masculino: "Atendimento Masculino",
};

function aplicarMascaraTelefone(valor) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

// Data de hoje no fuso do navegador. toISOString() converteria para UTC e à noite
// devolveria o dia seguinte — por isso a montagem manual a partir dos campos locais.
function dataLocalISO(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function definirDataMinima() {
  const input = document.getElementById("data_preferida");
  input.min = dataLocalISO();
}

function definirPlaceholderHorario(texto) {
  const select = document.getElementById("horario_preferido");
  select.innerHTML = "";
  const opcao = document.createElement("option");
  opcao.value = "";
  opcao.disabled = true;
  opcao.selected = true;
  opcao.textContent = texto;
  select.appendChild(opcao);
}

// Contador para descartar respostas atrasadas quando a cliente troca de data rápido
let requisicaoHorariosAtual = 0;

async function carregarHorarios(data) {
  const select = document.getElementById("horario_preferido");

  if (!data) {
    select.disabled = true;
    definirPlaceholderHorario("Escolha uma data primeiro");
    return;
  }

  const requisicao = ++requisicaoHorariosAtual;
  select.disabled = true;
  definirPlaceholderHorario("Carregando horários...");

  try {
    const resposta = await fetch(`/api/disponibilidade?data=${encodeURIComponent(data)}`);
    if (!resposta.ok) throw new Error("Falha ao consultar os horários");
    const { horarios } = await resposta.json();

    if (requisicao !== requisicaoHorariosAtual) return; // chegou fora de ordem

    if (!horarios.length) {
      definirPlaceholderHorario("Não há horários disponíveis para esta data.");
      select.disabled = true;
      return;
    }

    definirPlaceholderHorario("Selecione um horário");
    for (const horario of horarios) {
      const opcao = document.createElement("option");
      opcao.value = horario;
      opcao.textContent = horario;
      select.appendChild(opcao);
    }
    select.disabled = false;
  } catch (erro) {
    if (requisicao !== requisicaoHorariosAtual) return;
    definirPlaceholderHorario("Não foi possível carregar os horários. Tente novamente.");
    select.disabled = true;
  }
}

function mostrarErroCampo(nomeCampo, mostrar) {
  const wrapper = document.querySelector(`[data-campo="${nomeCampo}"]`);
  if (wrapper) {
    wrapper.classList.toggle("invalido", mostrar);
  }
}

function validarFormulario(form) {
  let valido = true;

  const nome = form.nome_cliente.value.trim();
  mostrarErroCampo("nome_cliente", !nome);
  if (!nome) valido = false;

  const digitosWhatsapp = form.whatsapp.value.replace(/\D/g, "");
  const whatsappValido = digitosWhatsapp.length === 10 || digitosWhatsapp.length === 11;
  mostrarErroCampo("whatsapp", !whatsappValido);
  if (!whatsappValido) valido = false;

  const servico = form.servico.value;
  mostrarErroCampo("servico", !servico);
  if (!servico) valido = false;

  const data = form.data_preferida.value;
  mostrarErroCampo("data_preferida", !data);
  if (!data) valido = false;

  const horario = form.horario_preferido.value;
  mostrarErroCampo("horario_preferido", !horario);
  if (!horario) valido = false;

  return valido;
}

function montarMensagemWhatsapp(dados) {
  const nomeServico = NOMES_SERVICOS[dados.servico] || dados.servico;
  const dataFormatada = new Date(dados.data_preferida + "T00:00:00").toLocaleDateString("pt-BR");

  const texto =
    `Olá! Meu nome é ${dados.nome_cliente} e gostaria de confirmar meu agendamento:\n` +
    `Serviço: ${nomeServico}\n` +
    `Data: ${dataFormatada}\n` +
    `Horário: ${dados.horario_preferido}`;

  return `https://wa.me/${WHATSAPP_LORE}?text=${encodeURIComponent(texto)}`;
}

async function enviarAgendamento(dados) {
  const resposta = await fetch("/api/agendamentos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    const detalhe = erro?.detail;
    const mensagem = Array.isArray(detalhe)
      ? detalhe.map((item) => item.msg).join(" ")
      : detalhe || "Não foi possível enviar sua solicitação. Tente novamente.";
    throw new Error(mensagem);
  }

  return resposta.json();
}

document.addEventListener("DOMContentLoaded", () => {
  definirDataMinima();
  carregarHorarios(document.getElementById("data_preferida").value);

  const inputData = document.getElementById("data_preferida");
  inputData.addEventListener("change", () => {
    mostrarErroCampo("horario_preferido", false);
    carregarHorarios(inputData.value);
  });

  const inputWhatsapp = document.getElementById("whatsapp");
  inputWhatsapp.addEventListener("input", (evento) => {
    evento.target.value = aplicarMascaraTelefone(evento.target.value);
  });

  const form = document.getElementById("form-agendamento");
  const mensagemErroApi = document.getElementById("mensagem-erro-api");
  const botaoEnviar = document.getElementById("botao-enviar");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagemErroApi.style.display = "none";

    if (!validarFormulario(form)) return;

    const dados = {
      nome_cliente: form.nome_cliente.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      servico: form.servico.value,
      data_preferida: form.data_preferida.value,
      horario_preferido: form.horario_preferido.value,
      observacoes: form.observacoes.value.trim() || null,
    };

    botaoEnviar.disabled = true;
    botaoEnviar.textContent = "Enviando...";

    try {
      await enviarAgendamento(dados);

      document.getElementById("bloco-formulario").classList.add("oculto");
      document.getElementById("bloco-confirmacao").classList.remove("oculto");
      document.getElementById("link-whatsapp-confirmacao").href = montarMensagemWhatsapp(dados);
    } catch (erro) {
      mensagemErroApi.textContent = erro.message;
      mensagemErroApi.style.display = "block";
      // A recusa pode ser um horário que acabou de ser ocupado — recarrega a lista
      carregarHorarios(dados.data_preferida);
    } finally {
      botaoEnviar.disabled = false;
      botaoEnviar.textContent = "Enviar solicitação";
    }
  });
});
