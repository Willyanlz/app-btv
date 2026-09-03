# Universal Remote BTV — Frontend

PWA única construída com Angular 16, TypeScript e Bootstrap 5. Controle da TV e administração ficam no mesmo menu lateral.

## Acesso atual

A senha é validada pela API (`POST /api/v1/auth/login`) e retorna um JWT com validade de 12 horas. A sessão e o token são salvos em `localStorage` e expiram junto com o token; também podem ser encerrados ao clicar em **Sair**.

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
- `features/home`, `remote` e `admin`: experiência principal.
- `features/admin`: dispositivos, aplicativos, macros, intents, dicionário, automações, execuções, filas, diagnóstico, screenshots e configurações.

## Implementado

- Login local e sessão persistente.
- PWA instalável, manifest e service worker.
- Menu sanduíche responsivo.
- Home, controle remoto e comandos rápidos (dicionário ADB).
- Dashboard e cadastros administrativos.
- Criar, editar, pausar e excluir automações.
- Persistência local das automações.
- Execuções, filas, diagnóstico, screenshots e configurações.

Enquanto os endpoints `/api/v1` são implementados, os cadastros administrativos usam dados tipados locais. O controle aponta para a API real e mostra mensagens amigáveis quando a BTV está offline.
# Integração

O PWA usa a API de produção em `https://box.labswill.com`. Dispositivos, aplicativos, macros, intenções e automações são persistidos pelo backend; não existem dados mockados nem cadastros locais no navegador.

No editor de macros, escolha ações com nomes humanos, ordene os passos e preencha somente os parâmetros necessários. O código ADB correspondente fica restrito ao backend.

A tela inicial exibe somente as macros ativas. Macros configuradas para solicitar entrada abrem uma pergunta antes da execução e enviam o valor para a variável definida, por exemplo `{{texto}}`. As antigas automações agendadas, filas, screenshots e configurações de capturas não fazem parte do fluxo atual.
