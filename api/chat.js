var MODEL = "gemini-3.5-flash-lite";
var SYSTEM = "너는 축구 전문 AI 비서야. 한국어로 친근하고 간결하게 답해. 선수, 전술, 팀에 대한 질문에 답하고, 확실하지 않은 최신 정보는 모른다고 솔직하게 말해. 앞선 대화 내용을 기억하고 이어서 답해.";

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 가능해요." });
  }

  var incoming = (req.body && req.body.messages) || [];
  if (!Array.isArray(incoming)) incoming = [];

  // 최근 12개 메시지만 사용해요 (길어지면 요금과 한도가 빨리 줄어요)
  var contents = incoming.slice(-12).map(function (m) {
    var isUser = m.role !== "model";
    return {
      role: isUser ? "user" : "model",
      parts: [{ text: String(m.text || "").slice(0, isUser ? 500 : 2000) }]
    };
  }).filter(function (m) { return m.parts[0].text.trim(); });

  while (contents.length && contents[0].role !== "user") contents.shift();

  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return res.status(400).json({ error: "질문을 입력해 주세요." });
  }

  var key = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!key) {
    return res.status(500).json({ error: "서버에 GEMINI_API_KEY가 없어요." });
  }

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";
    var r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: contents,
        generationConfig: { maxOutputTokens: 600 }
      })
    });

    var data = await r.json();

    if (r.status === 429) {
      return res.status(429).json({ error: "지금 요청이 많아요. 잠시 후 다시 시도해 주세요." });
    }
    if (!r.ok) {
      var detail = (data && data.error && data.error.message) || "알 수 없는 오류";
      return res.status(500).json({ error: "AI 호출 실패: " + detail });
    }

    var parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    var text = parts.map(function (p) { return p.text || ""; }).join("");
    return res.status(200).json({ reply: text || "답변을 받지 못했어요." });
  } catch (e) {
    return res.status(500).json({ error: "서버 오류가 났어요." });
  }
};
