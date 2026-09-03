# Universal Remote BTV — Frontend

PWA Angular 16 + Bootstrap integrada à API `https://box.labswill.com`.

## Uso

- Entre com a senha doméstica configurada na API.
- Cadastre a box em **Dispositivos**.
- Em **Aplicativos**, veja nome e ícone extraídos do APK, abra/desinstale apps ou envie um `.apk`.
- Se o APK usar um ícone adaptativo incompatível, a interface apresenta automaticamente o fallback visual.
- Em **Macros**, adicione ações seguras e ordene os passos.
- Use **Verificar tela** para montar caminhos “Se estiver” e “Se não estiver”; a interface mostra nomes amigáveis como **Tela de busca**.
- Defina opcionalmente o aplicativo esperado e a espera de abertura (10 segundos por padrão); se estiver fechado, a home pede autorização para abri-lo.
- Teste um passo isolado, todos os passos até ele ou a sequência a partir dele.
- Clone macros parecidas e componha fluxos usando **Chamar outra macro**.
- As macros ativas aparecem automaticamente na home e são executadas ao tocar.
- Quando uma macro exige entrada, a home abre uma modal e envia o texto como variável.
- Em **Controle**, acompanhe a tela da TV por screenshot automático; a imagem também é atualizada após cada comando.
- Screenshots começam desligados. Quando ativados, o controle aguarda a captura de cada movimento; desligados, os comandos permanecem livres.
- O aparelho selecionado fica salvo e é reutilizado em todas as telas.
- Em **Diagnóstico**, use **A TV não está funcionando** para verificar rede, aparelho e autorização ADB.
- Em **Configurações**, ative ou desative o Tailscale sempre ativo com verificação pela própria TV.
- A API impede duas macros simultâneas no mesmo dispositivo e a PWA informa execução, conclusão ou falha.

## Desenvolvimento

```bash
npm install
npm start
npm run build
```

O build fica em `dist/frontend`. O `vercel.json` contém as configurações de build e rewrite SPA. Não há mocks nem persistência local de cadastros; `localStorage` guarda somente autenticação.
