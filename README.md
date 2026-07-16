# LORE — Cílios em Tela & Sobrancelha

Site institucional/comercial da Lore, com formulário de agendamento e painel administrativo para gestão de solicitações e histórico de clientes.

## Stack

- **Backend:** FastAPI + SQLModel + SQLite
- **Autenticação admin:** JWT em cookie httpOnly + senha com bcrypt
- **Frontend:** HTML + CSS + JavaScript puro (mobile-first), servido pelo próprio FastAPI

## Como rodar localmente

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Acesse:
- Site: http://localhost:8000
- Agendamento: http://localhost:8000/agendamento
- Painel admin: http://localhost:8000/admin/login

## Credenciais do painel admin (desenvolvimento)

Por padrão (sem variáveis de ambiente definidas):
- **Usuário:** `lore`
- **Senha:** `troque-esta-senha`

**Antes de colocar em produção**, defina as variáveis de ambiente:
- `LORE_SECRET_KEY` — chave secreta para assinar o JWT
- `LORE_ADMIN_USUARIO` — usuário do painel
- `LORE_ADMIN_SENHA_HASH` — hash bcrypt da senha (gere com `bcrypt.hashpw(senha.encode(), bcrypt.gensalt())`)

## Estrutura

```
backend/
├── main.py            # App FastAPI, rotas de página e arquivos estáticos
├── models.py           # Modelos SQLModel (Agendamento, Cliente, Atendimento)
├── schemas.py           # Schemas Pydantic de entrada/saída da API
├── database.py          # Conexão SQLite
├── auth.py              # Login, JWT e bcrypt
└── routers/
    ├── agendamentos.py  # POST público + gestão admin de solicitações
    ├── clientes.py       # Ficha e histórico de clientes (admin)
    └── admin.py           # Login/logout

frontend/
├── index.html            # Home
├── agendamento.html       # Formulário de agendamento
├── admin/
│   ├── login.html
│   └── painel.html         # Abas: Solicitações e Clientes
├── css/styles.css
└── js/ (main.js, agendamento.js, admin.js)
```

## Pendências marcadas com `[PLACEHOLDER]`

Busque no código por `PLACEHOLDER` para encontrar todos os pontos que precisam de conteúdo real:
foto profissional, texto "sobre", preços e duração de cada serviço, depoimentos reais,
endereço do estúdio, mapa, cuidados pós-procedimento e link do Instagram.

## LGPD

Os dados de `Cliente` (nome, WhatsApp, observações que podem incluir sensibilidades/alergias)
são pessoais e sensíveis. Todas as rotas que os expõem exigem autenticação (`/api/admin/...`).
Não há log desses campos em texto plano.
