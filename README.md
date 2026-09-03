# Universal Remote BTV — Frontend

PWA Angular 16 + Bootstrap integrada à API `https://box.labswill.com`.

## Uso

- Entre com a senha doméstica configurada na API.
- Cadastre a box em **Dispositivos**.
- Em **Aplicativos**, atualize a lista, abra/desinstale apps ou envie um `.apk`.
- Em **Macros**, adicione ações seguras e ordene os passos.
- As macros ativas aparecem automaticamente na home e são executadas ao tocar.
- Quando uma macro exige entrada, a home abre uma modal e envia o texto como variável.

## Desenvolvimento

```bash
npm install
npm start
npm run build
```

O build fica em `dist/frontend`. O `vercel.json` contém as configurações de build e rewrite SPA. Não há mocks nem persistência local de cadastros; `localStorage` guarda somente autenticação.
