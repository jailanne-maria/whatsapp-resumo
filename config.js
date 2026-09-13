module.exports = {
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
  // Para ativar: pegue uma chave GRATUITA em https://aistudio.google.com/apikey
  // e cole em apiKey. Enquanto estiver vazia, o bot usa o resumo por regras.
  ia: {
    ativa: false,
    provedor: "gemini",          // "gemini" (grátis) ou "openai" (compatível)
    apiKey: "",
    modelo: "gemini-2.0-flash",
    maxMensagens: 200,           // quantas mensagens enviar para a IA
  },
};
