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

// ===== 슬라이드 메뉴 / 도감 열고 닫기 =====
var drawer = document.getElementById("drawer");
var overlay = document.getElementById("overlay");
var dex = document.getElementById("dex");

function isNarrow() { return window.matchMedia("(max-width: 899px)").matches; }

function openDrawer() {
  document.body.classList.add("drawer-open");
  drawer.setAttribute("aria-hidden", "false");
  renderHistory();
}
function closeDrawer() {
  document.body.classList.remove("drawer-open");
  drawer.setAttribute("aria-hidden", "true");
}

document.getElementById("menuBtn").addEventListener("click", openDrawer);
document.getElementById("drawerClose").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);

document.getElementById("drawerNew").addEventListener("click", function () {
  newChat();
  if (isNarrow()) closeDrawer();
});
document.getElementById("drawerDex").addEventListener("click", function () {
  closeDrawer();
  dex.hidden = false;
});
document.getElementById("drawerSettings").addEventListener("click", function () {
  alert("설정 기능은 준비 중이에요.");
});
document.getElementById("dexClose").addEventListener("click", function () { dex.hidden = true; });
document.getElementById("loginBtn").addEventListener("click", function () {
  alert("로그인 기능은 준비 중이에요.");
});
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") { closeDrawer(); dex.hidden = true; }
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

// ===== 채팅 기록 (이 기기의 브라우저에만 저장돼요) =====
var HIST_KEY = "fotmini_history_v1";
var MAX_CHATS = 30;
var chats = [];           // [{id, title, titled, ts, messages:[{role,text}]}]
var currentChatId = null;
var titling = {};

var BUBBLE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M4 5h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 17H10l-4.5 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 5z"/>' +
  '<path d="M8 11h.01M12 11h.01M16 11h.01" stroke-width="2.6"/></svg>';

function loadChats() {
  try {
    var raw = localStorage.getItem(HIST_KEY);
    chats = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(chats)) chats = [];
  } catch (e) { chats = []; }
}

function persistChats() {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(chats)); } catch (e) {}
}

function pad2(n) { return n < 10 ? "0" + n : "" + n; }
function fmtDate(ts) {
  var d = new Date(ts);
  return pad2(d.getMonth() + 1) + "." + pad2(d.getDate());
}

function renderHistory() {
  var box = document.getElementById("histList");
  box.innerHTML = "";
  if (!chats.length) {
    box.innerHTML = '<p class="hist-empty">아직 대화가 없어요.</p>';
    return;
  }
  chats.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "hist-item" + (c.id === currentChatId ? " active" : "");
    b.innerHTML = BUBBLE_SVG + '<span class="hist-title"></span><span class="hist-date"></span>';
    b.querySelector(".hist-title").textContent = c.title;
    b.querySelector(".hist-date").textContent = fmtDate(c.ts);
    b.addEventListener("click", function () { openChat(c.id); });
    box.appendChild(b);
  });
}

function saveCurrentChat() {
  if (!chatHistory.length) return;
  var chat = null;
  for (var i = 0; i < chats.length; i++) {
    if (chats[i].id === currentChatId) { chat = chats[i]; chats.splice(i, 1); break; }
  }
  if (!chat) {
    currentChatId = String(Date.now());
    chat = { id: currentChatId, title: String(chatHistory[0].text).slice(0, 40), titled: false };
  }
  chat.ts = Date.now();
  chat.messages = chatHistory.slice(-40);
  chats.unshift(chat);
  chats = chats.slice(0, MAX_CHATS);
  persistChats();
  renderHistory();

  // 아직 요약 제목이 없으면 AI에게 제목을 부탁해요
  if (!chat.titled && chatHistory.length >= 2) {
    makeTitle(chat.id, chatHistory[0].text, chatHistory[1].text);
  }
}

async function makeTitle(id, question, answer) {
  if (titling[id]) return;
  titling[id] = true;
  try {
    var res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "title", question: question, answer: answer })
    });
    var data = await res.json();
    var t = ((data && data.title) || "").trim();
    if (!t) return;
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].id === id) { chats[i].title = t; chats[i].titled = true; break; }
    }
    persistChats();
    renderHistory();
  } catch (e) {
    // 실패하면 임시 제목을 그대로 써요
  } finally {
    titling[id] = false;
  }
}

document.getElementById("histClear").addEventListener("click", function () {
  if (!chats.length) return;
  if (confirm("저장된 채팅 기록을 모두 지울까요?")) {
    chats = [];
    currentChatId = null;
    persistChats();
    renderHistory();
  }
});

// ===== AI 채팅 =====
var chatLog = document.getElementById("chatLog");
var chatInput = document.getElementById("chatInput");
var chatBtn = document.getElementById("chatBtn");

// 지난 대화를 기억해서 서버로 같이 보내요
var chatHistory = [];
var busy = false;

function addMsg(text, who) {
  var div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  chatLog.appendChild(div);
  return div;
}

function addAiMd(text) {
  var div = addMsg("", "ai");
  div.innerHTML = renderMarkdown(text);
  div.classList.add("md");
  return div;
}

function newChat() {
  if (busy) return;
  chatLog.innerHTML = "";
  chatHistory = [];
  currentChatId = null;
  document.body.classList.remove("chatting");
  chatInput.value = "";
  renderHistory();
}

function openChat(id) {
  if (busy) return;
  var c = null;
  for (var i = 0; i < chats.length; i++) { if (chats[i].id === id) { c = chats[i]; break; } }
  if (!c) return;

  chatLog.innerHTML = "";
  chatHistory = c.messages.slice();
  currentChatId = id;
  chatHistory.forEach(function (m) {
    if (m.role === "model") addAiMd(m.text);
    else addMsg(m.text, "me");
  });
  document.body.classList.add("chatting");
  renderHistory();
  if (isNarrow()) closeDrawer();
}

async function sendChat(text) {
  if (busy) return;
  var q = (text || chatInput.value).trim();
  if (!q) return;

  busy = true;
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

    // 서버가 이상한 응답을 주면 그 내용을 그대로 보여줘서 원인을 알 수 있게 해요
    var raw = await res.text();
    var data;
    try { data = JSON.parse(raw); }
    catch (err) { data = { error: "서버 오류 (" + res.status + "): " + raw.slice(0, 80) }; }

    if (data.reply) {
      waiting.innerHTML = renderMarkdown(data.reply);
      waiting.classList.add("md");
      chatHistory.push({ role: "model", text: data.reply });
      saveCurrentChat();
    } else {
      waiting.textContent = data.error || "답변을 받지 못했어요.";
      chatHistory.pop(); // 실패한 질문은 기억에서 빼요
    }
  } catch (e) {
    waiting.textContent = "연결에 실패했어요. 잠시 후 다시 시도해 주세요.";
    chatHistory.pop();
  }
  busy = false;
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

loadChats();
renderHistory();

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
