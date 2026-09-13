// Resumidor com IA (Gemini gratuito ou API compatível com OpenAI)
// Se falhar, retorna null e o bot cai no resumo por regras.

const PROMPT_SISTEMA = `Você resume conversas de grupos de WhatsApp em português do Brasil.
Escreva de forma clara e objetiva, em tópicos curtos com emojis.
Destaque: decisões tomadas, tarefas e responsáveis, prazos, perguntas sem resposta,
links importantes e o clima geral do grupo.
Não invente informações. Se o grupo estiver vazio de conteúdo, diga isso.`;

function montarTexto(mensagens, max) {
  const usadas = mensagens.slice(-max);
  return usadas
    .map((m) => {
      const hora = new Date(m.t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const txt = (m.texto || "").replace(/\s+/g, " ").trim();
      const midia = m.midia ? " [mídia]" : "";
      return txt ? `${hora} - ${m.remetente}: ${txt}${midia}` : `${hora} - ${m.remetente}:${midia || " (mensagem)"}`;
    })
    .join("\n");
}

function montarPrompt(nomeGrupo, mensagens, periodo, max) {
  return `Grupo: "${nomeGrupo}"
Período: ${periodo}
Mensagens (mais antigas primeiro):
${montarTexto(mensagens, max)}

Gere o resumo do grupo nesse período.`;
}

// ---------- Gemini ----------
async function chamarGemini(cfg, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.modelo}:generateContent?key=${cfg.apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: PROMPT_SISTEMA }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${err.slice(0, 200)}`);
  }
  const data = await resp.json();
  const partes = data?.candidates?.[0]?.content?.parts || [];
  return partes.map((p) => p.text || "").join("").trim();
}

// ---------- OpenAI / compatível ----------
async function chamarOpenAI(cfg, prompt) {
  const base = cfg.baseUrl || "https://api.openai.com/v1";
  const resp = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.modelo,
      temperature: 0.4,
      messages: [
        { role: "system", content: PROMPT_SISTEMA },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`IA ${resp.status}: ${err.slice(0, 200)}`);
  }
  const data = await resp.json();
  return (data?.choices?.[0]?.message?.content || "").trim();
}

// Função principal: retorna o resumo em texto ou null se a IA não estiver ativa/falhar
async function resumirComIA(nomeGrupo, mensagens, periodo, cfg) {
  if (!cfg || !cfg.ativa || !cfg.apiKey) return null;
  if (!mensagens.length) return null;

  const prompt = montarPrompt(nomeGrupo, mensagens, periodo, cfg.maxMensagens || 200);
  try {
    const texto =
      cfg.provedor === "openai"
        ? await chamarOpenAI(cfg, prompt)
        : await chamarGemini(cfg, prompt);
    if (!texto) return null;
    return `📌 ${nomeGrupo}\nPeríodo: ${periodo}\n\n${texto}\n\n_Gerado com IA._`;
  } catch (e) {
    console.error("Falha no resumo com IA:", e.message);
    return null;
  }
}

module.exports = { resumirComIA };
