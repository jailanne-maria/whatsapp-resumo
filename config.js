const base = {
  // Horários do resumo (manhã e noite)
  horariosResumo: [
    { hora: 7, minuto: 0 },
    { hora: 19, minuto: 0 },
  ],

  // [] = resume todos os grupos que tiveram atividade
  // Para limitar, coloque os nomes dos grupos, ex.: ['Minha Família', 'Trabalho']
  gruposPermitidos: [],

  arquivoDados: './data/mensagens.json',

  // Limite de mensagens guardadas por grupo (evita arquivo gigante)
  maxMensagensPorGrupo: 3000,

  // ===== Resumo com IA (opcional) =====
  // A chave NÃO fica aqui (o repositório é público).
  // Coloque a chave em config.local.js (não versionado) ou na variável GEMINI_API_KEY.
  ia: {
    ativa: false,
    provedor: "gemini",          // "gemini" (grátis) ou "openai" (compatível)
    apiKey: "",
    modelo: "gemini-3.6-flash",
    maxMensagens: 200,           // quantas mensagens enviar para a IA
  },
};

// Carrega a chave de config.local.js (arquivo local, fora do Git)
try {
  const local = require('./config.local');
  if (local && local.ia) Object.assign(base.ia, local.ia);
} catch (_) {}

// Ou de uma variável de ambiente
if (!base.ia.apiKey && process.env.GEMINI_API_KEY) {
  base.ia.apiKey = process.env.GEMINI_API_KEY;
  base.ia.ativa = true;
}

module.exports = base;
