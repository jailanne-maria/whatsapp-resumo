const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');
const Pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const config = require('./config');
const store = require('./store');
const { resumirGrupo } = require('./resumidor');
const { resumirComIA } = require('./resumidor-ia');

// Log em arquivo para depuração
const LOGFILE = 'bot.log';
function log(msg) {
  const linha = `[${new Date().toISOString()}] ${msg}`;
  console.log(linha);
  try { fs.appendFileSync(LOGFILE, linha + '\n'); } catch {}
}

// Trava de instÃ¢ncia Ãºnica: impede duas cÃ³pias do bot ao mesmo tempo
const LOCKFILE = 'bot.lock';
try {
  const fd = fs.openSync(LOCKFILE, 'wx');
  fs.writeFileSync(fd, String(process.pid));
  fs.closeSync(fd);
} catch {
  console.log('âš ï¸  JÃ¡ existe outra janela do bot aberta.');
  console.log('   Feche a outra janela (ou pressione Ctrl+C nela) e rode este de novo.');
  console.log('   Se a outra jÃ¡ foi fechada, apague o arquivo "bot.lock" desta pasta.');
  process.exit(1);
}
process.on('exit', () => { try { fs.unlinkSync(LOCKFILE); } catch {} });
process.on('SIGINT', () => process.exit(0));

let sock = null;
const nomesGrupos = {}; // cache de nome por jid

// ---------- Helpers ----------

function formatarHora(t) {
  return new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarPeriodo(inicio, fim) {
  const i = new Date(inicio);
  const f = new Date(fim);
  const dia = f.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  return `${dia} ${formatarHora(i)} â†’ ${formatarHora(f)}`;
}

// Extrai o texto Ãºtil de uma mensagem do WhatsApp
function extrairTexto(msg) {
  const m = msg.message || {};
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage && m.extendedTextMessage.text) return m.extendedTextMessage.text;
  if (m.imageMessage && m.imageMessage.caption) return m.imageMessage.caption;
  if (m.videoMessage && m.videoMessage.caption) return m.videoMessage.caption;
  if (m.documentMessage && m.documentMessage.caption) return m.documentMessage.caption;
  if (m.listResponseMessage && m.listResponseMessage.singleSelectReply) {
    return m.listResponseMessage.singleSelectReply.selectedRowId;
  }
  return '';
}

function temMidia(msg) {
  const m = msg.message || {};
  return !!(m.imageMessage || m.videoMessage || m.audioMessage || m.documentMessage || m.stickerMessage);
}

// Normaliza nome do remetente
function nomeDoRemetente(msg, key) {
  const push = msg.pushName && msg.pushName.trim();
  if (push) return push;
  const p = key.participant || key.remoteJid || '';
  return p.split('@')[0] || 'Desconhecido';
}

// Jid da prÃ³pria conta (para "Mensagens salvas")
function jidProprio() {
  const id = sock && sock.user && sock.user.id;
  if (!id) return null;
  return id.replace(/:[^@]+@/, '@');
}

// ---------- PersistÃªncia ----------

function estadoAtual() {
  return store.carregar(config.arquivoDados);
}

function salvarEstado(estado) {
  store.salvar(config.arquivoDados, estado);
}

function registrarMensagem(estado, jid, nomeGrupo, msg) {
  if (!estado.grupos[jid]) {
    estado.grupos[jid] = { nome: nomeGrupo, mensagens: [] };
  }
  const grupo = estado.grupos[jid];
  if (nomeGrupo) grupo.nome = nomeGrupo;

  const m = msg.message || {};
  const registro = {
    id: msg.key.id,
    t: msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now(),
    remetente: nomeDoRemetente(msg, msg.key),
    texto: extrairTexto(msg),
    midia: temMidia(msg),
    reacoes: [],
  };

  if (m.reactionMessage) {
    // mensagem de reaÃ§Ã£o: anexa a reaÃ§Ã£o Ã  mensagem referenciada
    const refId = m.reactionMessage.key && m.reactionMessage.key.id;
    const reacao = m.reactionMessage.text;
    const alvo = grupo.mensagens.find((x) => x.id === refId);
    if (alvo && reacao && !alvo.reacoes.includes(reacao)) {
      alvo.reacoes.push(reacao);
    }
    return; // nÃ£o guarda a reaÃ§Ã£o como mensagem prÃ³pria
  }

  if (!registro.texto && !registro.midia) return;

  grupo.mensagens.push(registro);
  if (grupo.mensagens.length > config.maxMensagensPorGrupo) {
    grupo.mensagens.splice(0, grupo.mensagens.length - config.maxMensagensPorGrupo);
  }
}

// ---------- Envio do resumo ----------

async function enviarResumos(estado, marco) {
  if (!sock) return;
  const destino = jidProprio();
  if (!destino) {
    log('⚠️  Ainda sem jid próprio, resumo adiado.');
    return;
  }

  const grupos = Object.entries(estado.grupos);
  const blocos = [];
  const usarIA = !!(config.ia && config.ia.ativa && config.ia.apiKey);

  for (const [jid, grupo] of grupos) {
    const mensagens = grupo.mensagens.filter((m) => m.t > marco);
    if (!mensagens.length) continue;
    if (config.gruposPermitidos.length && !config.gruposPermitidos.includes(grupo.nome)) continue;

    const periodo = formatarPeriodo(marco, Date.now());
    let resumo = null;

    if (usarIA) {
      log(`🤖 Gerando resumo com IA: ${grupo.nome || jid}...`);
      resumo = await resumirComIA(grupo.nome || jid, mensagens, periodo, config.ia);
    }
    if (!resumo) {
      resumo = resumirGrupo(grupo.nome || jid, mensagens, periodo);
    }
    if (resumo) blocos.push(resumo);
  }

  if (!blocos.length) {
    log('Nenhum resumo gerado (sem atividade). Enviando confirmação.');
    try {
      await sock.sendMessage(destino, {
        text: '🧠 *RESUMO*\n\nNenhuma atividade registrada nos grupos ainda. O bot está ouvindo! ✅\n\nMande "resumo" a qualquer momento para ver o que foi capturado.',
      });
      log('Confirmação enviada para Mensagens salvas.');
    } catch (e) {
      console.error('Falha ao enviar confirmação:', e.message);
    }
    return;
  }

  const texto = `🧠 *RESUMO DOS GRUPOS*\n\n` + blocos.join('\n\n————————————\n\n');
  try {
    await sock.sendMessage(destino, { text: texto });
    log(`📨 Resumo enviado (${blocos.length} grupo(s)) às ${formatarHora(Date.now())}`);
  } catch (e) {
    console.error('Falha ao enviar resumo:', e.message);
  }
}

// ---------- Agendador ----------

const resumosJaEnviados = new Set();

function keyDiaHora() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
}

function agendar() {
  setInterval(() => {
    const agora = new Date();
    const min = agora.getHours() * 60 + agora.getMinutes();

    for (const h of config.horariosResumo) {
      const alvo = h.hora * 60 + h.minuto;
      if (min === alvo) {
        const chave = keyDiaHora();
        if (!resumosJaEnviados.has(chave)) {
          resumosJaEnviados.add(chave);
          console.log(`â° Hora do resumo (${h.hora}:${String(h.minuto).padStart(2, '0')})`);
          const estado = estadoAtual();
          enviarResumos(estado, estado.ultimoResumo || Date.now()).then(() => {
            estado.ultimoResumo = Date.now();
            salvarEstado(estado);
          });
        }
      }
    }
  }, 30 * 1000);
}

// ---------- ConexÃ£o ----------

let conectando = false;

// Busca o nome de todos os grupos ao conectar
async function carregarNomesGrupos() {
  try {
    const metas = await sock.groupFetchAllParticipating();
    for (const [jid, meta] of Object.entries(metas)) {
      if (meta.subject) {
        nomesGrupos[jid] = meta.subject;
        const e = estadoAtual();
        if (e.grupos[jid]) e.grupos[jid].nome = meta.subject;
        salvarEstado(e);
      }
    }
    log(`📚 Nomes de ${Object.keys(metas).length} grupo(s) carregados.`);
  } catch (e) {
    log(`⚠️ Falha ao carregar nomes de grupos: ${e.message}`);
  }
}


async function iniciar() {
  if (conectando) return;
  conectando = true;
  try {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: Pino({ level: 'silent' }),
      markOnlineOnConnect: false,
      browser: Browsers.macOS('Desktop'),
      syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        console.log('ðŸ“± Escaneie o QR Code com seu WhatsApp:');
        console.log('   1. Abra o WhatsApp no celular');
        console.log('   2. Toque em â‹® (ou âš™ï¸) > Aparelhos conectados');
        console.log('   3. "Conectar um aparelho" > escaneie o QR abaixo:');
        console.log('');
        qrcode.generate(qr, { small: true });
        console.log('');
      }
      if (connection === 'close') {
        conectando = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reconectar = statusCode !== DisconnectReason.loggedOut;
        console.log(`ConexÃ£o fechada (${statusCode}). ${reconectar ? 'Reconectando em 5s...' : 'Logado fora.'}`);
        if (reconectar) {
          setTimeout(() => iniciar(), 5000);
        }
      } else if (connection === 'open') {
        console.log('âœ… Conectado! Os resumos irÃ£o para "Mensagens salvas".');
        console.log(`   Jid: ${jidProprio()}`);
        carregarNomesGrupos();
        agendar();
      }
    });
  } finally {
    conectando = false;
  }

  sock.ev.on('messages.upsert', (upsert) => {
    const estado = estadoAtual();
    for (const msg of upsert.messages) {
      const jid = msg.key.remoteJid;
      if (!jid) continue;

      const textoMsg = extrairTexto(msg);
      const texto = textoMsg.trim().toLowerCase();
      const jidProprioAtual = jidProprio();
      const ehProprio = jid === jidProprioAtual || jid.endsWith('@lid') === (jidProprioAtual || '').endsWith('@lid') && !jid.includes('@g.us') && !jid.includes('@broadcast');

      log(`📥 msg [${upsert.type}] de ${jid}${ehProprio ? ' (proprio)' : ''}: "${texto.slice(0, 40) || '(sem texto)'}"`);

      // Comando sob demanda: "resumo" em qualquer conversa
      if (texto === 'resumo' || texto === '/resumo') {
        log('🧠 Resumo sob demanda solicitado.');
        enviarResumos(estado, estado.ultimoResumo || 0);
      }

      if (upsert.type !== 'notify') continue;
      if (!jid.includes('@g.us')) continue; // sÃ³ grupos

      let nome = nomesGrupos[jid] || null;
      // atualiza nome do grupo quando houver alteraÃ§Ã£o de tÃ­tulo
      const proto = msg.message?.protocolMessage;
      if (proto && proto.type === 3 && proto.subject) {
        nome = proto.subject;
        nomesGrupos[jid] = nome;
      }

      registrarMensagem(estado, jid, nome, msg);
    }
    salvarEstado(estado);

    // busca nome do grupo na primeira vez (lazy)
    for (const jid of Object.keys(nomesGrupos)) {
      if (nomesGrupos[jid] === null) {
        sock.groupMetadata(jid)
          .then((meta) => {
            nomesGrupos[jid] = meta.subject;
            const e = estadoAtual();
            if (e.grupos[jid]) e.grupos[jid].nome = meta.subject;
            salvarEstado(e);
          })
          .catch(() => {});
      }
    }
  });
}

iniciar();

