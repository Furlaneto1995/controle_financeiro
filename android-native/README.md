# Controle Financeiro Android nativo

Companion app nativo para manter o token FCM Android atualizado em segundo plano.

## Arquivos

- `app/google-services.json`: configuração do app Android no Firebase.
- `app/src/main/.../MainActivity.kt`: tela mínima e registro inicial do token.
- `app/src/main/.../FinanceiroFirebaseMessagingService.kt`: renovação do token e exibição da notificação.
- `app/src/main/.../TokenRegistrar.kt`: grava o token em `usuarios/u_anderson/fcmTokens` e os eventos em `usuarios/u_anderson/fcmTokenEventos`.
- `../build-android-apk.yml`: workflow para gerar o APK debug.

## Publicação no repositório

1. Copie a pasta `android-native` para a raiz do repositório.
2. Copie `build-android-apk.yml` para `.github/workflows/build-android-apk.yml`.
3. Faça commit na branch `main`.
4. Execute o workflow **Build APK Android nativo**.
5. Baixe o artefato `controle-financeiro-android-debug` e instale o APK no Android.

O app usa o UID fixo `u_anderson`, não lê dados financeiros e apenas registra o token de entrega e o histórico técnico do token.
