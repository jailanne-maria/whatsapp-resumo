# 📱 Rodar o WhatsApp Resumo no celular (sem notebook)

Com o **Termux** (Android), o bot roda direto no celular, 24h por dia — sem depender do computador.

---

## ⚡ Jeito mais rápido (1 comando)

1. Instale o **Termux** pelo **F-Droid**: https://f-droid.org/packages/com.termux/
   (⚠️ evite a versão da Play Store, que é desatualizada)

2. Abra o Termux, copie e cole **esta linha inteira** e dê Enter:

```bash
pkg update -y && pkg upgrade -y && pkg install -y nodejs git && cd ~ && git clone https://github.com/jailanne-maria/whatsapp-resumo.git && cd whatsapp-resumo && npm install && termux-wake-lock && node index.js
```

3. Vai aparecer um **QR Code** → abra o WhatsApp → **Aparelhos conectados** → **Conectar um aparelho** → escaneie.

Pronto! O bot fica rodando no celular. ✅

> Para ativar o **resumo com IA**, veja a seção 4 abaixo (é opcional).

---

## 📖 Passo a passo detalhado (se preferir ir com calma)

### 1. Instale o Termux

- Baixe pelo **F-Droid** (versão atualizada): https://f-droid.org/packages/com.termux/
- ⚠️ Evite a versão da Play Store (desatualizada).

### 2. Prepare o ambiente

Abra o Termux e cole (uma linha por vez):

```bash
pkg update -y && pkg upgrade -y
pkg install -y nodejs git
```

### 3. Baixe o projeto

```bash
git clone https://github.com/jailanne-maria/whatsapp-resumo.git
cd whatsapp-resumo
npm install
```

## 4. Configure a IA (opcional)

Pegue uma chave gratuita em **https://aistudio.google.com/apikey** e crie o arquivo local:

```bash
nano config.local.js
```

Cole:

```js
module.exports = {
  ia: {
    ativa: true,
    apiKey: "COLE_SUA_CHAVE_AQUI",
    modelo: "gemini-3.6-flash",
  },
};
```

Salve com `Ctrl+O` → Enter → `Ctrl+X`.

> A chave fica em `config.local.js`, que **não vai para o GitHub** (está no `.gitignore`).

## 5. Rode o bot

```bash
node index.js
```

Vai aparecer um **QR Code**. No celular:
- Abra o **WhatsApp** → **Aparelhos conectados** → **Conectar um aparelho** → escaneie o QR.

> Como o bot roda no próprio celular, você pode escanear com a câmera/WhatsApp do mesmo aparelho.

## 6. Mantenha rodando em segundo plano

```bash
termux-wake-lock
```

E desative a **otimização de bateria** do Termux:
- Ajustes → Apps → Termux → Bateria → **Sem restrições**

## 7. Como usar

- Mande **`resumo`** para o seu próprio chat ("Mensagens salvas") a qualquer momento.
- Os resumos automáticos chegam às **7h e 19h** (configurável em `config.js`).

---

## Atualizar o bot depois

```bash
cd whatsapp-resumo
git pull
npm install
```

## Dicas

- Para parar o bot: `Ctrl+C` no Termux.
- Para rodar mesmo com a tela desligada, mantenha o `termux-wake-lock` ativo.
- O `auth/` guarda a sessão — **não apague**, senão precisa escanear o QR de novo.
