// Lógica da tela Conteúdo > Serviços: listagem, edição, ordenação e ativação de serviços
// Depende de admin-common.js (chamarApi, login/logout) já carregado antes deste arquivo

let servicosCarregados = [];
let idEmEdicao = null;

// ---------- Listagem ----------
async function carregarServicos() {
  const corpo = document.getElementById("corpo-tabela-servicos");
  try {
    servicosCarregados = await chamarApi("/api/admin/servicos");
    renderizarTabela();
  } catch (erro) {
    corpo.innerHTML = `<tr><td colspan="7" class="estado-vazio">${erro.message}</td></tr>`;
  }
}

function servicosOrdenados() {
  return [...servicosCarregados].sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
}

function vizinhos(servico) {
  const lista = servicosOrdenados();
  const indice = lista.findIndex((s) => s.id === servico.id);
  return { anterior: lista[indice - 1], proxima: lista[indice + 1] };
}

function renderizarTabela() {
  const corpo = document.getElementById("corpo-tabela-servicos");
  const lista = servicosOrdenados();

  if (!lista.length) {
    corpo.innerHTML = `<tr><td colspan="7" class="estado-vazio">Nenhum serviço cadastrado ainda.</td></tr>`;
    return;
  }

  corpo.innerHTML = lista
    .map((servico) => {
      const { anterior, proxima } = vizinhos(servico);
      return `
      <tr data-id="${servico.id}">
        <td style="font-size: 1.4rem;">${servico.icone || ""}</td>
        <td>${servico.titulo}</td>
        <td>${servico.descricao}</td>
        <td>${servico.duracao_preco || "—"}</td>
        <td>
          <div class="botoes-ordem">
            <button type="button" class="botao-icone" data-acao="subir" ${anterior ? "" : "disabled"} title="Subir">&#9650;</button>
            <button type="button" class="botao-icone" data-acao="descer" ${proxima ? "" : "disabled"} title="Descer">&#9660;</button>
          </div>
        </td>
        <td>
          <button type="button" class="badge ${servico.ativo ? "badge-atendido" : "badge-cancelado"}" data-acao="alternar-status">
            ${servico.ativo ? "Ativo" : "Inativo"}
          </button>
        </td>
        <td>
          <button type="button" class="botao botao-secundario" data-acao="editar">Editar</button>
          <button type="button" class="botao botao-secundario" data-acao="excluir">Excluir</button>
        </td>
      </tr>`;
    })
    .join("");
}

async function trocarOrdem(servicoA, servicoB) {
  await Promise.all([
    chamarApi(`/api/admin/servicos/${servicoA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordem_exibicao: servicoB.ordem_exibicao }),
    }),
    chamarApi(`/api/admin/servicos/${servicoB.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordem_exibicao: servicoA.ordem_exibicao }),
    }),
  ]);
  await carregarServicos();
}

function inicializarAcoesTabela() {
  document.getElementById("corpo-tabela-servicos").addEventListener("click", async (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const linha = botao.closest("tr");
    const id = Number(linha.dataset.id);
    const servico = servicosCarregados.find((s) => s.id === id);
    if (!servico) return;

    const acao = botao.dataset.acao;

    if (acao === "editar") {
      abrirFormulario(servico);
      return;
    }

    if (acao === "excluir") {
      if (!confirm(`Excluir o serviço "${servico.titulo}"? Essa ação não pode ser desfeita.`)) return;
      try {
        await chamarApi(`/api/admin/servicos/${id}`, { method: "DELETE" });
        await carregarServicos();
      } catch (erro) {
        alert(erro.message);
      }
      return;
    }

    if (acao === "alternar-status") {
      try {
        await chamarApi(`/api/admin/servicos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !servico.ativo }),
        });
        await carregarServicos();
      } catch (erro) {
        alert(erro.message);
      }
      return;
    }

    if (acao === "subir" || acao === "descer") {
      const { anterior, proxima } = vizinhos(servico);
      const alvo = acao === "subir" ? anterior : proxima;
      if (!alvo) return;
      try {
        await trocarOrdem(servico, alvo);
      } catch (erro) {
        alert(erro.message);
      }
    }
  });
}

// ---------- Formulário (adicionar/editar) ----------
function abrirFormulario(servico = null) {
  const painel = document.getElementById("painel-formulario-servico");
  const listaWrapper = document.getElementById("lista-servicos-wrapper");
  const form = document.getElementById("form-servico");
  const mensagemErro = document.getElementById("mensagem-erro-servico");

  form.reset();
  mensagemErro.style.display = "none";

  idEmEdicao = servico ? servico.id : null;
  document.getElementById("titulo-formulario-servico").textContent = servico ? "Editar serviço" : "Adicionar serviço";

  if (servico) {
    document.getElementById("servico-titulo").value = servico.titulo;
    document.getElementById("servico-icone").value = servico.icone || "";
    document.getElementById("servico-descricao").value = servico.descricao;
    document.getElementById("servico-duracao-preco").value = servico.duracao_preco || "";
    document.getElementById("servico-ordem").value = servico.ordem_exibicao;
  } else {
    document.getElementById("servico-ordem").value = servicosCarregados.length;
  }

  listaWrapper.classList.add("oculto");
  painel.classList.remove("oculto");
}

function fecharFormulario() {
  document.getElementById("painel-formulario-servico").classList.add("oculto");
  document.getElementById("lista-servicos-wrapper").classList.remove("oculto");
}

function inicializarFormulario() {
  document.getElementById("botao-novo-servico").addEventListener("click", () => abrirFormulario());

  document.getElementById("voltar-lista-servicos").addEventListener("click", (evento) => {
    evento.preventDefault();
    fecharFormulario();
  });

  document.getElementById("form-servico").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const mensagemErro = document.getElementById("mensagem-erro-servico");
    const botaoSalvar = document.getElementById("botao-salvar-servico");
    mensagemErro.style.display = "none";
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    const corpo = {
      titulo: document.getElementById("servico-titulo").value.trim(),
      icone: document.getElementById("servico-icone").value.trim() || null,
      descricao: document.getElementById("servico-descricao").value.trim(),
      duracao_preco: document.getElementById("servico-duracao-preco").value.trim() || null,
      ordem_exibicao: Number(document.getElementById("servico-ordem").value),
    };

    try {
      if (idEmEdicao) {
        await chamarApi(`/api/admin/servicos/${idEmEdicao}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
      } else {
        await chamarApi("/api/admin/servicos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
      }

      await carregarServicos();
      fecharFormulario();
    } catch (erro) {
      mensagemErro.textContent = erro.message;
      mensagemErro.style.display = "block";
    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarAcoesTabela();
  inicializarFormulario();
  carregarServicos();
});
