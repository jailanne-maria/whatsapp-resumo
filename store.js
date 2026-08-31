// Persistência simples em JSON

const fs = require('fs');
const path = require('path');

function carregar(arquivo) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch {
    return { grupos: {}, ultimoResumo: null };
  }
}

function salvar(arquivo, dados) {
  const dir = path.dirname(arquivo);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2));
}

module.exports = { carregar, salvar };
