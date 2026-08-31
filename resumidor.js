// Resumidor por regras (sem API)

const PALAVRAS_IMPORTANTES = [
  { palavra: 'urgente', peso: 5, topico: '🚨 Urgências' },
  { palavra: 'urgência', peso: 5, topico: '🚨 Urgências' },
  { palavra: 'emergencia', peso: 5, topico: '🚨 Urgências' },
  { palavra: 'importante', peso: 4, topico: '🔥 Importantes' },
  { palavra: 'preciso de ajuda', peso: 4, topico: '🔥 Importantes' },
  { palavra: 'me ajuda', peso: 4, topico: '🔥 Importantes' },
  { palavra: 'problema', peso: 3, topico: '⚠️ Problemas' },
  { palavra: 'erro', peso: 3, topico: '⚠️ Problemas' },
  { palavra: 'quebrou', peso: 3, topico: '⚠️ Problemas' },
  { palavra: 'não ta funcionando', peso: 4, topico: '⚠️ Problemas' },
  { palavra: 'não tá funcionando', peso: 4, topico: '⚠️ Problemas' },
  { palavra: 'prazo', peso: 3, topico: '📅 Prazos' },
  { palavra: 'atrasou', peso: 3, topico: '📅 Prazos' },
  { palavra: 'atraso', peso: 3, topico: '📅 Prazos' },
  { palavra: 'amanhã', peso: 2, topico: '📅 Prazos' },
  { palavra: 'hoje', peso: 2, topico: '📅 Prazos' },
  { palavra: 'reunião', peso: 3, topico: '🗓️ Reuniões' },
  { palavra: 'reuniao', peso: 3, topico: '🗓️ Reuniões' },
  { palavra: 'chamada', peso: 3, topico: '🗓️ Reuniões' },
  { palavra: 'pagar', peso: 3, topico: '💸 Dinheiro' },
  { palavra: 'pagamento', peso: 3, topico: '💸 Dinheiro' },
  { palavra: 'dinheiro', peso: 3, topico: '💸 Dinheiro' },
  { palavra: 'cobrança', peso: 3, topico: '💸 Dinheiro' },
  { palavra: 'cobranca', peso: 3, topico: '💸 Dinheiro' },
  { palavra: 'confirma', peso: 2, topico: '✅ Confirmações' },
  { palavra: 'confirmar', peso: 2, topico: '✅ Confirmações' },
  { palavra: 'ok pode', peso: 1, topico: '✅ Confirmações' },
  { palavra: 'combinado', peso: 1, topico: '✅ Confirmações' },
];

const REGEX_LINK = /(https?:\/\/[^\s]+|www\.[^\s]+|wa\.me\/[^\s]+)/gi;

// Extrai o texto de uma mensagem guardada
function textoDe(m) {
  return m.texto || '';
}

// Normaliza para busca (minúsculas, sem acento)
function normalizar(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Trunca um trecho para exibir no resumo
function truncar(s, max) {
  s = s.replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max) + '…' : s;
}

function destacar(mensagens) {
  const linhas = [];
  for (const m of mensagens) {
    if (!m.texto) continue;
    const t = truncar(m.texto, 140);
    linhas.push(`  └ ${m.remetente}: "${t}"`);
    if (linhas.length >= 5) break;
  }
  return linhas.join('\n');
}

// Função principal: gera o resumo por regras
function resumirGrupo(nomeGrupo, mensagens, periodo) {
  if (!mensagens.length) return null;

  const total = mensagens.length;

  // Contagem por remetente
  const porRemetente = {};
  for (const m of mensagens) {
    const r = m.remetente || 'Desconhecido';
    porRemetente[r] = (porRemetente[r] || 0) + 1;
  }
  const ativos = Object.entries(porRemetente).sort((a, b) => b[1] - a[1]);
  const participantes = ativos.length;
  const top3 = ativos.slice(0, 3).map(([n, c]) => `${n} (${c})`).join(', ');

  // Horário de pico
  const horas = {};
  for (const m of mensagens) {
    const h = new Date(m.t).getHours();
    horas[h] = (horas[h] || 0) + 1;
  }
  const pico = Object.entries(horas).sort((a, b) => b[1] - a[1])[0];
  const picoStr = pico ? `${String(pico[0]).padStart(2, '0')}:00 (${pico[1]} msg)` : '—';

  // Palavras importantes → tópicos
  const topicos = {};
  const exemplosPorTopico = {};
  for (const m of mensagens) {
    const norm = normalizar(textoDe(m));
    if (!norm) continue;
    for (const regra of PALAVRAS_IMPORTANTES) {
      if (norm.includes(regra.palavra)) {
        topicos[regra.topico] = (topicos[regra.topico] || 0) + 1;
        (exemplosPorTopico[regra.topico] = exemplosPorTopico[regra.topico] || []).push(m);
        break;
      }
    }
  }

  // Links
  const links = [];
  for (const m of mensagens) {
    const matches = textoDe(m).match(REGEX_LINK);
    if (matches) links.push(...matches);
  }

  // Mídias
  const midias = mensagens.filter((m) => m.midia).length;

  // Reações
  const comReacao = mensagens.filter((m) => (m.reacoes || []).length >= 2);
  const reacoesUnicas = new Set();
  for (const m of comReacao) {
    reacoesUnicas.add(`${m.remetente}: "${truncar(m.texto || '📎 mídia', 100)}" [${m.reacoes.join(' ')}]`);
  }

  // Longas
  const longas = mensagens.filter((m) => m.texto && m.texto.length > 120).slice(0, 3);

  const linhas = [];
  linhas.push(`📌 ${nomeGrupo || 'Grupo'}`);
  linhas.push(`Período: ${periodo}`);
  linhas.push('');
  linhas.push(`📊 Estatísticas`);
  linhas.push(`   ${total} mensagens | ${participantes} participantes`);
  linhas.push(`   🗣️ Mais ativos: ${top3}`);
  linhas.push(`   🕐 Pico de atividade: ${picoStr}`);
  if (midias > 0) linhas.push(`   🖼️ Mídias: ${midias}`);
  linhas.push('');

  const topicosOrdenados = Object.entries(topicos).sort((a, b) => b[1] - a[1]);
  if (topicosOrdenados.length) {
    linhas.push(`🔥 O que marcou o período`);
    for (const [topico, qtd] of topicosOrdenados.slice(0, 6)) {
      linhas.push(`   ${topico}: ${qtd} menção(ões)`);
      linhas.push(destacar(exemplosPorTopico[topico]));
    }
    linhas.push('');
  }

  if (links.length) {
    linhas.push(`🔗 Links compartilhados (${links.length})`);
    for (const l of [...new Set(links)].slice(0, 5)) linhas.push(`   ${l}`);
    linhas.push('');
  }

  if (reacoesUnicas.size) {
    linhas.push(`⭐ Mensagens com muita reação`);
    for (const r of reacoesUnicas) linhas.push(`   ${r}`);
    linhas.push('');
  }

  if (longas.length) {
    linhas.push(`💬 Mensagens longas (vale ler)`);
    for (const m of longas) linhas.push(`   └ ${m.remetente}: "${truncar(m.texto, 140)}"`);
    linhas.push('');
  }

  linhas.push(`_Gerado automaticamente por resumo por regras._`);
  return linhas.join('\n');
}

module.exports = { resumirGrupo, normalizar, textoDe };
