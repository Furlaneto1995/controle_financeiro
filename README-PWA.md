# Controle Financeiro - PWA

App transformado em PWA (Progressive Web App) instalável no PC e celular com notificações nativas.

## 📁 Arquivos necessários (todos nesta pasta)

```
/controle-financeiro.html  <- APP PRINCIPAL (ou index.html, são iguais)
/index.html                <- cópia idêntica, serve como start_url alternativo
/manifest.json             <- configuração do PWA (nome, cores, ícones)
/service-worker.js         <- cache offline + notificações em segundo plano
/icon-96.png
/icon-144.png
/icon-180.png  (Apple)
/icon-192.png  (Android/PC - obrigatório)
/icon-512.png  (Splash screen)
/icon-512-maskable.png (ícone adaptativo Android)
```

## 🚀 Como hospedar (IMPORTANTE para PWA funcionar)

PWA **SÓ FUNCIONA COM HTTPS** ou em `localhost`. Você tem 3 opções:

### Opção 1 - Hospedagem gratuita (recomendado)
1. Vá em https://app.netlify.com/drop
2. Arraste TODOS os arquivos da pasta para lá
3. Pronto! Vai gerar um link https://seu-app.netlify.app
4. Abra no Chrome no PC/celular e instale

Outras hospedagens: Vercel, GitHub Pages, Firebase Hosting.

### Opção 2 - Seu próprio servidor/paste
Se usar `https://paste.c-net.org/SonnySmart`, ele já é HTTPS, mas é um arquivo único. Para PWA precisa estar todos os arquivos no mesmo domínio/pasta. Por isso use Netlify/Vercel.

### Opção 3 - Testar local no PC
```bash
# no terminal, dentro da pasta
python -m http.server 8000
# ou
npx serve .
```
Abra https://localhost:8000 ou http://localhost:8000 - Chrome permite PWA em localhost sem HTTPS.

## 📲 Como instalar

### No PC (Windows/Mac - Chrome/Edge):
1. Abra `controle-financeiro.html` pelo link HTTPS
2. Vai aparecer um botão verde flutuante: **📲 Instalar App no PC/Celular**
3. Clique nele > Instalar
4. OU: Na barra de endereço clique no ícone de instalar (computador com seta) no canto direito
5. OU: Menu ⋮ > Salvar e compartilhar > Instalar app
6. O app vai aparecer no Menu Iniciar / Área de trabalho / Dock

### No celular Android (Chrome):
1. Abra o link
2. Botão verde "Instalar App"
3. OU: Menu ⋮ > Adicionar à tela inicial > Instalar
4. Vai virar um app na gaveta de apps

### iPhone (Safari) - limitado:
1. Abra no Safari
2. Botão compartilhar (quadrado com seta) > Adicionar à Tela de Início
3. Obs: iPhone não permite notificação push de PWA até iOS 16.4+, e precisa estar instalado.

## 🔔 Como funcionam as notificações no PC agora

### Dentro do app (sempre funciona):
- Barra superior colorida
- Sino 🔔 com badge
- Painel com lista

### Notificação nativa do Windows/Mac (precisa permitir):
1. No painel do sino clique **🔔 Ativar**
2. Chrome pede permissão > **Permitir**
3. Configure:
   - `⏰ Horário diário: 08:00` (pode ser 19:00, etc)
   - `Avisar com 3 dias de antecedência`

**Quando dispara?**
- Assim que abre o app (se tiver contas vencidas)
- Todo dia no horário que você configurou (ex: 08:00) - precisa estar com Chrome aberto em segundo plano (não precisa estar com o app aberto, só Chrome rodando na bandeja)
- O app verifica a cada 60 segundos se chegou no horário
- Botão "Verificar agora" força na hora

**Onde aparece no PC?**
- Canto inferior direito do Windows, com som, mesmo com Chrome minimizado
- Na Central de Notificações do Windows (Win+N)

**Notificação persiste mesmo com navegador fechado?**
- Com PWA instalado, SIM, por até alguns dias (Windows mantém Service Worker)
- Se fechar Chrome totalmente pelo Gerenciador de Tarefas, para até abrir de novo
- Para 100% garantido mesmo PC desligado, precisaria de servidor com Push (Firebase Cloud Messaging) - posso implementar se quiser, mas precisa de backend.

## ⚙️ Estrutura PWA implementada

**manifest.json**: define nome, cor #2b4668, ícones, atalhos "Adicionar lançamento" e "Vencimentos" (clique direito no ícone do app instalado no PC)

**service-worker.js**:
- Cacheia app para funcionar offline
- Se ficar sem internet, ainda abre suas contas locais (localStorage)
- Não cacheia Firebase (dados sempre da rede)
- Intercepta pedidos de notificação e mostra via sistema
- Suporta atalhos e clique na notificação = abre app e já filtra pendentes
- Background Sync pronto para futuro

**controle-financeiro.html** agora tem:
- `<link rel="manifest">` + theme-color + apple-touch-icon
- Botão flutuante de instalar
- Registro do Service Worker
- Lógica de agendamento por horário (08:00)
- `beforeinstallprompt` capturado

## 🧪 Testar PWA

No Chrome, abra DevTools (F12) > Aba **Application** > **Manifest** e **Service Workers**
Deve mostrar tudo verde.

Lighthouse: F12 > Lighthouse > Marcar PWA > Gerar relatório - deve dar 100%

## 📦 Próximos passos opcionais

Se quiser, posso adicionar:
- Notificação por email (usando Firebase Functions)
- Backup automático diário silencioso
- Tela de estatísticas com gráficos
- Modo escuro

Me diga onde vai hospedar que te ajudo a subir.
