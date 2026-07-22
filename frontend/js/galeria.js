// Lógica da tela Conteúdo > Galeria: upload, listagem, edição, ordenação e ativação de imagens
// Depende de admin-common.js (chamarApi, formatarDataHora, login/logout) já carregado antes deste arquivo

const CATEGORIAS_IMAGEM = {
  hero: "Hero principal",
  carrossel: "Carrossel",
  galeria: "Galeria",
  antes_depois: "Antes e Depois",
  banner: "Banner promocional",
};

let imagensCarregadas = [];
let idEmEdicao = null;

// ---------- Listagem ----------
async function carregarImagens() {
  const corpo = document.getElementById("corpo-tabela-imagens");
  try {
    imagensCarregadas = await chamarApi("/api/admin/imagens");
    renderizarTabela();
  } catch (erro) {
    corpo.innerHTML = `<tr><td colspan="7" class="estado-vazio">${erro.message}</td></tr>`;
  }
}

function imagensDaMesmaCategoria(categoria) {
  return imagensCarregadas
    .filter((img) => img.categoria === categoria)
    .sort((a, b) => a.ordem_exibicao - b.ordem_exibicao);
}

function vizinhos(imagem) {
  const grupo = imagensDaMesmaCategoria(imagem.categoria);
  const indice = grupo.findIndex((img) => img.id === imagem.id);
  return { anterior: grupo[indice - 1], proxima: grupo[indice + 1] };
}

function renderizarTabela() {
  const corpo = document.getElementById("corpo-tabela-imagens");
  const filtro = document.getElementById("filtro-categoria").value;

  const lista = filtro
    ? imagensCarregadas.filter((img) => img.categoria === filtro)
    : imagensCarregadas;

  if (!lista.length) {
    corpo.innerHTML = `<tr><td colspan="7" class="estado-vazio">Nenhuma imagem cadastrada ainda.</td></tr>`;
    return;
  }

  corpo.innerHTML = lista
    .map((imagem) => {
      const { anterior, proxima } = vizinhos(imagem);
      return `
      <tr data-id="${imagem.id}">
        <td><img src="${imagem.url_imagem}" alt="${imagem.titulo}" class="miniatura"></td>
        <td>${imagem.titulo}</td>
        <td>${CATEGORIAS_IMAGEM[imagem.categoria] || imagem.categoria}</td>
        <td>
          <div class="botoes-ordem">
            <button type="button" class="botao-icone" data-acao="subir" ${anterior ? "" : "disabled"} title="Subir">&#9650;</button>
            <button type="button" class="botao-icone" data-acao="descer" ${proxima ? "" : "disabled"} title="Descer">&#9660;</button>
          </div>
        </td>
        <td>
          <button type="button" class="badge ${imagem.ativo ? "badge-atendido" : "badge-cancelado"}" data-acao="alternar-status">
            ${imagem.ativo ? "Ativo" : "Inativo"}
          </button>
        </td>
        <td>${formatarDataHora(imagem.criado_em)}</td>
        <td>
          <button type="button" class="botao botao-secundario" data-acao="editar">Editar</button>
          <button type="button" class="botao botao-secundario" data-acao="excluir">Excluir</button>
        </td>
      </tr>`;
    })
    .join("");
}

async function trocarOrdem(imagemA, imagemB) {
  await Promise.all([
    chamarApi(`/api/admin/imagens/${imagemA.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordem_exibicao: imagemB.ordem_exibicao }),
    }),
    chamarApi(`/api/admin/imagens/${imagemB.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ordem_exibicao: imagemA.ordem_exibicao }),
    }),
  ]);
  await carregarImagens();
}

function inicializarAcoesTabela() {
  document.getElementById("corpo-tabela-imagens").addEventListener("click", async (evento) => {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const linha = botao.closest("tr");
    const id = Number(linha.dataset.id);
    const imagem = imagensCarregadas.find((img) => img.id === id);
    if (!imagem) return;

    const acao = botao.dataset.acao;

    if (acao === "editar") {
      abrirFormulario(imagem);
      return;
    }

    if (acao === "excluir") {
      if (!confirm(`Excluir a imagem "${imagem.titulo}"? Essa ação não pode ser desfeita.`)) return;
      try {
        await chamarApi(`/api/admin/imagens/${id}`, { method: "DELETE" });
        await carregarImagens();
      } catch (erro) {
        alert(erro.message);
      }
      return;
    }

    if (acao === "alternar-status") {
      try {
        await chamarApi(`/api/admin/imagens/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativo: !imagem.ativo }),
        });
        await carregarImagens();
      } catch (erro) {
        alert(erro.message);
      }
      return;
    }

    if (acao === "subir" || acao === "descer") {
      const { anterior, proxima } = vizinhos(imagem);
      const alvo = acao === "subir" ? anterior : proxima;
      if (!alvo) return;
      try {
        await trocarOrdem(imagem, alvo);
      } catch (erro) {
        alert(erro.message);
      }
    }
  });
}

// ---------- Formulário (adicionar/editar) ----------
function proximaOrdemPadrao(categoria) {
  const grupo = imagensDaMesmaCategoria(categoria);
  return grupo.length;
}

function abrirFormulario(imagem = null) {
  const painel = document.getElementById("painel-formulario-imagem");
  const listaWrapper = document.getElementById("lista-imagens-wrapper");
  const form = document.getElementById("form-imagem");
  const campoArquivo = document.getElementById("campo-arquivo-imagem");
  const inputArquivo = document.getElementById("imagem-arquivo");
  const preview = document.getElementById("preview-arquivo-imagem");
  const mensagemErro = document.getElementById("mensagem-erro-imagem");

  form.reset();
  mensagemErro.style.display = "none";
  preview.classList.add("oculto");
  inputArquivo.required = !imagem;
  campoArquivo.classList.toggle("oculto", Boolean(imagem));

  idEmEdicao = imagem ? imagem.id : null;
  document.getElementById("titulo-formulario-imagem").textContent = imagem ? "Editar imagem" : "Adicionar imagem";

  if (imagem) {
    document.getElementById("imagem-titulo").value = imagem.titulo;
    document.getElementById("imagem-descricao").value = imagem.descricao || "";
    document.getElementById("imagem-categoria").value = imagem.categoria;
    document.getElementById("imagem-ordem").value = imagem.ordem_exibicao;
  } else {
    const categoriaInicial = document.getElementById("imagem-categoria").value;
    document.getElementById("imagem-ordem").value = proximaOrdemPadrao(categoriaInicial);
  }

  listaWrapper.classList.add("oculto");
  painel.classList.remove("oculto");
}

function fecharFormulario() {
  document.getElementById("painel-formulario-imagem").classList.add("oculto");
  document.getElementById("lista-imagens-wrapper").classList.remove("oculto");
}

function inicializarFormulario() {
  document.getElementById("botao-nova-imagem").addEventListener("click", () => abrirFormulario());

  document.getElementById("voltar-lista-imagens").addEventListener("click", (evento) => {
    evento.preventDefault();
    fecharFormulario();
  });

  // Ao trocar a categoria num cadastro novo, sugere a próxima ordem daquela categoria
  document.getElementById("imagem-categoria").addEventListener("change", (evento) => {
    if (idEmEdicao) return;
    document.getElementById("imagem-ordem").value = proximaOrdemPadrao(evento.target.value);
  });

  document.getElementById("imagem-arquivo").addEventListener("change", (evento) => {
    const preview = document.getElementById("preview-arquivo-imagem");
    const arquivo = evento.target.files[0];
    if (!arquivo) {
      preview.classList.add("oculto");
      return;
    }
    preview.src = URL.createObjectURL(arquivo);
    preview.classList.remove("oculto");
  });

  document.getElementById("form-imagem").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const mensagemErro = document.getElementById("mensagem-erro-imagem");
    const botaoSalvar = document.getElementById("botao-salvar-imagem");
    mensagemErro.style.display = "none";
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    try {
      if (idEmEdicao) {
        await chamarApi(`/api/admin/imagens/${idEmEdicao}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: document.getElementById("imagem-titulo").value.trim(),
            descricao: document.getElementById("imagem-descricao").value.trim() || null,
            categoria: document.getElementById("imagem-categoria").value,
            ordem_exibicao: Number(document.getElementById("imagem-ordem").value),
          }),
        });
      } else {
        const dadosForm = new FormData();
        dadosForm.append("titulo", document.getElementById("imagem-titulo").value.trim());
        dadosForm.append("descricao", document.getElementById("imagem-descricao").value.trim());
        dadosForm.append("categoria", document.getElementById("imagem-categoria").value);
        dadosForm.append("ordem_exibicao", document.getElementById("imagem-ordem").value);
        dadosForm.append("arquivo", document.getElementById("imagem-arquivo").files[0]);

        await chamarApi("/api/admin/imagens", { method: "POST", body: dadosForm });
      }

      await carregarImagens();
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
  document.getElementById("filtro-categoria").addEventListener("change", renderizarTabela);
  inicializarAcoesTabela();
  inicializarFormulario();
  carregarImagens();
});
