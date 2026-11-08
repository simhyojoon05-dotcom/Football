var MODEL = "gemini-3.5-flash-lite";

var BASE_SYSTEM = "너는 축구 전문 AI 비서야. 한국어로 친근하게 답해. 선수, 전술, 팀에 대한 질문에 답해. 앞선 대화 내용을 기억하고 이어서 답해. 너의 기본 지식은 오래됐을 수 있어서 최신 정보는 모를 수 있어. 아래에 '참고 데이터'가 있으면 그 내용을 우선해서 답하고, 영어 내용은 한국어로 풀어서 설명해. 선수 이름은 영어 표기와 한국어 표기를 서로 맞춰서 찾아줘. 참고 데이터에 없는 최신 정보나 선수 기록은 아는 척하지 말고, 확인할 수 없다고 솔직하게 말해.\n\n[답변 형식 규칙] 휴대폰 화면에서 읽기 쉽게 써. 1) 첫 줄에 결론을 한두 문장으로 먼저 말해. 2) 문단은 2~3문장 이내로 짧게 나누고 문단 사이는 한 줄 비워. 3) 핵심 단어나 숫자는 **굵게** 표시해. 4) 항목이 여러 개면 '- '로 시작하는 목록을 써. 순서가 중요하면 '1. '을 써. 5) 두 대상을 비교할 때는 마크다운 표를 써. 표는 열을 3개 이하로, 행은 8개 이하로 하고, 표 아래에 한두 문장으로 해석을 덧붙여. 6) 제목은 꼭 필요할 때만 '## 제목' 한 단계만 써. 7) 이모지는 쓰더라도 문단당 하나 이하로 아껴. 8) 전체 길이는 필요한 만큼만 쓰고 같은 말을 반복하지 마. 9) 참고 데이터를 썼다면 맨 마지막 줄에 '출처: ...'를 한 줄로 적어. HTML 태그는 쓰지 마.";

// 무료 구간에서 쓸 수 있는 리그와, 질문에서 찾을 단어들
var LEAGUES = [
  { code: "PL",  name: "프리미어리그", re: /프리미어|epl|잉글랜드|토트넘|맨시티|맨유|맨체스터|리버풀|아스널|첼시|뉴캐슬/ },
  { code: "PD",  name: "라리가", re: /라리가|스페인|레알|바르셀로나|바르사|아틀레티코/ },
  { code: "SA",  name: "세리에A", re: /세리에|이탈리아|인테르|인터 밀란|ac밀란|유벤투스|나폴리/ },
  { code: "BL1", name: "분데스리가", re: /분데스|독일 리그|바이에른|뮌헨|도르트문트|레버쿠젠/ },
  { code: "FL1", name: "리그1", re: /리그1|리그 1|프랑스|psg|파리 생제르맹/ },
  { code: "CL",  name: "챔피언스리그", re: /챔피언스|챔스|ucl/ }
];

var NEWS_RE = /뉴스|소식|이슈|이적|부상|오늘|어제|최근|요즘|근황|화제/;
var TABLE_RE = /순위|승점|득실|결과|스코어|경기|리그|우승|강등|1위|몇 위|몇위/;
var PLAYER_RE = /득점|골|어시|도움|기록|전적|스탯|성적|폼|활약|페널티/;

// 같은 데이터를 30분 동안 재사용해서 무료 호출 한도를 아껴요
var cache = {};
async function cached(key, fn) {
  var hit = cache[key];
  if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.v;
  var v = await fn();
  cache[key] = { t: Date.now(), v: v };
  return v;
}

async function getFetch(url, headers) {
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 4000);
  try {
    var r = await fetch(url, { headers: headers || {}, signal: ctrl.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r;
  } finally {
    clearTimeout(timer);
  }
}

function pick(s, tag) {
  var m = s.match(new RegExp("<" + tag + ">([\\s\\S]*?)</" + tag + ">"));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
}

function dayStr(offset) {
  return new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
}

// B. 뉴스 (BBC 축구 RSS)
async function getNews() {
  return cached("news", async function () {
    var r = await getFetch("https://feeds.bbci.co.uk/sport/football/rss.xml");
    var xml = await r.text();
    var items = xml.split("<item>").slice(1, 9);
    return items.map(function (it) {
      var desc = pick(it, "description");
      return "- " + pick(it, "title") + (desc ? " : " + desc : "") + " (" + pick(it, "pubDate") + ")";
    }).join("\n");
  });
}

// A-1. 순위와 최근 결과 (football-data.org)
async function getLeague(lg, token) {
  return cached("lg:" + lg.code, async function () {
    var h = { "X-Auth-Token": token };
    var base = "https://api.football-data.org/v4/competitions/" + lg.code;

    var st = await getFetch(base + "/standings", h).then(function (r) { return r.json(); }).catch(function () { return null; });
    var mt = await getFetch(base + "/matches?dateFrom=" + dayStr(-7) + "&dateTo=" + dayStr(1), h)
      .then(function (r) { return r.json(); }).catch(function () { return null; });

    var out = "[" + lg.name + "]\n";

    var table = null;
    if (st && st.standings) {
      for (var i = 0; i < st.standings.length; i++) {
        if (st.standings[i].table && st.standings[i].table.length) { table = st.standings[i].table; break; }
      }
    }
    if (table) {
      out += "순위표:\n" + table.slice(0, 20).map(function (t) {
        return t.position + "위 " + t.team.name + " " + t.playedGames + "경기 " + t.won + "승 " +
          t.draw + "무 " + t.lost + "패 승점 " + t.points;
      }).join("\n") + "\n";
    }
    if (mt && mt.matches && mt.matches.length) {
      out += "최근 7일 경기:\n" + mt.matches.slice(-15).map(function (m) {
        var s = m.score && m.score.fullTime;
        var score = s && s.home !== null && s.home !== undefined ? s.home + ":" + s.away : "예정";
        return m.utcDate.slice(0, 10) + " " + m.homeTeam.name + " " + score + " " + m.awayTeam.name;
      }).join("\n");
    }
    return table || (mt && mt.matches && mt.matches.length) ? out : "";
  });
}

// A-2. 리그별 득점 순위 = 선수 시즌 기록 (football-data.org)
async function getScorers(lg, token) {
  return cached("sc:" + lg.code, async function () {
    var h = { "X-Auth-Token": token };
    var r = await getFetch("https://api.football-data.org/v4/competitions/" + lg.code + "/scorers?limit=30", h);
    var data = await r.json();
    if (!data.scorers || !data.scorers.length) return "";
    var year = data.season && data.season.startDate ? data.season.startDate.slice(0, 4) + " 시즌 " : "";
    return "[" + lg.name + " " + year + "득점 순위 상위 30명 (시즌 누적 기록)]\n" +
      data.scorers.map(function (s, i) {
        return (i + 1) + ". " + s.player.name + " (" + s.team.name + ") 출전 " + (s.playedMatches || 0) +
          "경기, 골 " + (s.goals || 0) + ", 도움 " + (s.assists || 0) + ", 페널티골 " + (s.penalties || 0);
      }).join("\n");
  });
}

module.exports = async function (req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 가능해요." });
  }

  var incoming = (req.body && req.body.messages) || [];
  if (!Array.isArray(incoming)) incoming = [];

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

  // 최근 질문 3개로 어떤 최신 데이터가 필요한지 판단해요
  var recent = contents.filter(function (m) { return m.role === "user"; })
    .slice(-3).map(function (m) { return m.parts[0].text; }).join(" ").toLowerCase();

  var extra = "";
  try {
    var jobs = [];
    var fdKey = (process.env.FOOTBALL_DATA_KEY || "").trim();
    var matched = LEAGUES.filter(function (lg) { return lg.re.test(recent); });

    if (NEWS_RE.test(recent)) {
      jobs.push(getNews().then(function (t) { return t ? "[최신 축구 뉴스 (BBC)]\n" + t : ""; }).catch(function () { return ""; }));
    }

    if (fdKey && TABLE_RE.test(recent)) {
      matched.forEach(function (lg) {
        jobs.push(getLeague(lg, fdKey).catch(function () { return ""; }));
      });
    }

    // 선수 기록 질문이면 득점 순위를 가져와요 (리그를 말하지 않으면 6개 리그 모두)
    if (fdKey && PLAYER_RE.test(recent)) {
      var targets = matched.length ? matched : LEAGUES;
      targets.forEach(function (lg) {
        jobs.push(getScorers(lg, fdKey).catch(function () { return ""; }));
      });
    }

    var results = await Promise.all(jobs);
    extra = results.filter(Boolean).join("\n\n");
  } catch (e) {
    extra = "";
  }

  var system = BASE_SYSTEM;
  if (extra) {
    system += "\n\n[참고 데이터] (최대 30분 정도 늦을 수 있어요. 답할 때 출처가 BBC 뉴스나 football-data.org라고 한 줄로 알려줘.)\n" + extra;
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
        systemInstruction: { parts: [{ text: system }] },
        contents: contents,
        generationConfig: { maxOutputTokens: 1000 }
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
