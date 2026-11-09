var MODEL = "gemini-3.5-flash-lite";

var BASE_SYSTEM = "너는 축구 전문 AI 비서야. 한국어로 친근하게 답해. 선수, 전술, 팀에 대한 질문에 답해. 앞선 대화 내용을 기억하고 이어서 답해. 너의 기본 지식은 오래됐을 수 있어서 최신 정보는 모를 수 있어. 아래에 '참고 데이터'가 있으면 그 내용을 우선해서 답하고, 영어 내용은 한국어로 풀어서 설명해. 선수 이름은 영어 표기와 한국어 표기를 서로 맞춰서 찾아줘. 참고 데이터에 없는 최신 정보나 선수 기록은 아는 척하지 말고, 확인할 수 없다고 솔직하게 말해.\n\n[선수 비교 규칙] 선수를 비교할 때는 참고 데이터의 출전 경기 수, 골, 도움, 페널티 제외 골, 경기당 골, 경기당 공격 포인트를 근거로 표로 비교해. 비교하려는 선수가 참고 데이터(리그별 득점 순위 상위 30명)에 없으면 그 선수의 수치는 확인할 수 없다고 말하고 추측해서 채우지 마. 도움이 '집계 없음'이면 그 수치는 비교하지 마. 슈팅, 패스, 기대득점(xG) 같은 지표는 데이터에 없으니 비교할 수 없다고 먼저 알려줘. 출전 경기 수가 서로 크게 다르면 표본 차이도 같이 언급해. 서로 다른 리그 선수의 수치는 리그 수준이 달라 단순 비교가 어렵다는 점도 한 줄로 덧붙여.\n\n[답변 형식 규칙] 휴대폰 화면에서 읽기 쉽게 써. 1) 첫 줄에 결론을 한두 문장으로 먼저 말해. 2) 문단은 2~3문장 이내로 짧게 나누고 문단 사이는 한 줄 비워. 3) 핵심 단어나 숫자는 **굵게** 표시해. 4) 항목이 여러 개면 '- '로 시작하는 목록을 써. 순서가 중요하면 '1. '을 써. 5) 두 대상을 비교할 때는 마크다운 표를 써. 표는 열을 3개 이하로, 행은 8개 이하로 하고, 표 아래에 한두 문장으로 해석을 덧붙여. 6) 제목은 꼭 필요할 때만 '## 제목' 한 단계만 써. 7) 이모지는 쓰더라도 문단당 하나 이하로 아껴. 8) 전체 길이는 필요한 만큼만 쓰고 같은 말을 반복하지 마. 9) 참고 데이터를 썼다면 맨 마지막 줄에 '출처: ...'를 한 줄로 적어. HTML 태그는 쓰지 마.";

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
var PLAYER_RE = /득점|골|어시|도움|기록|전적|스탯|성적|폼|활약|페널티|비교|지표|세부|분석|효율|득점력|vs/;

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

function fmt(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
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

// A-2. 리그별 득점 순위 + 직접 계산한 세부지표 (football-data.org)
async function getScorers(lg, token) {
  return cached("sc:" + lg.code, async function () {
    var h = { "X-Auth-Token": token };
    var r = await getFetch("https://api.football-data.org/v4/competitions/" + lg.code + "/scorers?limit=30", h);
    var data = await r.json();
    if (!data.scorers || !data.scorers.length) return "";
    var year = data.season && data.season.startDate ? data.season.startDate.slice(0, 4) + " 시즌 " : "";

    var rows = data.scorers.map(function (s, i) {
      var gp = s.playedMatches || 0;
      var g = s.goals || 0;
      var pk = s.penalties || 0;
      var hasA = s.assists !== null && s.assists !== undefined;
      var a = hasA ? s.assists : 0;

      var line = (i + 1) + ". " + s.player.name + " (" + s.team.name + ") 출전 " + gp + "경기, 골 " + g +
        ", 도움 " + (hasA ? a : "집계 없음") + ", 페널티골 " + pk;

      if (gp > 0) {
        line += " | 경기당
