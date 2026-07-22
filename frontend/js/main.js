// Comportamentos gerais da Home

async function carregarImagemHero() {
  const img = document.getElementById("foto-hero");
  const placeholder = document.getElementById("placeholder-hero");
  if (!img || !placeholder) return;

  try {
    const resposta = await fetch("/api/imagens?categoria=hero");
    if (!resposta.ok) return;

    const imagens = await resposta.json();
    if (!imagens.length) return;

    img.src = imagens[0].url_imagem;
    img.alt = imagens[0].titulo || img.alt;
    img.classList.remove("oculto");
    placeholder.classList.add("oculto");
  } catch (erro) {
    // API indisponível: mantém o placeholder visível
  }
}

async function carregarConfiguracaoSite() {
  try {
    const resposta = await fetch("/api/configuracao");
    if (!resposta.ok) return;
    const configuracao = await resposta.json();

    const textoSobre = document.getElementById("texto-sobre");
    if (textoSobre && configuracao.texto_sobre) {
      textoSobre.textContent = configuracao.texto_sobre;
      textoSobre.classList.remove("oculto");
    }

    const textoPos = document.getElementById("texto-pos-procedimento");
    if (textoPos && configuracao.texto_pos_procedimento) {
      textoPos.textContent = configuracao.texto_pos_procedimento;
    }

    const itemEndereco = document.getElementById("item-endereco");
    const textoEndereco = document.getElementById("texto-endereco");
    if (itemEndereco && textoEndereco && configuracao.endereco) {
      textoEndereco.textContent = configuracao.endereco;
      itemEndereco.classList.remove("oculto");
    }

    const linkInstagram = document.getElementById("link-instagram");
    if (linkInstagram && configuracao.instagram_link) {
      linkInstagram.href = configuracao.instagram_link;
      linkInstagram.classList.remove("oculto");
    }

    const mapaPlaceholder = document.getElementById("mapa-placeholder");
    if (mapaPlaceholder && configuracao.mapa_embed_url) {
      const iframe = document.createElement("iframe");
      iframe.src = configuracao.mapa_embed_url;
      iframe.width = "100%";
      iframe.height = "100%";
      iframe.style.border = "0";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      mapaPlaceholder.replaceChildren(iframe);
    }
  } catch (erro) {
    // API indisponível: mantém os textos ocultos
  }
}

async function carregarServicos() {
  const grid = document.getElementById("grid-servicos");
  if (!grid) return;

  try {
    const resposta = await fetch("/api/servicos");
    if (!resposta.ok) return;
    const servicos = await resposta.json();

    grid.innerHTML = servicos
      .map(
        (servico) => `
      <div class="card-servico">
        <div class="icone">${servico.icone || ""}</div>
        <h3>${servico.titulo}</h3>
        <p>${servico.descricao}</p>
        ${servico.duracao_preco ? `<p class="duracao-preco">${servico.duracao_preco}</p>` : ""}
      </div>`
      )
      .join("");
  } catch (erro) {
    // API indisponível: grade de serviços fica vazia
  }
}

async function carregarGaleria() {
  const secao = document.getElementById("galeria");
  const grid = document.getElementById("grid-galeria");
  if (!secao || !grid) return;

  try {
    const resposta = await fetch("/api/imagens?categoria=galeria");
    if (!resposta.ok) return;
    const imagens = await resposta.json();
    if (!imagens.length) return;

    grid.innerHTML = imagens
      .map(
        (imagem) => `<img src="${imagem.url_imagem}" alt="${imagem.titulo || "Foto da galeria"}" class="foto-galeria">`
      )
      .join("");
    secao.classList.remove("oculto");
  } catch (erro) {
    // API indisponível: seção fica oculta
  }
}

async function carregarDepoimentos() {
  const secao = document.getElementById("depoimentos");
  const grid = document.getElementById("grid-depoimentos");
  if (!secao || !grid) return;

  try {
    const resposta = await fetch("/api/depoimentos");
    if (!resposta.ok) return;
    const depoimentos = await resposta.json();
    if (!depoimentos.length) return;

    grid.innerHTML = depoimentos
      .map(
        (depoimento) => `
      <div class="card-depoimento">
        <div class="estrelas">${"★".repeat(depoimento.estrelas)}${"☆".repeat(5 - depoimento.estrelas)}</div>
        <p>${depoimento.texto}</p>
        <div class="autor">— ${depoimento.autor}</div>
      </div>`
      )
      .join("");
    secao.classList.remove("oculto");
  } catch (erro) {
    // API indisponível: seção fica oculta
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const spanAno = document.getElementById("ano-atual");
  if (spanAno) {
    spanAno.textContent = new Date().getFullYear();
  }

  carregarImagemHero();
  carregarConfiguracaoSite();
  carregarServicos();
  carregarGaleria();
  carregarDepoimentos();
});
