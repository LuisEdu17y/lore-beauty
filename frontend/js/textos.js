// Lógica da tela Conteúdo > Textos: formulário único com os textos livres do site
// Depende de admin-common.js (chamarApi, login/logout) já carregado antes deste arquivo

async function carregarConfiguracao() {
  try {
    const configuracao = await chamarApi("/api/admin/configuracao");
    document.getElementById("texto-sobre").value = configuracao.texto_sobre || "";
    document.getElementById("texto-pos-procedimento").value = configuracao.texto_pos_procedimento || "";
    document.getElementById("endereco").value = configuracao.endereco || "";
    document.getElementById("instagram-link").value = configuracao.instagram_link || "";
    document.getElementById("mapa-embed-url").value = configuracao.mapa_embed_url || "";
  } catch (erro) {
    const mensagemErro = document.getElementById("mensagem-erro-textos");
    mensagemErro.textContent = erro.message;
    mensagemErro.style.display = "block";
  }
}

function inicializarFormulario() {
  document.getElementById("form-textos").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const mensagemErro = document.getElementById("mensagem-erro-textos");
    const mensagemSucesso = document.getElementById("mensagem-sucesso-textos");
    const botaoSalvar = document.getElementById("botao-salvar-textos");
    mensagemErro.style.display = "none";
    mensagemSucesso.style.display = "none";
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";

    const corpo = {
      texto_sobre: document.getElementById("texto-sobre").value.trim() || null,
      texto_pos_procedimento: document.getElementById("texto-pos-procedimento").value.trim() || null,
      endereco: document.getElementById("endereco").value.trim() || null,
      instagram_link: document.getElementById("instagram-link").value.trim() || null,
      mapa_embed_url: document.getElementById("mapa-embed-url").value.trim() || null,
    };

    try {
      await chamarApi("/api/admin/configuracao", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      mensagemSucesso.textContent = "Alterações salvas com sucesso.";
      mensagemSucesso.style.display = "block";
    } catch (erro) {
      mensagemErro.textContent = erro.message;
      mensagemErro.style.display = "block";
    } finally {
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar alterações";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarFormulario();
  carregarConfiguracao();
});
