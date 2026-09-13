# WhatsApp Resumo

Bot que acompanha grupos do WhatsApp e envia resumos automáticos para "Mensagens salvas", em horários definidos.

## Como funciona

- Conecta no WhatsApp via QR Code (biblioteca **Baileys**)
- Escuta mensagens de todos os grupos que têm atividade
- Armazena as mensagens localmente (com limite por grupo)
- Em horários configurados, envia um **resumo inteligente** para a sua própria conta ("Mensagens salvas")

## O que o resumo traz

- 📊 Estatísticas: total de mensagens, participantes, mais ativos, pico de atividade
- 🔥 Tópicos que marcaram o período (urgências, problemas, prazos, reuniões…)
- 🔗 Links compartilhados (com quem enviou)
- ⭐ Mensagens com muita reação
- 💬 Mensagens longas que valem a pena ler

O resumo funciona de **duas formas**:

1. **Por regras** (padrão) — identifica palavras-chave e contextos, sem depender de internet.
2. **Com IA** (opcional) — um modelo de linguagem lê as mensagens e escreve um resumo natural,
   destacando decisões, tarefas, prazos e perguntas sem resposta.

### Ativar o resumo com IA (grátis)

1. Pegue uma chave gratuita em **https://aistudio.google.com/apikey**
2. Crie um arquivo **`config.local.js`** (não vai para o Git) com:

```js
module.exports = {
  ia: {
    ativa: true,
    apiKey: "SUA_CHAVE_AQUI",
    modelo: "gemini-3.6-flash",
  },
};
```

> Também funciona pela variável de ambiente `GEMINI_API_KEY`.
> Sem chave, o bot continua usando o resumo por regras (sem custo).

## Como usar

1. Instale as dependências:

```bash
npm install
```

2. Inicie o bot:

```bash
npm start
```

3. Escaneie o QR Code com seu WhatsApp (Aparelhos conectados > Conectar aparelho)

4. Pronto! Os resumos chegam em "Mensagens salvas" às 7h e 19h (configurável).

## 📱 Rodar no celular (sem notebook)

Dá para rodar o bot direto no Android, 24h por dia, usando o **Termux**.
Veja o passo a passo em **[RODAR-NO-CELULAR.md](RODAR-NO-CELULAR.md)**.

## Configuração

Edite `config.js`:

| Opção | Descrição |
|---|---|
| `horariosResumo` | Horários dos resumos (manhã e noite) |
| `gruposPermitidos` | `[]` = todos os grupos com atividade; ou liste nomes para limitar |
| `maxMensagensPorGrupo` | Limite de mensagens guardadas por grupo |

## Segurança

- As credenciais de sessão ficam na pasta `auth/` (ignorada pelo Git)
- As mensagens guardadas ficam em `data/` (ignorada pelo Git)
- O bot usa uma trava (`bot.lock`) para impedir duas instâncias ao mesmo tempo

## Tecnologias

- Node.js
- Baileys (`@whiskeysockets/baileys`)
- `qrcode-terminal`

## Por que este projeto

Nasceu de uma necessidade real: acompanhar grupos de trabalho e projetos sem se afogar em centenas de mensagens. Transforma o "ruído" dos grupos em informação objetiva.
