// Lógica específica do painel: abas, solicitações e clientes
// Depende de admin-common.js (chamarApi, formatarData, login/logout) já carregado antes deste arquivo

const NOMES_SERVICOS = {
  cilios_tela: "Cílios em Tela",
  brow_lamination: "Brow Lamination",
  design_sobrancelha: "Design de Sobrancelha",
  buco: "Buço",
  masculino: "Atendimento Masculino",
};

const ROTULOS_STATUS = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  atendido: "Atendido",
  cancelado: "Cancelado",
};

// ---------- Painel: abas ----------
// Abas que buscam os dados no backend toda vez que são abertas
const AO_ABRIR_ABA = {
  disponibilidade: () => carregarDisponibilidade(),
};

function inicializarAbas() {
  const botoes = document.querySelectorAll(".aba-botao");
  if (!botoes.length) return;

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      botoes.forEach((b) => b.classList.remove("ativa"));
      document.querySelectorAll(".painel-conteudo").forEach((secao) => secao.classList.remove("ativa"));

      botao.classList.add("ativa");
      document.getElementById(`aba-${botao.dataset.aba}`).classList.add("ativa");

      const aoAbrir = AO_ABRIR_ABA[botao.dataset.aba];
      if (aoAbrir) aoAbrir();
    });
  });
}

// ---------- Painel: solicitações ----------
async function carregarAgendamentos() {
  const corpo = document.getElementById("corpo-tabela-agendamentos");
  if (!corpo) return;

  try {
    const agendamentos = await chamarApi("/api/admin/agendamentos");

    if (!agendamentos.length) {
      corpo.innerHTML = `<tr><td colspan="6" class="estado-vazio">Nenhuma solicitação recebida ainda.</td></tr>`;
      return;
    }

    corpo.innerHTML = agendamentos
      .map(
        (agendamento) => `
      <tr>
        <td>${agendamento.nome_cliente}</td>
        <td>${agendamento.whatsapp}</td>
        <td>${NOMES_SERVICOS[agendamento.servico] || agendamento.servico}</td>
        <td>${formatarData(agendamento.data_preferida)}</td>
        <td>${agendamento.horario_preferido}</td>
        <td>
          <select class="select-status" data-id="${agendamento.id}">
            ${Object.entries(ROTULOS_STATUS)
              .map(
                ([valor, rotulo]) =>
                  `<option value="${valor}" ${agendamento.status === valor ? "selected" : ""}>${rotulo}</option>`
              )
              .join("")}
          </select>
        </td>
      </tr>`
      )
      .join("");

    corpo.querySelectorAll(".select-status").forEach((select) => {
      select.addEventListener("change", async () => {
        const id = select.dataset.id;
        const novoStatus = select.value;
        select.disabled = true;
        try {
          await chamarApi(`/api/admin/agendamentos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: novoStatus }),
          });
          if (novoStatus === "atendido") {
            carregarClientes();
          }
        } catch (erro) {
          alert(erro.message);
        } finally {
          select.disabled = false;
        }
      });
    });
  } catch (erro) {
    corpo.innerHTML = `<tr><td colspan="6" class="estado-vazio">${erro.message}</td></tr>`;
  }
}

// ---------- Painel: clientes ----------
async function carregarClientes() {
  const corpo = document.getElementById("corpo-tabela-clientes");
  if (!corpo) return;

  try {
    const clientes = await chamarApi("/api/admin/clientes");

    if (!clientes.length) {
      corpo.innerHTML = `<tr><td colspan="3" class="estado-vazio">Nenhum cliente cadastrado ainda.</td></tr>`;
      return;
    }

    corpo.innerHTML = clientes
      .map(
        (cliente) => `
      <tr class="linha-clicavel" data-id="${cliente.id}">
        <td>${cliente.nome}</td>
        <td>${cliente.whatsapp}</td>
        <td>${cliente.ultimo_atendimento ? formatarData(cliente.ultimo_atendimento) : "—"}</td>
      </tr>`
      )
      .join("");

    corpo.querySelectorAll("tr.linha-clicavel").forEach((linha) => {
      linha.addEventListener("click", () => abrirFichaCliente(linha.dataset.id));
    });
  } catch (erro) {
    corpo.innerHTML = `<tr><td colspan="3" class="estado-vazio">${erro.message}</td></tr>`;
  }
}

async function abrirFichaCliente(clienteId) {
  const ficha = document.getElementById("ficha-cliente");
  const listaWrapper = document.getElementById("lista-clientes-wrapper");
  if (!ficha) return;

  try {
    const cliente = await chamarApi(`/api/admin/clientes/${clienteId}`);

    document.getElementById("ficha-nome").textContent = cliente.nome;
    document.getElementById("ficha-whatsapp").textContent = cliente.whatsapp;
    document.getElementById("ficha-observacoes").value = cliente.observacoes_gerais || "";

    const historico = document.getElementById("historico-atendimentos");
    historico.innerHTML = cliente.atendimentos.length
      ? cliente.atendimentos
          .map(
            (atendimento) => `
        <div class="historico-item">
          <div class="data-servico">${formatarData(atendimento.data)} — ${NOMES_SERVICOS[atendimento.servico] || atendimento.servico}</div>
          ${atendimento.observacoes ? `<div class="obs">${atendimento.observacoes}</div>` : ""}
        </div>`
          )
          .join("")
      : `<p class="estado-vazio">Nenhum atendimento registrado ainda.</p>`;

    const botaoSalvar = document.getElementById("botao-salvar-observacoes");
    botaoSalvar.onclick = async () => {
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Salvando...";
      try {
        await chamarApi(`/api/admin/clientes/${clienteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            observacoes_gerais: document.getElementById("ficha-observacoes").value.trim() || null,
          }),
        });
      } catch (erro) {
        alert(erro.message);
      } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Salvar observações";
      }
    };

    listaWrapper.classList.add("oculto");
    ficha.classList.remove("oculto");
  } catch (erro) {
    alert(erro.message);
  }
}

function inicializarVoltarFicha() {
  const link = document.getElementById("voltar-lista-clientes");
  if (!link) return;

  link.addEventListener("click", (evento) => {
    evento.preventDefault();
    document.getElementById("ficha-cliente").classList.add("oculto");
    document.getElementById("lista-clientes-wrapper").classList.remove("oculto");
  });
}

// ---------- Painel: disponibilidade ----------
function mostrarMensagemDisponibilidade(tipo, texto) {
  const erro = document.getElementById("mensagem-erro-disponibilidade");
  const sucesso = document.getElementById("mensagem-sucesso-disponibilidade");
  erro.style.display = "none";
  sucesso.style.display = "none";

  if (!texto) return;
  const alvo = tipo === "sucesso" ? sucesso : erro;
  alvo.textContent = texto;
  alvo.style.display = "block";
}

function montarLinhaDisponibilidade(dia) {
  const desabilitado = dia.ativo ? "" : "disabled";
  return `
    <div class="dia-disponibilidade ${dia.ativo ? "" : "inativo"}" data-dia="${dia.dia_semana}">
      <label class="dia-check">
        <input type="checkbox" data-campo="ativo" ${dia.ativo ? "checked" : ""}>
        <span>${dia.rotulo}</span>
      </label>
      <div class="dia-janela">
        <div class="campo">
          <label>Horário inicial</label>
          <input type="time" data-campo="hora_inicio" value="${dia.hora_inicio}" step="1800" ${desabilitado}>
        </div>
        <div class="campo">
          <label>Horário final</label>
          <input type="time" data-campo="hora_fim" value="${dia.hora_fim}" step="1800" ${desabilitado}>
        </div>
      </div>
    </div>`;
}

async function carregarDisponibilidade() {
  const lista = document.getElementById("lista-disponibilidade");
  if (!lista) return;

  mostrarMensagemDisponibilidade(null, null);
  lista.innerHTML = `<p class="carregando">Carregando disponibilidade...</p>`;

  try {
    const dias = await chamarApi("/api/admin/disponibilidade");
    lista.innerHTML = dias.map(montarLinhaDisponibilidade).join("");

    // Marcar/desmarcar o dia habilita ou desabilita a janela de horário dele
    lista.querySelectorAll('input[data-campo="ativo"]').forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const linha = checkbox.closest(".dia-disponibilidade");
        linha.classList.toggle("inativo", !checkbox.checked);
        linha.querySelectorAll('input[type="time"]').forEach((campo) => {
          campo.disabled = !checkbox.checked;
        });
      });
    });
  } catch (erro) {
    lista.innerHTML = "";
    mostrarMensagemDisponibilidade("erro", erro.message);
  }
}

async function salvarDisponibilidade() {
  const lista = document.getElementById("lista-disponibilidade");
  const botao = document.getElementById("botao-salvar-disponibilidade");
  const linhas = lista.querySelectorAll(".dia-disponibilidade");
  if (!linhas.length) return;

  mostrarMensagemDisponibilidade(null, null);

  const dias = [...linhas].map((linha) => ({
    dia_semana: Number(linha.dataset.dia),
    ativo: linha.querySelector('input[data-campo="ativo"]').checked,
    hora_inicio: linha.querySelector('input[data-campo="hora_inicio"]').value,
    hora_fim: linha.querySelector('input[data-campo="hora_fim"]').value,
  }));

  // Checagem local só para dar um retorno rápido — quem valida de verdade é o backend
  const invalido = dias.find(
    (dia) => dia.ativo && (!dia.hora_inicio || !dia.hora_fim || dia.hora_fim <= dia.hora_inicio)
  );
  if (invalido) {
    mostrarMensagemDisponibilidade(
      "erro",
      "Nos dias disponíveis, o horário final precisa ser posterior ao inicial."
    );
    return;
  }

  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    await chamarApi("/api/admin/disponibilidade", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dias }),
    });
    await carregarDisponibilidade();
    mostrarMensagemDisponibilidade("sucesso", "Disponibilidade salva com sucesso.");
  } catch (erro) {
    mostrarMensagemDisponibilidade("erro", erro.message);
  } finally {
    botao.disabled = false;
    botao.textContent = "Salvar disponibilidade";
  }
}

function inicializarDisponibilidade() {
  const botao = document.getElementById("botao-salvar-disponibilidade");
  if (!botao) return;
  botao.addEventListener("click", salvarDisponibilidade);
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarAbas();
  inicializarVoltarFicha();
  inicializarDisponibilidade();
  carregarAgendamentos();
  carregarClientes();
});
