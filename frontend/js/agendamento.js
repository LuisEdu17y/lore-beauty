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

function preencherHorarios() {
  const select = document.getElementById("horario_preferido");
  for (let hora = 14; hora < 20; hora++) {
    for (const minuto of ["00", "30"]) {
      const rotulo = `${String(hora).padStart(2, "0")}:${minuto}`;
      const opcao = document.createElement("option");
      opcao.value = rotulo;
      opcao.textContent = rotulo;
      select.appendChild(opcao);
    }
  }
}

function definirDataMinima() {
  const input = document.getElementById("data_preferida");
  const hoje = new Date().toISOString().split("T")[0];
  input.min = hoje;
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
  preencherHorarios();
  definirDataMinima();

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
    } finally {
      botaoEnviar.disabled = false;
      botaoEnviar.textContent = "Enviar solicitação";
    }
  });
});
