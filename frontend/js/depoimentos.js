// Lógica da tela Conteúdo > Depoimentos: listagem, edição, ordenação e ativação
// Depende de admin-common.js (chamarApi, login/logout) já carregado antes deste arquivo

let depoimentosCarregados = [];
let idEmEdicao = null;

// ---------- Listagem ----------
async function carregarDepoimentos() {
  const corpo = document.getElementById("corpo-tabela-depoimentos");
  try {
    depoimentosCarregados = await chamarApi("/api/admin/depoimentos");
    renderizarTabela();
  } catch (erro) {
    corpo.innerHTML = `<tr><td colspan="6" class="estado-vazio">${erro.message}</td></tr>`;
  }
}

function depoimentosOrdenados() {
  return [...depoimentosCarregados].sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
}

function vizinhos(depoimento) {
  const lista = depoimentosOrdenados();
  const indice = lista.findIndex((d) => d.id === depoimento.id);
  return { anterior: lista[indice - 1], proxima: lista[indice + 1] };
}

function truncar(texto, tamanho) {
  return texto.length > tamanho ? `${texto.slice(0, tamanho)}…` : texto;
}

function renderizarTabela() {
  const corpo = document.getElementById("corpo-tabela-depoimentos");
  const lista = depoimentosOrdenados();

  if (!lista.length) {
    corpo.innerHTML = `<tr><td colspan="6" class="estado-vazio">Nenhum depoimento cadastrado ainda.</td></tr>`;
    return;
  }

  corpo.innerHTML = lista
    .map((depoimento) => {
      const { anterior, proxima } = vizinhos(depoimento);
      return `
      <tr data-id="${depoimento.id}">
        <td>${depoimento.autor}</td>
        <td>${truncar(depoimento.texto, 60)}</td>
        <td>${"★".repeat(depoimento.estrelas)}${"☆".repeat(5 - depoimento.estrelas)}</td>
        <td>
          <div class="botoes-ordem">
            <button type="button" class="botao-icone" data-acao="subir" ${anterior ? "" : "disabled"} title="Subir">&#9650;</button>
            <button type="button" class="botao-icone" data-acao="descer" ${proxima ? "" : "disabled"} title="Descer">&#9660;</button>
          </div>
        </td>
        <td>
          <button type="button" class="badge ${depoimento.ativo ? "badge-atendido" : "badge-cancelado"}" data-acao="alternar-status">
            ${depoimento.ativo ? "Ativo" : "Inativo"}
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

async function trocarOrdem(depoimentoA, depoimentoB) {
  await Promise.all([
    chamarApi(`/api/admin/depoimentos/${depoimentoA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordem_exibicao: depoimentoB.ordem_exibicao }),
    }),
    chamarApi(`/api/admin/depoimentos/${depoimentoB.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordem_exibicao: depoimentoA.ordem_exibicao }),
    }),
  ]);
  await carregarDepoimentos();
}

function inicializarAcoesTabela() {
  document.getElementById("corpo-tabela-depoimentos").addEventListener("click", async (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const linha = botao.closest("tr");
    const id = Number(linha.dataset.id);
    const depoimento = depoimentosCarregados.find((d) => d.id === id);
    if (!depoimento) return;

    const acao = botao.dataset.acao;

    if (acao === "editar") {
      abrirFormulario(depoimento);
      return;
    }

    if (acao === "excluir") {
      if (!confirm(`Excluir o depoimento de "${depoimento.autor}"? Essa ação não pode ser desfeita.`)) return;
      try {
        await chamarApi(`/api/admin/depoimentos/${id}`, { method: "DELETE" });
        await carregarDepoimentos();
      } catch (erro) {
        alert(erro.message);
      }
      return;
    }

    if (acao === "alternar-status") {
      try {
        await chamarApi(`/api/admin/depoimentos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !depoimento.ativo }),
        });
        await carregarDepoimentos();
      } catch (erro) {
        alert(erro.message);
      }
      return;
    }

    if (acao === "subir" || acao === "descer") {
      const { anterior, proxima } = vizinhos(depoimento);
      const alvo = acao === "subir" ? anterior : proxima;
      if (!alvo) return;
      try {
        await trocarOrdem(depoimento, alvo);
      } catch (erro) {
        alert(erro.message);
      }
    }
  });
}

// ---------- Formulário (adicionar/editar) ----------
function abrirFormulario(depoimento = null) {
  const painel = document.getElementById("painel-formulario-depoimento");
  const listaWrapper = document.getElementById("lista-depoimentos-wrapper");
  const form = document.getElementById("form-depoimento");
  const mensagemErro = document.getElementById("mensagem-erro-depoimento");

  form.reset();
  mensagemErro.style.display = "none";

  idEmEdicao = depoimento ? depoimento.id : null;
  document.getElementById("titulo-formulario-depoimento").textContent = depoimento
    ? "Editar depoimento"
    : "Adicionar depoimento";

  if (depoimento) {
    document.getElementById("depoimento-autor").value = depoimento.autor;
    document.getElementById("depoimento-texto").value = depoimento.texto;
    document.getElementById("depoimento-estrelas").value = depoimento.estrelas;
    document.getElementById("depoimento-ordem").value = depoimento.ordem_exibicao;
  } else {
    document.getElementById("depoimento-ordem").value = depoimentosCarregados.length;
  }

  listaWrapper.classList.add("oculto");
  painel.classList.remove("oculto");
}

function fecharFormulario() {
  document.getElementById("painel-formulario-depoimento").classList.add("oculto");
  document.getElementById("lista-depoimentos-wrapper").classList.remove("oculto");
}

function inicializarFormulario() {
  document.getElementById("botao-novo-depoimento").addEventListener("click", () => abrirFormulario());

  document.getElementById("voltar-lista-depoimentos").addEventListener("click", (evento) => {
    evento.preventDefault();
    fecharFormulario();
  });

  document.getElementById("form-depoimento").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const mensagemErro = document.getElementById("mensagem-erro-depoimento");
    const botaoSalvar = document.getElementById("botao-salvar-depoimento");
    mensagemErro.style.display = "none";
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    const corpo = {
      autor: document.getElementById("depoimento-autor").value.trim(),
      texto: document.getElementById("depoimento-texto").value.trim(),
      estrelas: Number(document.getElementById("depoimento-estrelas").value),
      ordem_exibicao: Number(document.getElementById("depoimento-ordem").value),
    };

    try {
      if (idEmEdicao) {
        await chamarApi(`/api/admin/depoimentos/${idEmEdicao}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
      } else {
        await chamarApi("/api/admin/depoimentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(corpo),
        });
      }

      await carregarDepoimentos();
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
  carregarDepoimentos();
});
