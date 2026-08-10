<h1 align="center">Lore Beauty</h1>

<p align="center">
  Plataforma web para presença digital, agendamento e gestão administrativa de clientes de um estúdio de cílios e sobrancelha.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python 3.10+">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/SQLModel-7E56C2" alt="SQLModel">
  <img src="https://img.shields.io/badge/SQLite%20%2F%20PostgreSQL-003B57?logo=sqlite&logoColor=white" alt="SQLite / PostgreSQL">
  <img src="https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white" alt="Cloudinary">
</p>

---

## Sobre o projeto

O **Lore Beauty** é a aplicação web da **LORE — Cílios em Tela & Sobrancelha**, um estúdio de beleza que oferece cílios em tela, brow lamination, design de sobrancelha, buço e atendimento masculino.

Não se trata de um projeto fictício ou de um exercício acadêmico: o sistema foi desenvolvido para atender a uma necessidade real de um pequeno negócio, unindo duas frentes que normalmente exigiriam duas ferramentas distintas:

1. **Uma vitrine digital** — landing page responsiva que apresenta os serviços, o portfólio de trabalhos e o caminho para o agendamento.
2. **Uma ferramenta de gestão** — painel administrativo onde a profissional acompanha as solicitações recebidas, mantém a ficha de cada cliente com histórico de atendimentos e edita o conteúdo do próprio site sem depender de desenvolvedor.

O público-alvo da interface pública são as clientes do estúdio (majoritariamente em acesso mobile). O público do painel é a própria profissional, que opera o sistema como usuária única.

---

## Contexto e problema

Pequenos negócios de beleza costumam operar inteiramente pelo WhatsApp e por anotações informais. Isso gera três problemas recorrentes:

- **Ausência de presença digital estruturada.** Sem um site, a apresentação dos serviços depende de mensagens repetidas manualmente a cada nova cliente.
- **Solicitações dispersas.** Pedidos de horário chegam misturados a conversas pessoais, sem registro consolidado do que foi pedido, quando e por quem.
- **Histórico perdido.** Informações relevantes para o atendimento (sensibilidades, alergias, preferências de técnica, serviços já realizados) ficam na memória ou espalhadas em conversas antigas.

A aplicação ataca esses pontos de forma direta: centraliza a apresentação do negócio, transforma o pedido de horário em um registro estruturado no banco de dados e converte automaticamente cada atendimento concluído em histórico consultável na ficha da cliente.

Uma decisão de produto importante é que o sistema **não substitui o WhatsApp — ele o alimenta**. O formulário registra a solicitação e, na tela de confirmação, gera um link `wa.me` com a mensagem já preenchida, mantendo o canal de conversa que a cliente já conhece e no qual confia.

---

## Principais funcionalidades

### Site público

- 🏠 **Landing page** com seções de Hero, Sobre, Serviços, Galeria, Antes e Depois, Como funciona, Depoimentos, Banner e Localização.
- 🖼️ **Conteúdo dinâmico** — serviços, depoimentos, imagens e textos são carregados da API, não estão fixos no HTML.
- 🎠 **Carrossel de destaques** com navegação por setas, indicadores e avanço automático a cada 5 segundos.
- 📅 **Formulário de agendamento** com máscara de telefone, data mínima igual ao dia atual, horários gerados dinamicamente de 14h às 20h em intervalos de 30 minutos e validação campo a campo.
- 💬 **Fallback para WhatsApp** — após o envio, a tela de confirmação oferece um link `wa.me` com a mensagem de agendamento pré-montada.
- 🙈 **Degradação silenciosa** — seções cujo conteúdo ainda não foi cadastrado (galeria, antes/depois, depoimentos, carrossel, banner) permanecem ocultas em vez de exibir áreas vazias.

### Painel administrativo

- 🔐 **Login** com usuário único, senha em hash bcrypt e sessão via JWT em cookie `httpOnly`.
- 📋 **Gestão de solicitações** — listagem de todos os agendamentos recebidos e alteração de status (`pendente`, `confirmado`, `atendido`, `cancelado`) direto na tabela.
- 🔄 **Sincronização automática de histórico** — ao marcar uma solicitação como `atendido`, o sistema localiza a cliente pelo WhatsApp (ou cria a ficha, se for a primeira vez) e registra um atendimento vinculado ao agendamento de origem.
- 👥 **Ficha da cliente** — dados de contato, campo de observações gerais editável e histórico de atendimentos em ordem cronológica decrescente.
- 🗂️ **CMS de imagens** — upload para o Cloudinary, categorização (`hero`, `carrossel`, `galeria`, `antes_depois`, `banner`), reordenação, ativação/desativação e exclusão (que remove o arquivo também do Cloudinary).
- ✂️ **CMS de serviços** — cadastro, edição, ordenação, ativação e exclusão, com campos de ícone, descrição e duração/preço.
- ⭐ **CMS de depoimentos** — cadastro com autor, texto e nota de 1 a 5 estrelas.
- 📝 **CMS de textos** — edição do texto "Sobre", cuidados pós-procedimento, endereço, link do Instagram e URL de embed do mapa.

---

## Tecnologias utilizadas

### Backend
- **Python**
- **FastAPI** — framework da API e servidor das páginas HTML
- **SQLModel** — ORM e definição dos modelos de tabela
- **Pydantic** — schemas de entrada/saída e validação de dados
- **Uvicorn** (`uvicorn[standard]`) — servidor ASGI
- **python-multipart** — parsing do `multipart/form-data` no upload de imagens
- **python-dotenv** — carregamento de variáveis de ambiente a partir de `.env`

### Frontend
- **HTML5** semântico
- **CSS3** puro, escrito em abordagem *mobile-first*, com variáveis CSS para paleta e tipografia
- **JavaScript (ES6+)** sem frameworks nem build step — `fetch`, `async/await` e manipulação direta do DOM
- **Google Fonts** — Playfair Display e Poppins

### Banco de dados
- **SQLite** — padrão em desenvolvimento
- **PostgreSQL** — suportado em produção via `LORE_DATABASE_URL` (driver `psycopg2-binary` já incluído nas dependências)

### Segurança
- **PyJWT** — geração e validação do token de sessão (HS256)
- **bcrypt** — hash da senha administrativa
- **Cookie `httpOnly`** com `SameSite=Lax` para transporte do token

### Armazenamento de mídia
- **Cloudinary** — hospedagem das imagens enviadas pelo painel

### Infraestrutura / Deploy
- **Procfile** — processo `web` configurado para plataformas do tipo Heroku/Render

---

## Arquitetura

A aplicação é um **monólito servido inteiramente pelo FastAPI**: a mesma instância entrega as páginas HTML, os arquivos estáticos e a API REST. Não há build step, bundler ou servidor de frontend separado.

```text
Navegador
   │
   ├── HTML/CSS/JS ──► FastAPI (FileResponse + StaticFiles)
   │
   └── fetch() ──────► FastAPI
                          │
                          ├── routers/   ── validação (schemas Pydantic)
                          │                  └── autenticação (auth.exigir_admin)
                          │
                          ├── models/    ── SQLModel
                          │                  └── SQLite ou PostgreSQL
                          │
                          └── storage.py ── Cloudinary (upload/remoção de arquivos)
```

Pontos relevantes do desenho:

- **Rotas públicas e administrativas convivem no mesmo router**, separadas pelo prefixo (`/api/...` vs `/api/admin/...`) e pela dependency `exigir_admin`. Rotas públicas retornam schemas enxutos; rotas administrativas retornam o registro completo.
- **O frontend não conhece o banco.** Todo dado exibido no site vem de chamadas `fetch` à API, o que permite que o conteúdo mude pelo painel sem alteração de código.
- **O armazenamento de arquivos está isolado** em `storage.py`, de modo que uma futura troca de provedor (S3, Supabase Storage) fique restrita a um único módulo.

---

## Estrutura do projeto

```text
lore-beauty/
├── backend/
│   ├── main.py                 # App FastAPI: startup, rotas de página, mount dos estáticos
│   ├── database.py             # Engine, sessão, criação de tabelas e seed de serviços padrão
│   ├── models.py               # Modelos SQLModel e listas de valores válidos
│   ├── schemas.py              # Schemas Pydantic de entrada/saída com validadores
│   ├── auth.py                 # bcrypt, JWT e dependency exigir_admin
│   ├── storage.py              # Upload e remoção de imagens no Cloudinary
│   ├── requirements.txt        # Aponta para o requirements.txt da raiz
│   └── routers/
│       ├── __init__.py
│       ├── admin.py            # Login e logout
│       ├── agendamentos.py     # POST público + gestão e sincronização de histórico
│       ├── clientes.py         # Listagem, ficha e observações (somente admin)
│       ├── imagens.py          # CMS de imagens + rota pública por categoria
│       └── conteudo.py         # CMS de configuração do site, serviços e depoimentos
│
├── frontend/
│   ├── index.html              # Landing page
│   ├── agendamento.html        # Formulário de agendamento
│   ├── admin/
│   │   ├── login.html
│   │   ├── painel.html                # Abas Solicitações e Clientes
│   │   ├── conteudo-galeria.html      # CMS de imagens
│   │   ├── conteudo-servicos.html     # CMS de serviços
│   │   ├── conteudo-depoimentos.html  # CMS de depoimentos
│   │   └── conteudo-textos.html       # CMS de textos livres
│   ├── css/
│   │   └── styles.css          # Folha única, mobile-first
│   ├── js/
│   │   ├── main.js             # Carregamento dinâmico das seções da home
│   │   ├── agendamento.js      # Máscara, validação, envio e link do WhatsApp
│   │   ├── admin-common.js     # chamarApi(), login, logout e formatação de datas
│   │   ├── admin.js            # Abas, solicitações, clientes e ficha
│   │   ├── galeria.js          # CMS de imagens
│   │   ├── servicos.js         # CMS de serviços
│   │   ├── depoimentos.js      # CMS de depoimentos
│   │   └── textos.js           # CMS de textos
│   └── assets/                 # favicon, apple-touch-icon e imagem local
│
├── requirements.txt            # Dependências do projeto
├── Procfile                    # Comando de execução em produção
├── .gitignore
└── README.md
```

---

## Como executar localmente

### Pré-requisitos

- Python 3.10 ou superior (o código usa a sintaxe `str | None`)
- Git
- Uma conta no Cloudinary, **apenas** se você for testar o upload de imagens pelo painel

### 1. Clone o repositório

```bash
git clone https://github.com/LuisEdu17y/lore-beauty.git
cd lore-beauty
```

### 2. Crie e ative o ambiente virtual

O ambiente virtual deve ser criado dentro de `backend/` — é esse o caminho já previsto no `.gitignore`.

**Windows (PowerShell / CMD):**

```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**Linux / macOS:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 3. Instale as dependências

Ainda dentro de `backend/`:

```bash
pip install -r requirements.txt
```

O `backend/requirements.txt` apenas referencia o `requirements.txt` da raiz, que concentra a lista real de pacotes.

### 4. Configure as variáveis de ambiente (opcional em desenvolvimento)

Crie um arquivo `.env` na pasta `backend/` — ele é carregado por `python-dotenv` e já está coberto pelo `.gitignore`. Sem nenhuma variável definida, a aplicação sobe com valores padrão de desenvolvimento (ver a seção [Variáveis de ambiente](#variáveis-de-ambiente)).

### 5. Execute o servidor

Os módulos do backend usam imports diretos (`from database import ...`), portanto o servidor **precisa** ser iniciado de dentro da pasta `backend/`:

```bash
uvicorn main:app --reload
```

Na primeira execução, o banco `lore.db` é criado automaticamente e a tabela de serviços é populada com os cinco serviços padrão.

### 6. Acesse

| Página | URL |
| --- | --- |
| Site | http://localhost:8000 |
| Agendamento | http://localhost:8000/agendamento |
| Login do painel | http://localhost:8000/admin/login |
| Painel administrativo | http://localhost:8000/admin/painel |
| CMS — Fotos | http://localhost:8000/admin/conteudo/galeria |
| CMS — Serviços | http://localhost:8000/admin/conteudo/servicos |
| CMS — Depoimentos | http://localhost:8000/admin/conteudo/depoimentos |
| CMS — Textos | http://localhost:8000/admin/conteudo/textos |
| Documentação Swagger (gerada pelo FastAPI) | http://localhost:8000/docs |
| Documentação ReDoc | http://localhost:8000/redoc |

### Credenciais padrão de desenvolvimento

Se `LORE_ADMIN_USUARIO`, `LORE_ADMIN_SENHA` e `LORE_ADMIN_SENHA_HASH` não forem definidas, a aplicação sobe com um usuário padrão de desenvolvimento e uma senha placeholder cujo hash é gerado em tempo de execução. Esses valores são de conveniência local e **precisam ser substituídos antes de qualquer uso em produção**. Os valores exatos estão em `backend/auth.py`.

---

## Variáveis de ambiente

Todas as variáveis abaixo foram confirmadas diretamente no código-fonte.

| Variável | Obrigatória em produção | Descrição |
| --- | --- | --- |
| `LORE_SECRET_KEY` | **Sim** | Chave usada para assinar e validar o JWT de sessão (HS256). Sem ela, é usada uma chave de desenvolvimento pública neste repositório. |
| `LORE_ADMIN_USUARIO` | **Sim** | Nome de usuário do painel administrativo. |
| `LORE_ADMIN_SENHA_HASH` | **Sim** | Hash bcrypt da senha do painel. Tem precedência sobre `LORE_ADMIN_SENHA`. |
| `LORE_ADMIN_SENHA` | Não | Senha em texto plano cujo hash é gerado no startup. Existe apenas como atalho de desenvolvimento — **não use em produção**. |
| `LORE_DATABASE_URL` | Recomendada | URL de conexão do banco. Padrão: `sqlite:///./lore.db`. Em produção, aponte para um PostgreSQL gerenciado. |
| `CLOUDINARY_CLOUD_NAME` | Sim, se usar upload | Nome da cloud no Cloudinary. |
| `CLOUDINARY_API_KEY` | Sim, se usar upload | Chave de API do Cloudinary. |
| `CLOUDINARY_API_SECRET` | Sim, se usar upload | Segredo de API do Cloudinary. |

Para gerar o hash da senha:

```bash
python -c "import bcrypt; print(bcrypt.hashpw(b'SUA_SENHA_AQUI', bcrypt.gensalt()).decode())"
```

Exemplo de `.env` (**nunca versione este arquivo — ele já está no `.gitignore`**):

```env
LORE_SECRET_KEY=chave-longa-e-aleatoria
LORE_ADMIN_USUARIO=seu_usuario
LORE_ADMIN_SENHA_HASH=hash-bcrypt-gerado-pelo-comando-acima
LORE_DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Autenticação e segurança

### Como funciona o login

1. O formulário em `/admin/login` envia `usuario` e `senha` via `POST /api/admin/login`.
2. `auth.autenticar_admin` compara o usuário informado com `ADMIN_USUARIO` e verifica a senha contra o hash bcrypt com `bcrypt.checkpw`. Credenciais inválidas retornam `401` — a mensagem de erro não distingue usuário incorreto de senha incorreta.
3. Em caso de sucesso, é gerado um JWT (HS256) com `sub` e `exp`, válido por **8 horas**.
4. O token é gravado em um cookie `access_token` com as flags `httpOnly` e `SameSite=Lax`. Como é `httpOnly`, o JavaScript da página não consegue lê-lo, o que reduz o impacto de um eventual XSS.
5. Toda rota administrativa declara `Depends(exigir_admin)`, que lê o cookie, decodifica o token e devolve `401` se ele estiver ausente, inválido ou expirado.
6. No frontend, `chamarApi()` intercepta qualquer `401` e redireciona automaticamente para a tela de login.

### Tratamento dos dados de clientes

- Nenhuma rota pública expõe dados de clientes. `POST /api/agendamentos` apenas **grava** — não há rota pública de leitura de agendamentos, clientes ou atendimentos.
- Todos os endpoints de leitura de dados pessoais estão sob `/api/admin/` e protegidos pela dependency de autenticação.
- Não há logging de campos pessoais em texto plano.

### Limitações conhecidas

Documentadas aqui de forma honesta, e não como afirmação de que o sistema é "totalmente seguro":

- O cookie de sessão **não define a flag `Secure`**, então depende de o deploy estar integralmente sob HTTPS para não trafegar em conexão aberta.
- Não há proteção CSRF dedicada (token sincronizador) — a defesa atual se apoia apenas em `SameSite=Lax`.
- O logout apenas apaga o cookie no navegador; **o JWT continua tecnicamente válido até expirar**, pois não existe lista de revogação no servidor.
- Existe um **único usuário administrativo**, definido por variável de ambiente. Não há tabela de usuários, troca de senha pela interface nem controle de acesso por perfil.
- Não há *rate limiting* nem CAPTCHA em `POST /api/agendamentos`, o que deixa o endpoint público exposto a envios automatizados em massa.
- O upload de imagens valida o tipo apenas no cliente (`accept="image/*"`); **não há validação de MIME type nem limite de tamanho no servidor**.
- O frontend renderiza conteúdo vindo da API com `innerHTML` sem escape. Como esse conteúdo é cadastrado exclusivamente pela administradora autenticada, o risco é baixo, mas a prática correta seria escapar a saída.
- A documentação automática do FastAPI (`/docs` e `/redoc`) fica **acessível publicamente**, expondo o mapa completo dos endpoints.

---

## Banco de dados

O acesso é feito via SQLModel sobre SQLAlchemy. A URL de conexão vem de `LORE_DATABASE_URL`, com `sqlite:///./lore.db` como padrão. O argumento `check_same_thread=False` é aplicado condicionalmente, apenas quando a URL é SQLite — o driver do PostgreSQL não o aceita.

No evento de startup, `criar_banco_e_tabelas()` executa `SQLModel.metadata.create_all(engine)` e `seed_servicos_padrao()` insere os cinco serviços iniciais **somente se a tabela estiver vazia**, evitando sobrescrever alterações feitas pelo painel.

### Modelos

| Modelo | Responsabilidade | Campos principais |
| --- | --- | --- |
| `Agendamento` | Solicitação enviada pelo formulário público | `nome_cliente`, `whatsapp`, `servico`, `data_preferida`, `horario_preferido`, `observacoes`, `status`, `criado_em` |
| `Cliente` | Ficha consolidada da cliente | `nome`, `whatsapp` (único e indexado), `observacoes_gerais`, `criado_em` |
| `Atendimento` | Registro de um atendimento realizado | `cliente_id` (FK), `agendamento_origem_id` (FK, opcional), `servico`, `data`, `observacoes` |
| `Imagem` | Metadados da imagem gerenciada pelo CMS | `titulo`, `descricao`, `url_imagem`, `cloudinary_public_id`, `categoria`, `ordem_exibicao`, `ativo` |
| `ConfiguracaoSite` | Linha única (`id=1`) com os textos livres do site | `texto_sobre`, `texto_pos_procedimento`, `endereco`, `instagram_link`, `mapa_embed_url` |
| `Servico` | Serviço exibido na home | `titulo`, `icone`, `descricao`, `duracao_preco`, `ordem_exibicao`, `ativo` |
| `Depoimento` | Depoimento exibido na home | `autor`, `texto`, `estrelas`, `ordem_exibicao`, `ativo` |

### Relacionamentos

```text
Cliente 1 ──── N Atendimento
                     │
                     └── N:1 (opcional) Agendamento   [agendamento_origem_id]
```

O vínculo entre `Agendamento` e `Cliente` é feito **pelo número de WhatsApp**, que é campo único na tabela `Cliente`. Ao mudar o status de um agendamento para `atendido`, a função `_sincronizar_cliente_e_atendimento` busca a cliente por esse número, cria a ficha se ela não existir e registra o `Atendimento` correspondente. As chaves estrangeiras estão declaradas com `Field(foreign_key=...)`, mas os modelos não definem `Relationship` do SQLModel — as consultas relacionais são feitas explicitamente com `select()`.

---

## API

A documentação interativa é gerada automaticamente pelo FastAPI em `/docs` (Swagger UI) e `/redoc`.

Autenticação: as rotas marcadas como protegidas exigem o cookie `access_token` emitido no login.

### Rotas públicas

| Método | Endpoint | Auth | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/agendamentos` | Não | Cria uma solicitação de agendamento |
| `GET` | `/api/imagens?categoria={categoria}` | Não | Lista imagens ativas de uma categoria |
| `GET` | `/api/configuracao` | Não | Retorna os textos livres do site |
| `GET` | `/api/servicos` | Não | Lista os serviços ativos |
| `GET` | `/api/depoimentos` | Não | Lista os depoimentos ativos |

### Autenticação

| Método | Endpoint | Auth | Descrição |
| --- | --- | --- | --- |
| `POST` | `/api/admin/login` | Não | Autentica e emite o cookie de sessão |
| `POST` | `/api/admin/logout` | Não | Remove o cookie de sessão |

### Agendamentos e clientes

| Método | Endpoint | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/admin/agendamentos` | Sim | Lista todas as solicitações |
| `PATCH` | `/api/admin/agendamentos/{id}` | Sim | Atualiza o status; se for `atendido`, gera cliente e histórico |
| `GET` | `/api/admin/clientes` | Sim | Lista clientes com a data do último atendimento |
| `GET` | `/api/admin/clientes/{id}` | Sim | Ficha completa com histórico de atendimentos |
| `PATCH` | `/api/admin/clientes/{id}` | Sim | Atualiza as observações gerais da cliente |

### CMS

| Método | Endpoint | Auth | Descrição |
| --- | --- | --- | --- |
| `GET` | `/api/admin/imagens` | Sim | Lista todas as imagens, inclusive inativas |
| `POST` | `/api/admin/imagens` | Sim | Envia uma imagem (`multipart/form-data`) para o Cloudinary |
| `PATCH` | `/api/admin/imagens/{id}` | Sim | Edita metadados (não substitui o arquivo) |
| `DELETE` | `/api/admin/imagens/{id}` | Sim | Remove o registro e o arquivo no Cloudinary |
| `GET` | `/api/admin/configuracao` | Sim | Retorna os textos livres do site |
| `PATCH` | `/api/admin/configuracao` | Sim | Atualiza os textos livres do site |
| `GET` | `/api/admin/servicos` | Sim | Lista todos os serviços, inclusive inativos |
| `POST` | `/api/admin/servicos` | Sim | Cadastra um serviço |
| `PATCH` | `/api/admin/servicos/{id}` | Sim | Edita um serviço |
| `DELETE` | `/api/admin/servicos/{id}` | Sim | Exclui um serviço |
| `GET` | `/api/admin/depoimentos` | Sim | Lista todos os depoimentos, inclusive inativos |
| `POST` | `/api/admin/depoimentos` | Sim | Cadastra um depoimento |
| `PATCH` | `/api/admin/depoimentos/{id}` | Sim | Edita um depoimento |
| `DELETE` | `/api/admin/depoimentos/{id}` | Sim | Exclui um depoimento |

### Validações de entrada

Implementadas com `field_validator` do Pydantic em `schemas.py`:

- `servico` precisa estar em `SERVICOS_VALIDOS`
- `status` precisa estar em `STATUS_VALIDOS`
- `categoria` de imagem precisa estar em `CATEGORIAS_IMAGEM_VALIDAS`
- `nome_cliente` não pode ser vazio (é normalizado com `strip()`)
- `whatsapp` precisa conter no mínimo 10 dígitos
- `estrelas` precisa estar entre 1 e 5

---

## Experiência responsiva

O CSS foi escrito em abordagem **mobile-first**: o layout base é o de telas pequenas e as adaptações para telas maiores vêm em blocos `@media (min-width: ...)`, com breakpoints em 640px, 700px, 800px, 900px e 980px. Todas as páginas declaram `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.

Elementos com tratamento responsivo específico:

- Grades de serviços, galeria, antes/depois e depoimentos, que mudam o número de colunas conforme a largura
- Tabelas do painel administrativo, envolvidas em `.tabela-wrapper` para permitir rolagem horizontal em telas estreitas
- Botão flutuante de WhatsApp, posicionado para o alcance do polegar em uso mobile

A escolha faz sentido para o contexto: a maior parte do tráfego de um estúdio de beleza chega por link compartilhado no Instagram ou no WhatsApp, ou seja, quase sempre por celular.

---

## Deploy

O repositório inclui um `Procfile` compatível com plataformas do tipo Heroku/Render:

```procfile
web: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Pontos de atenção documentados no próprio código (`backend/database.py`):

- O disco dessas plataformas costuma ser **efêmero** — um banco SQLite local é apagado a cada novo deploy. Para produção, defina `LORE_DATABASE_URL` apontando para um PostgreSQL gerenciado (Neon, Supabase, Render Postgres etc.). O driver `psycopg2-binary` já está declarado em `requirements.txt`.
- Pelo mesmo motivo, as imagens são enviadas ao **Cloudinary** em vez de gravadas no sistema de arquivos da aplicação.

Diferenças entre desenvolvimento e produção:

| Aspecto | Desenvolvimento | Produção |
| --- | --- | --- |
| Banco | SQLite (`lore.db`, criado automaticamente) | PostgreSQL via `LORE_DATABASE_URL` |
| Credenciais admin | Valores padrão gerados no startup | `LORE_ADMIN_USUARIO` + `LORE_ADMIN_SENHA_HASH` |
| Chave JWT | Chave de desenvolvimento no código | `LORE_SECRET_KEY` própria |
| Servidor | `uvicorn --reload` | `Procfile` com `--host 0.0.0.0 --port $PORT` |

Não há configuração de CI/CD, Docker ou infraestrutura como código neste repositório.

---

## LGPD e tratamento de dados

O sistema armazena dados pessoais e pode armazenar dados de saúde. O campo `observacoes_gerais` da ficha da cliente tem, inclusive, um placeholder na interface sugerindo o registro de sensibilidades, alergias e preferências de técnica — informações que se enquadram como **dados pessoais sensíveis** na LGPD.

**Dados armazenados:** nome, número de WhatsApp, serviço solicitado, data e horário preferidos, observações do agendamento, observações gerais da ficha e histórico de atendimentos.

**Quem pode acessá-los:** exclusivamente as rotas sob `/api/admin/`, todas protegidas pela dependency `exigir_admin`. As rotas públicas de leitura (`/api/servicos`, `/api/depoimentos`, `/api/imagens`, `/api/configuracao`) devolvem apenas conteúdo institucional, sem qualquer dado de cliente.

**Cuidados já implementados:**
- Segregação clara entre schemas públicos e administrativos
- Autenticação obrigatória em todas as rotas que expõem dados pessoais
- Ausência de log de campos pessoais em texto plano
- Senha administrativa armazenada apenas como hash bcrypt

**Pontos que ainda podem ser aprimorados:**
- Não existe fluxo de exclusão ou anonimização de dados de cliente a pedido do titular
- Não há registro de consentimento nem aviso de privacidade na tela de agendamento
- Não há política de retenção definida — os dados permanecem indefinidamente
- Não há trilha de auditoria dos acessos ao painel

> O projeto adota medidas técnicas para restringir o acesso aos dados de clientes, mas aspectos de conformidade jurídica e governança de dados devem ser avaliados conforme o contexto de produção.

---

## Decisões técnicas

**FastAPI como framework único.** Em vez de manter um servidor de frontend separado, a mesma aplicação entrega HTML, estáticos e API. Para um projeto de escopo pequeno e operador único, isso elimina configuração de CORS, complexidade de deploy e um segundo processo para manter no ar — e a documentação OpenAPI vem de graça, o que acelera muito o teste dos endpoints durante o desenvolvimento.

**SQLModel em vez de SQLAlchemy puro.** O SQLModel reúne o modelo de tabela e o modelo de dados numa definição só, aproveitando a tipagem que o FastAPI já usa para validação. Ainda assim, os schemas de API foram mantidos **separados** dos modelos de tabela em `schemas.py` — decisão deliberada, porque é ela que permite ter `ImagemOut` (completo, para o painel) e `ImagemPublicOut` (enxuto, sem o `cloudinary_public_id`) para a mesma tabela.

**Frontend sem framework.** HTML, CSS e JavaScript puros, sem build step. Para um site de poucas páginas com interatividade concentrada em formulários e listagens, React ou Vue adicionariam toolchain, dependências e superfície de manutenção sem ganho real. O código de frontend está organizado por página, com `admin-common.js` centralizando o que é compartilhado (chamada à API, login, logout, formatação de datas).

**Autenticação com usuário único.** O painel tem uma única operadora. Uma tabela de usuários, cadastro e recuperação de senha seriam complexidade não utilizada. O usuário e o hash da senha vêm de variáveis de ambiente, mantendo credenciais fora do código versionado.

**JWT em cookie `httpOnly` em vez de `localStorage`.** O token não fica acessível ao JavaScript da página e é enviado automaticamente pelo navegador, o que simplifica o frontend e reduz o impacto de um eventual XSS. A alternativa comum — guardar o token em `localStorage` e montar o header `Authorization` manualmente — deixaria a credencial legível por qualquer script na página.

**bcrypt para a senha.** Algoritmo de hash com salt e custo computacional configurável, próprio para senhas — diferente de hashes rápidos de propósito geral, inadequados por serem fáceis de atacar por força bruta.

**SQLite em desenvolvimento, PostgreSQL em produção.** O SQLite não exige nenhum serviço rodando localmente: `git clone`, instalar as dependências e o banco existe. A camada de conexão foi escrita para aceitar as duas opções pela mesma variável de ambiente, com o `connect_args` aplicado condicionalmente.

**Organização em routers por domínio.** `agendamentos`, `clientes`, `imagens`, `conteudo` e `admin` são módulos independentes. Cada domínio agrupa suas rotas públicas e administrativas, mantendo o `main.py` reduzido a registro de routers e configuração.

**CMS próprio em vez de conteúdo fixo no HTML.** Foi a decisão mais determinante do projeto. Sem ele, cada mudança de preço, foto ou depoimento exigiria alterar código e refazer o deploy. Com ele, a profissional mantém o próprio site atualizado — o que é o que separa um site que envelhece de um que continua útil.

**`storage.py` isolado.** Toda dependência do Cloudinary está contida em um módulo com duas funções. Trocar de provedor de armazenamento no futuro não toca em nenhum router.

---

## Desafios e aprendizados

- **Modelar o funil de agendamento.** A separação entre `Agendamento` (a solicitação) e `Atendimento` (o fato consumado) não era óbvia no início. Ela resolve um problema real: solicitações canceladas não podem poluir o histórico da cliente, e o histórico precisa sobreviver a alterações na solicitação original.
- **Identidade de cliente sem cadastro.** Como não existe login para clientes, foi preciso eleger uma chave natural para consolidar o histórico. O WhatsApp, declarado como campo único e indexado, cumpre esse papel — com a limitação conhecida de que variações de formatação do mesmo número podem gerar fichas duplicadas.
- **Autenticação stateless na prática.** Implementar JWT do zero — geração, expiração, validação via dependency injection do FastAPI e transporte em cookie `httpOnly` — deixou claros os trade-offs reais do modelo, especialmente a impossibilidade de revogar um token antes da expiração sem manter estado no servidor.
- **Persistência efêmera no deploy.** Descobrir que o disco das plataformas PaaS é apagado a cada deploy forçou duas mudanças estruturais: suporte a PostgreSQL via variável de ambiente e migração do armazenamento de imagens para um serviço externo.
- **Escrever uma camada de dados que serve a dois públicos.** A mesma tabela precisa alimentar o site público e o painel com níveis diferentes de exposição. Foi isso que motivou a separação rígida entre schemas de saída.
- **Construir para um usuário real, não para si.** O CMS existe porque a alternativa — a profissional pedir uma alteração de texto ao desenvolvedor toda vez — não é sustentável. Projetar pensando em quem vai operar o sistema mudou decisões que, num projeto de estudo, teriam sido tomadas de outra forma.

---

## Melhorias futuras

### Implementado

- [x] Landing page responsiva com conteúdo dinâmico
- [x] Formulário público de agendamento com validação
- [x] Integração com WhatsApp para confirmação
- [x] Autenticação administrativa (bcrypt + JWT em cookie `httpOnly`)
- [x] Gestão de solicitações com controle de status
- [x] Cadastro automático de clientes e histórico de atendimentos
- [x] Ficha da cliente com observações editáveis
- [x] CMS de imagens com upload no Cloudinary
- [x] CMS de serviços, depoimentos e textos do site
- [x] Suporte a PostgreSQL via variável de ambiente
- [x] Configuração de deploy via `Procfile`

### Pendências identificadas no código

- [ ] Cadastrar a foto principal do Hero pelo painel (`[PLACEHOLDER]` ativo em `index.html`)
- [ ] Configurar a URL de embed do mapa em Conteúdo > Textos (`[PLACEHOLDER]` ativo em `index.html`)
- [ ] Definir `LORE_SECRET_KEY`, `LORE_ADMIN_USUARIO` e `LORE_ADMIN_SENHA_HASH` reais antes do deploy (`[PLACEHOLDER]` em `auth.py`)
- [ ] Preencher duração e preço dos serviços cadastrados
- [ ] Substituir `@app.on_event("startup")`, depreciado, pelo `lifespan` do FastAPI

### Propostas de evolução

Itens abaixo são sugestões técnicas, **nenhuma delas implementada**:

- [ ] Testes automatizados com `pytest` e `TestClient`
- [ ] Migrations com Alembic (hoje o schema é criado via `create_all`)
- [ ] Validação de MIME type e limite de tamanho no upload de imagens
- [ ] Escape da saída no frontend em vez de `innerHTML` direto
- [ ] Flag `Secure` no cookie e proteção CSRF dedicada
- [ ] Rate limiting no endpoint público de agendamento
- [ ] Notificação automática (e-mail ou WhatsApp Business API) a cada nova solicitação
- [ ] Agenda com controle de disponibilidade real, bloqueando horários já ocupados
- [ ] Filtros e busca no painel de solicitações e clientes
- [ ] Fluxo de exclusão/anonimização de dados a pedido do titular (LGPD)
- [ ] Aviso de privacidade e registro de consentimento no formulário
- [ ] Pipeline de CI/CD
- [ ] Logging estruturado e monitoramento de erros

---

## Status do projeto

🟢 **Funcional** — o núcleo da aplicação (site, agendamento, painel, gestão de clientes e CMS) está implementado e operacional. Restam pendências de conteúdo marcadas como `[PLACEHOLDER]` no código e as melhorias de segurança e infraestrutura listadas acima.

Para localizar todas as pendências no repositório:

```bash
grep -rn "PLACEHOLDER" --include="*.py" --include="*.html" .
```

---

## Autor

**Luís Eduardo Carvalho Ferreira**
Desenvolvedor do projeto.

GitHub: [@LuisEdu17y](https://github.com/LuisEdu17y)

---

## Licença

Este repositório não possui um arquivo de licença. Sem uma licença explícita, todos os direitos permanecem reservados ao autor.

