var MODEL = "gemini-3.5-flash-lite";

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 가능해요." });
  }

  var message = String((req.body && req.body.message) || "").slice(0, 500);
  if (!message.trim()) {
    return res.status(400).json({ error: "질문을 입력해 주세요." });
  }

  // 키 앞뒤 공백·따옴표를 자동으로 제거해요
  var key = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
    if (!key) {
    var names = Object.keys(process.env).filter(function (n) {
      return /GEM|KEY|API|FOT/i.test(n);
    });
    return res.status(500).json({
      error: "서버에 GEMINI_API_KEY가 없어요. [배포 환경: " + (process.env.VERCEL_ENV || "알 수 없음") +
        "] [비슷한 이름의 변수: " + (names.length ? names.join(", ") : "없음") + "]"
    });
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
      var detail = (data && data.error && data.error.message) || "알 수 없는 오류";
      return res.status(500).json({
        error: "AI 호출 실패: " + detail + " [키 길이:" + key.length + ", 앞4글자:" + key.slice(0, 4) + "]"
      });
    }

    var parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    var text = parts.map(function (p) { return p.text || ""; }).join("");
    return res.status(200).json({ reply: text || "답변을 받지 못했어요." });
  } catch (e) {
    return res.status(500).json({ error: "서버 오류가 났어요." });
  }
};
