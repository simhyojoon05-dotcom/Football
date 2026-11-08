// ===== 선수 데이터 (나이는 출생연도로 자동 계산) =====
var THIS_YEAR = new Date().getFullYear();

var players = [
  {name:"티모 베르너", nationality:"독일 🇩🇪", team:"토트넘 홋스퍼", position:"FW", birthYear:1996, mainFoot:"오른발",
   aiSummary:"압도적인 침투 스피드를 갖춘 포워드. 공수 전환 시 직선적인 위협 창출 능력이 뛰어남."},
  {name:"손흥민", nationality:"대한민국 🇰🇷", team:"토트넘 홋스퍼", position:"FW", birthYear:1992, mainFoot:"양발",
   aiSummary:"양발 가리지 않는 세계 최고 수준의 감아차기 골 결정력과 클러치 능력을 보유한 캡틴."},
  {name:"위르겐 클린스만", nationality:"독일 🇩🇪", team:"토트넘 홋스퍼 (전 소속)", position:"FW", birthYear:1964, mainFoot:"오른발",
   aiSummary:"박스 안에서의 감각적인 위기 포착 능력과 헤더가 일품이었던 레전드 스트라이커."},
  {name:"루이스 홀트비", nationality:"독일 🇩🇪", team:"토트넘 홋스퍼 (전 소속)", position:"MF", birthYear:1990, mainFoot:"왼발",
   aiSummary:"왕성한 활동량과 창의적인 공간 패스 공급 능력을 선보였던 공격형 미드필더."},
  {name:"제임스 매디슨", nationality:"잉글랜드 🏴󠁧󠁢󠁥󠁮󠁧󠁿", team:"토트넘 홋스퍼", position:"MF", birthYear:1996, mainFoot:"오른발",
   aiSummary:"경기 흐름을 읽는 킬패스 능력과 전담 세트피스 키커로서의 정교함을 갖춘 플레이메이커."},
  {name:"크리스티안 로메로", nationality:"아르헨티나 🇦🇷", team:"토트넘 홋스퍼", position:"DF", birthYear:1998, mainFoot:"오른발",
   aiSummary:"전진 대치 타이밍이 빠른 공격적 센터백. 강인한 피지컬과 깔끔한 대인 수비가 강점."}
];

var currentFilter = "ALL";

// ===== 선수 도감 =====
function drawCards(list) {
  var grid = document.getElementById("cardGrid");
  var count = document.getElementById("resultCount");
  grid.innerHTML = "";
  count.textContent = "총 " + list.length + "명";

  if (list.length === 0) {
    grid.innerHTML = '<p class="empty">검색 결과가 없어요. 다른 단어로 찾아보세요.</p>';
    return;
  }

  list.forEach(function (p) {
    var age = THIS_YEAR - p.birthYear;
    var card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML =
      '<div class="card-top"><span class="player-name">' + p.name + '</span>' +
      '<span class="position-badge">' + p.position + '</span></div>' +
      '<div class="player-detail">📍 국적: ' + p.nationality + '</div>' +
      '<div class="player-detail">🛡️ 소속: ' + p.team + '</div>' +
      '<div class="player-detail">🎂 나이: 약 ' + age + '세 | 주발: ' + p.mainFoot + '</div>' +
      '<div class="ai-summary"><strong>🤖 AI 플레이 스타일 요약</strong>' + p.aiSummary + '</div>';
    grid.appendChild(card);
  });
}

function applyFilter() {
  var q = document.getElementById("searchInput").value.trim().toLowerCase();
  var result = players.filter(function (p) {
    var okPos = currentFilter === "ALL" || p.position === currentFilter;
    var text = (p.name + " " + p.nationality + " " + p.team + " " + p.position + " " + p.aiSummary).toLowerCase();
    return okPos && (q === "" || text.indexOf(q) !== -1);
  });
  drawCards(result);
}

document.getElementById("searchBtn").addEventListener("click", applyFilter);
document.getElementById("searchInput").addEventListener("input", applyFilter);
document.getElementById("searchInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") applyFilter();
});

var filterBtns = document.querySelectorAll(".filter-btn");
filterBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    filterBtns.forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    currentFilter = btn.getAttribute("data-filter");
    applyFilter();
  });
});

applyFilter();

// ===== 메뉴 / 도감 열고 닫기 =====
var drawer = document.getElementById("drawer");
var overlay = document.getElementById("overlay");
var dex = document.getElementById("dex");

function openDrawer() { drawer.hidden = false; overlay.hidden = false; }
function closeDrawer() { drawer.hidden = true; overlay.hidden = true; }

document.getElementById("menuBtn").addEventListener("click", openDrawer);
overlay.addEventListener("click", closeDrawer);
document.getElementById("drawerDex").addEventListener("click", function () {
  closeDrawer();
  dex.hidden = false;
});
document.getElementById("dexClose").addEventListener("click", function () { dex.hidden = true; });
document.getElementById("drawerNew").addEventListener("click", function () {
  closeDrawer();
  newChat();
});
document.getElementById("loginBtn").addEventListener("click", function () {
  alert("로그인 기능은 준비 중이에요.");
});

// ===== AI 답변을 보기 좋게 바꾸는 함수 (마크다운 → 화면용) =====
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineMd(s) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function tableCells(row) {
  return row.replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
}

var TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function isBlockStart(t) {
  return /^#{1,4}\s+/.test(t) || /^([-*•])\s+/.test(t) || /^\d+[.)]\s+/.test(t) || t.charAt(0) === "|";
}

function renderMarkdown(text) {
  var lines = String(text).replace(/\r/g, "").split("\n");
  var html = "";
  var i = 0;

  while (i < lines.length) {
    var t = lines[i].trim();
    if (!t) { i++; continue; }

    // 표
    if (t.charAt(0) === "|" && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]) && lines[i + 1].indexOf("-") !== -1) {
      var rows = [];
      while (i < lines.length && lines[i].trim().charAt(0) === "|") { rows.push(lines[i].trim()); i++; }
      var head = tableCells(rows[0]);
      html += '<div class="md-table"><table><thead><tr>' +
        head.map(function (c) { return "<th>" + inlineMd(c) + "</th>"; }).join("") +
        "</tr></thead><tbody>";
      rows.slice(2).forEach(function (r) {
        html += "<tr>" + tableCells(r).map(function (c) { return "<td>" + inlineMd(c) + "</td>"; }).join("") + "</tr>";
      });
      html += "</tbody></table></div>";
      continue;
    }

    // 제목
    var h = t.match(/^#{1,4}\s+(.*)$/);
    if (h) { html += '<p class="md-h">' + inlineMd(h[1]) + "</p>"; i++; continue; }

    // 글머리 목록
    if (/^([-*•])\s+/.test(t)) {
      html += "<ul>";
      while (i < lines.length && /^([-*•])\s+/.test(lines[i].trim())) {
        html += "<li>" + inlineMd(lines[i].trim().replace(/^([-*•])\s+/, "")) + "</li>";
        i++;
      }
      html += "</ul>";
      continue;
    }

    // 번호 목록
    if (/^\d+[.)]\s+/.test(t)) {
      html += "<ol>";
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        html += "<li>" + inlineMd(lines[i].trim().replace(/^\d+[.)]\s+/, "")) + "</li>";
        i++;
      }
      html += "</ol>";
      continue;
    }

    // 일반 문단
    var para = [t];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i].trim())) {
      para.push(lines[i].trim());
      i++;
    }
    html += "<p>" + para.map(inlineMd).join("<br>") + "</p>";
  }
  return html;
}

// ===== AI 채팅 =====
var chatLog = document.getElementById("chatLog");
var chatInput = document.getElementById("chatInput");
var chatBtn = document.getElementById("chatBtn");

function addMsg(text, who) {
  var div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  chatLog.appendChild(div);
  window.scrollTo(0, document.body.scrollHeight);
  return div;
}

// 지난 대화를 기억해서 서버로 같이 보내요
var chatHistory = [];

function newChat() {
  chatLog.innerHTML = "";
  chatHistory = [];
  document.body.classList.remove("chatting");
  chatInput.value = "";
}

async function sendChat(text) {
  var q = (text || chatInput.value).trim();
  if (!q) return;
  document.body.classList.add("chatting");
  addMsg(q, "me");
  chatInput.value = "";
  chatBtn.disabled = true;
  var waiting = addMsg("생각 중...", "ai");

  chatHistory.push({ role: "user", text: q });

  try {
    var res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: chatHistory })
    });
    var data = await res.json();

    if (data.reply) {
      waiting.innerHTML = renderMarkdown(data.reply);
      waiting.classList.add("md");
      chatHistory.push({ role: "model", text: data.reply });
    } else {
      waiting.textContent = data.error || "답변을 받지 못했어요.";
      chatHistory.pop(); // 실패한 질문은 기억에서 빼요
    }
  } catch (e) {
    waiting.textContent = "연결에 실패했어요. 잠시 후 다시 시도해 주세요.";
    chatHistory.pop();
  }
  chatBtn.disabled = false;
}

chatBtn.addEventListener("click", function () { sendChat(); });
chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") sendChat();
});
document.getElementById("newBtn").addEventListener("click", newChat);

document.querySelectorAll(".chip").forEach(function (chip) {
  chip.addEventListener("click", function () {
    sendChat(chip.getAttribute("data-q"));
  });
});

// ===== 화면 고정 (대화창만 스크롤) =====
// 새 메시지가 오면 대화창을 맨 아래로 내려요
var stageEl = document.querySelector(".stage");
new MutationObserver(function () {
  stageEl.scrollTop = stageEl.scrollHeight;
}).observe(document.getElementById("chatLog"), { childList: true, characterData: true, subtree: true });

// 아이폰 키보드가 올라와도 화면 높이를 맞춰요
if (window.visualViewport) {
  var fitViewport = function () {
    document.documentElement.style.setProperty("--vh", window.visualViewport.height + "px");
    window.scrollTo(0, 0);
  };
  window.visualViewport.addEventListener("resize", fitViewport);
  window.visualViewport.addEventListener("scroll", fitViewport);
  fitViewport();
}
