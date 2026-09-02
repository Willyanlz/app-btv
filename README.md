# Universal Remote BTV — Frontend

PWA única construída com Angular 16, TypeScript e Bootstrap 5. Controle da TV e administração ficam no mesmo menu lateral.

## Acesso atual

Senha fixa: `270815`

A senha fixa é validada no frontend e confirmada pela API. A sessão e o token são salvos em `localStorage` e não expiram automaticamente; permanecem até o usuário clicar em **Sair** ou limpar os dados do navegador. Isso é uma conveniência da primeira versão e não constitui autenticação forte.

## Executar e compilar

```bash
npm install
npm start
npm run build
```

Abra `http://localhost:4200`. O build de produção fica em `dist/frontend` e habilita o service worker.

## Deploy na Vercel

- Root directory: `frontend`
- Framework preset: Angular
- Build command: `npm run build`
- Output directory: `dist/frontend`

`vercel.json` contém o rewrite das rotas SPA.

Ao importar o repositório `app-btv` na Vercel, não é necessário preencher comandos manualmente: `vercel.json` define instalação, build e diretório de saída.

## API

- Desenvolvimento: `http://localhost:3000`
- Produção: `https://box.labswill.com`

Após publicar na Vercel, inclua a origem definitiva em `CORS_ORIGINS` no backend.

## Organização

- `core/`: autenticação, guards, API, estado e stores.
- `layout/`: shell único e menu sanduíche.
- `shared/`: interfaces e modelos.
- `features/home`, `remote` e `voice-command`: experiência principal.
- `features/admin`: dispositivos, aplicativos, macros, intents, dicionário, automações, execuções, filas, diagnóstico, screenshots e configurações.

## Implementado

- Login local e sessão persistente.
- PWA instalável, manifest e service worker.
- Menu sanduíche responsivo.
- Home, controle remoto e comando inteligente.
- Dashboard e cadastros administrativos.
- Criar, editar, pausar e excluir automações.
- Persistência local das automações.
- Execuções, filas, diagnóstico, screenshots e configurações.

Enquanto os endpoints `/api/v1` são implementados, os cadastros administrativos usam dados tipados locais. O controle aponta para a API real e mostra mensagens amigáveis quando a BTV está offline.
