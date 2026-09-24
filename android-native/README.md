# Controle Financeiro Android nativo

APK Android que abre o controle financeiro completo dentro do próprio aplicativo e mantém o canal FCM nativo em segundo plano.

## O que o APK faz

- Abre `https://furlaneto1995.github.io/controle_financeiro/?native=1` em uma tela WebView.
- Mantém login, telas, dados e configurações do controle financeiro existente.
- Registra e renova o token FCM nativo sem depender do Service Worker Web.
- Recebe alertas com o app fechado.
- Abre o controle financeiro ao tocar na notificação.
- Grava eventos técnicos em `usuarios/u_anderson/fcmTokenEventos` sem salvar token bruto no histórico.

## Arquivos

- `app/google-services.json`: configuração do app Android no Firebase.
- `app/src/main/.../MainActivity.kt`: WebView do controle financeiro e registro inicial do token.
- `app/src/main/.../FinanceiroFirebaseMessagingService.kt`: renovação do token e notificações Android.
- `app/src/main/.../TokenRegistrar.kt`: grava o token em `usuarios/u_anderson/fcmTokens` e eventos em `usuarios/u_anderson/fcmTokenEventos`.
- `../build-android-apk.yml`: workflow para gerar o APK debug.

## Publicação no repositório

1. Copie a pasta `android-native` para a raiz do repositório.
2. Copie `build-android-apk.yml` para `.github/workflows/build-android-apk.yml`.
3. Substitua o `index.html` do repositório pelo `index-token-audit.html` atualizado.
4. Substitua `.github/workflows/whatsapp-cron.yml` pelo workflow atualizado.
5. Faça commit na branch `main`.
6. Execute o workflow **Build APK Android nativo**.
7. Baixe o artefato `controle-financeiro-android-debug` e instale o APK.

O app usa o UID fixo `u_anderson` e não lê dados financeiros diretamente no código nativo. A interface web carregada no WebView continua responsável pelo login e pelos dados.
