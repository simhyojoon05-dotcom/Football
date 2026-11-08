// 모델 이름이 오류나면 AI Studio에서 무료로 표시된 Flash-Lite 모델 이름으로 바꿔요
var MODEL = "Default Gemini Project";

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 가능해요." });
  }

  var message = (req.body && req.body.message) || "";
  message = String(message).slice(0, 500);
  if (!message.trim()) {
    return res.status(400).json({ error: "질문을 입력해 주세요." });
  }

  try {
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";
    var r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "너는 축구 전문 AI 비서야. 한국어로 친근하고 간결하게 답해. 선수, 전술, 팀에 대한 질문에 답하고, 확실하지 않은 최신 정보는 모른다고 솔직하게 말해." }]
        },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 600 }
      })
    });

    var data = await r.json();

    if (r.status === 429) {
      return res.status(429).json({ error: "지금 요청이 많아요. 잠시 후 다시 시도해 주세요." });
    }
    if (!r.ok) {
      return res.status(500).json({ error: "AI 호출에 실패했어요." });
    }

    var parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    var text = parts.map(function (p) { return p.text || ""; }).join("");
    return res.status(200).json({ reply: text || "답변을 받지 못했어요." });
  } catch (e) {
    return res.status(500).json({ error: "서버 오류가 났어요." });
  }
};
