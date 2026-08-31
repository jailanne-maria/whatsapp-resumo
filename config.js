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
};
