# Universal Remote BTV — Angular e Android

Interface Angular 16 + Bootstrap disponível em dois modos:

- PWA publicada na Vercel, integrada à API `https://box.labswill.com`;
- aplicativo Android autônomo para celulares e tablets.

## Versão web

Na web, os cadastros, banco de dados e operações ADB continuam no backend. Para
desenvolvimento:

```bash
npm install
npm start
npm run build
```

O build fica em `dist/frontend` e `vercel.json` mantém o rewrite da SPA.

## Aplicativo Android autônomo

No APK, aparelhos, macros e registros ficam no próprio celular. Os comandos são
enviados diretamente à TV pelo protocolo ADB, sem depender da API ou da VPS. O
celular e a TV precisam estar na mesma rede Wi-Fi.

Na primeira conexão, confirme na TV a chave ADB apresentada pelo aplicativo e
marque a opção para sempre permitir. A senha local permanece `270815`.

Recursos nativos:

- conexão ADB autenticada diretamente com a TV;
- teclas, texto com espaços, abertura de aplicativos e espelhamento ao vivo;
- toque diretamente no vídeo; em celulares e no APK o player ativo fica
  flutuante enquanto o usuário movimenta o controle;
- executor local de macros com espera, variáveis, chamada de outra macro e condição de tela;
- armazenamento local separado da versão web;
- resposta tátil nos controles e no resultado das macros;
- diagnóstico e configuração de Tailscale sempre ativa por ADB.

Para atualizar os arquivos nativos e gerar o APK:

```powershell
npm run android:build
```

O APK de desenvolvimento é criado em:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Java e Android SDK foram preparados em `.android-tools`. Essa pasta é local e
não é enviada ao Git. O projeto nativo exige Android 7 ou mais recente.

## Uso

1. Ative a depuração ADB pela rede na TV ou box.
2. Instale o APK no celular ou tablet.
3. Entre com a senha local.
4. Cadastre o IP local da TV e a porta ADB, normalmente `5555`.
5. Envie um comando e confirme a autorização exibida na TV.
6. Crie e execute macros normalmente pela home.

O navegador continua usando o backend remoto; a plataforma escolhe
automaticamente o modo local somente dentro do APK Android.
