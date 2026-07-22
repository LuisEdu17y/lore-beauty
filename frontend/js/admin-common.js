// Funções compartilhadas entre as páginas do painel admin: chamadas à API, login e logout

async function chamarApi(url, opcoes = {}) {
  const resposta = await fetch(url, { credentials: "include", ...opcoes });

  if (resposta.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Sessão expirada");
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => null);
    throw new Error(erro?.detail || "Erro na requisição");
  }

  if (resposta.status === 204) return null;
  return resposta.json();
}

function formatarData(dataISO) {
  return new Date(dataISO + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatarDataHora(dataISO) {
  return new Date(dataISO).toLocaleDateString("pt-BR");
}

function inicializarLogin() {
  const form = document.getElementById("form-login");
  if (!form) return;

  const mensagemErro = document.getElementById("mensagem-erro-login");
  const botao = document.getElementById("botao-login");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mensagemErro.style.display = "none";
    botao.disabled = true;
    botao.textContent = "Entrando...";

    try {
      await chamarApi("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: form.usuario.value.trim(),
          senha: form.senha.value,
        }),
      });
      window.location.href = "/admin/painel";
    } catch (erro) {
      mensagemErro.textContent = erro.message === "Sessão expirada" ? "Usuário ou senha inválidos" : erro.message;
      mensagemErro.style.display = "block";
    } finally {
      botao.disabled = false;
      botao.textContent = "Entrar";
    }
  });
}

function inicializarLogout() {
  const botaoSair = document.getElementById("botao-sair");
  if (!botaoSair) return;

  botaoSair.addEventListener("click", async () => {
    await chamarApi("/api/admin/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarLogin();
  inicializarLogout();
});
