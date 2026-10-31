const STORAGE_KEY = "nextdns_hisense_v4";
const THEME_KEY = "nextdns_theme";
const OPEN_KEY = "nextdns_open_cats";

let DATA = [];
let done = {};
let openCats = {};
let total = 0;
let filter = "all";
let searchTimer = null;
let searchQuery = "";
let toastTimer = null;
const LANG_KEY = "nextdns_lang";
let LANG = "es";

const I18N = {
  es: {
    h1a: "Bloquea.", h1b: "Copia.", h1c: "Listo.", badge: "dominios para bloquear",
    btn1: "Ver dominios", btn2: "Cómo usarlo", demo: "Es el bicho de la telemetría. Tócalo",
    cats: "Categorías", skip: "Saltar al contenido", nav_list: "Dominios", nav_how: "Cómo usarlo",
    lead: "Lista de dominios de telemetría, publicidad y rastreo de tu televisor. Cópialos y pégalos en NextDNS → Denylist.",
    st_domains: "dominios", st_cats: "categorías", st_risk: "con aviso", search: "Buscar dominio o descripción…",
    progress: "Progreso", f_all: "Todos", f_pending: "Pendientes", f_done: "Copiados", f_risk: "Con aviso",
    how_t: "Cómo usarlo",
    s1: "Abre NextDNS → tu configuración → <strong>Denylist</strong>.",
    s2: "Copia un dominio con su botón <strong>Copiar</strong>.",
    s3: "Pégalo y pulsa <strong>Agregar</strong>. Repite con cada dominio; los subdominios también se bloquean.",
    s4: "Los marcados en naranja pueden afectar alguna función del televisor.",
    copy: "Copiar", done: "Listo", risk: "Puede afectar el TV",
    copied: "Copiado: ", one: "1 dominio copiado", many: " dominios copiados",
    cleared: "Marcas borradas", confirm: "¿Borrar todas las marcas de copiado?", empty: "No hay dominios con este filtro"
  },
  en: {
    h1a: "Block.", h1b: "Copy.", h1c: "Done.", badge: "domains to block",
    btn1: "View domains", btn2: "How to use", demo: "The telemetry bug. Tap it",
    cats: "Categories", skip: "Skip to content", nav_list: "Domains", nav_how: "How to use",
    lead: "Telemetry, advertising and tracking domains from your TV. Copy them and paste into NextDNS → Denylist.",
    st_domains: "domains", st_cats: "categories", st_risk: "with warning", search: "Search domain or description…",
    progress: "Progress", f_all: "All", f_pending: "Pending", f_done: "Copied", f_risk: "Warning",
    how_t: "How to use it",
    s1: "Open NextDNS → your configuration → <strong>Denylist</strong>.",
    s2: "Copy a domain with its <strong>Copy</strong> button.",
    s3: "Paste it and press <strong>Add</strong>. Repeat for each domain; subdomains are blocked too.",
    s4: "Items marked in orange may affect some TV features.",
    copy: "Copy", done: "Done", risk: "May affect the TV",
    copied: "Copied: ", one: "1 domain copied", many: " domains copied",
    cleared: "Marks cleared", confirm: "Clear all copied marks?", empty: "No domains match this filter"
  }
};

function t(k) {
  return (I18N[LANG] && I18N[LANG][k]) || I18N.es[k] || k;
}

function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.querySelectorAll(".seg button").forEach(function (b) {
    b.classList.toggle("on", b.dataset.lang === LANG);
  });
}

function setLang(l) {
  LANG = l;
  try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
  applyStatic();
  buildCatNav();
  updateProgress();
  render();
}

function countUp(el, to) {
  if (!el) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = to; return; }
  const t0 = performance.now(), dur = 1100;
  (function tick(now) {
    const k = Math.min(1, (now - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}

function updateStats() {
  let risk = 0;
  DATA.forEach(function (g) { g.items.forEach(function (i) { if (i.r) risk++; }); });
  const set = function (id, v) { const el = document.getElementById(id); if (el) el.textContent = v; };
  countUp(document.getElementById("st-total"), total);
  countUp(document.getElementById("st-cats"), DATA.length);
  countUp(document.getElementById("st-risk"), risk);
}

function txt(obj) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[LANG] || obj.es || obj.en || obj[Object.keys(obj)[0]] || "";
}

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

/* ── theme ── */
function ic(n) {
  return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
}

function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.content = mode === "light" ? "#faf6f2" : "#0a0908";
  const btn = document.getElementById("theme");
  if (btn) {
    btn.innerHTML = ic(mode === "light" ? "moon" : "sun");
    btn.title = mode === "light" ? "Dark" : "Light";
  }
}

function loadTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  applyTheme(saved === "light" ? "light" : "dark");
}

function cycleTheme() {
  applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
}

/* ── clipboard ── */
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(function () {
      return fallbackCopy(text);
    });
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
  const a = document.createElement("textarea");
  a.value = text;
  a.setAttribute("readonly", "");
  a.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
  document.body.appendChild(a);
  a.select();
  try {
    document.execCommand("copy");
  } catch (e) {}
  document.body.removeChild(a);
}

/* ── toast ── */
function showToast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    el.classList.remove("show");
  }, 2200);
}

/* ── progress ── */
function updateProgress() {
  const n = Object.keys(done).length;
  const el = document.getElementById("cnt");
  if (el) el.textContent = n + " / " + total;
  const fill = document.getElementById("progress-fill");
  if (fill) fill.style.width = total ? Math.round((n / total) * 100) + "%" : "0%";
}

function markDone(domain) {
  if (done[domain]) return;
  done[domain] = 1;
  saveJSON(STORAGE_KEY, done);
  updateProgress();
}

function passFilter(item) {
  const isDone = !!done[item.d];
  if (filter === "pending") return !isDone;
  if (filter === "done") return isDone;
  if (filter === "risk") return !!item.r;
  return true;
}

function matchSearch(item, q) {
  if (!q) return true;
  return (item.d + " " + txt(item.c)).toLowerCase().indexOf(q) !== -1;
}

/* ── category nav ── */
function buildCatNav() {
  const nav = document.getElementById("cat-nav");
  if (!nav) return;
  nav.replaceChildren();
  for (let i = 0; i < DATA.length; i++) {
    const g = DATA[i];
    const a = document.createElement("a");
    a.href = "#cat-" + g.id;
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = txt(g.titles);
    const ct = document.createElement("span");
    ct.className = "ct";
    a.appendChild(nm);
    a.appendChild(ct);
    a.dataset.cat = String(g.id);
    a.addEventListener("click", function (e) {
      e.preventDefault();
      closeSheet();
      openCats[String(g.id)] = true;
      saveJSON(OPEN_KEY, openCats);
      const el = document.getElementById("cat-" + g.id);
      if (el) {
        el.classList.add("open");
        const head = el.querySelector(".cat-head");
        if (head) head.setAttribute("aria-expanded", "true");
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      highlightNav(String(g.id));
    });
    nav.appendChild(a);
  }
}

function shortTitle(title) {
  if (title.length <= 28) return title;
  return title.slice(0, 26) + "…";
}

function highlightNav(id) {
  const links = document.querySelectorAll(".cat-nav a");
  let act = null;
  for (let i = 0; i < links.length; i++) {
    const on = links[i].dataset.cat === id;
    links[i].classList.toggle("active", on);
    if (on) act = links[i];
  }
  const nav = document.getElementById("cat-nav");
  if (act && nav && nav.scrollHeight > nav.clientHeight) {
    nav.scrollTop = act.offsetTop - nav.clientHeight / 2 + act.offsetHeight / 2;
  }
}

function updateNavCounts() {
  const links = document.querySelectorAll(".cat-nav a");
  for (let i = 0; i < links.length; i++) {
    const g = DATA.find(function (x) { return String(x.id) === links[i].dataset.cat; });
    if (!g) continue;
    let vis = 0, dn = 0;
    g.items.forEach(function (it) {
      if (passFilter(it) && matchSearch(it, searchQuery)) { vis++; if (done[it.d]) dn++; }
    });
    const ct = links[i].querySelector(".ct");
    if (ct) ct.textContent = dn + "/" + vis;
    links[i].style.display = vis ? "" : "none";
  }
}

function setTb() {
  const tb = document.getElementById("toolbar");
  if (tb) document.documentElement.style.setProperty("--tb", tb.offsetHeight + "px");
}

function openSheet() {
  const s = document.getElementById("side"), bg = document.getElementById("sheet-bg");
  if (s) s.classList.add("open");
  if (bg) bg.classList.add("show");
}

function closeSheet() {
  const s = document.getElementById("side"), bg = document.getElementById("sheet-bg");
  if (s) s.classList.remove("open");
  if (bg) bg.classList.remove("show");
}

/* ── render ── */
function render() {
  const box = document.getElementById("list");
  if (!box) return;

  const q = searchQuery;
  const frag = document.createDocumentFragment();
  let any = false;
  const visibleIds = [];

  for (let gi = 0; gi < DATA.length; gi++) {
    const g = DATA[gi];
    const items = [];
    for (let ii = 0; ii < g.items.length; ii++) {
      const item = g.items[ii];
      if (passFilter(item) && matchSearch(item, q)) items.push(item);
    }
    if (!items.length) continue;
    any = true;
    visibleIds.push(String(g.id));

    const catId = String(g.id);
    const forceOpen = !!q;
    const isOpen = forceOpen || openCats[catId] !== false;

    let doneInCat = 0;
    for (let i = 0; i < items.length; i++) if (done[items[i].d]) doneInCat++;

    const cat = document.createElement("div");
    cat.className = "cat" + (isOpen ? " open" : "");
    cat.id = "cat-" + g.id;
    cat.dataset.id = catId;

    const head = document.createElement("button");
    head.type = "button";
    head.className = "cat-head";
    head.setAttribute("aria-expanded", isOpen ? "true" : "false");

    const chev = document.createElement("span");
    chev.className = "cat-chevron";
    chev.setAttribute("aria-hidden", "true");
    chev.innerHTML = '' + ic("chevron") + '';

    const title = document.createElement("span");
    title.className = "cat-title";
    title.textContent = txt(g.titles);

    const meta = document.createElement("span");
    meta.className = "cat-meta";
    meta.textContent = doneInCat + " / " + items.length;

    head.appendChild(chev);
    head.appendChild(title);
    head.appendChild(meta);

    const body = document.createElement("div");
    body.className = "cat-body";

    const bodyInner = document.createElement("div");
    bodyInner.className = "cat-body-inner";

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isDone = !!done[item.d];

      const row = document.createElement("div");
      row.className = "row" + (isDone ? " done" : "");
      row.dataset.domain = item.d;

      const tx = document.createElement("div");
      tx.className = "tx";

      const dm = document.createElement("div");
      dm.className = "dm";
      dm.textContent = item.d;

      const cs = document.createElement("div");
      cs.className = "cs";
      cs.textContent = txt(item.c);

      tx.appendChild(dm);
      tx.appendChild(cs);

      if (item.r) {
        const rk = document.createElement("div");
        rk.className = "rk";
        rk.innerHTML = '' + ic("warn") + ' ' + t("risk");
        tx.appendChild(rk);
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = isDone ? "ok" : "go";
      btn.dataset.action = "copy-one";
      btn.dataset.domain = item.d;
      btn.innerHTML = isDone
        ? '' + ic("check") + ' <span>' + t("done") + '</span>'
        : '' + ic("copy") + ' <span>' + t("copy") + '</span>';

      row.appendChild(tx);
      row.appendChild(btn);
      bodyInner.appendChild(row);
    }

    body.appendChild(bodyInner);
    cat.appendChild(head);
    cat.appendChild(body);
    frag.appendChild(cat);
  }

  box.replaceChildren(frag);

  if (!revealed && io) {
    revealed = true;
    box.querySelectorAll(".cat").forEach(function (c, i) {
      c.classList.add("reveal");
      c.style.setProperty("--d", (i % 4) * 70 + "ms");
      io.observe(c);
    });
  }

  if (!any) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = t("empty");
    box.appendChild(empty);
  }

  updateNavCounts();
  setTb();
}

/* ── events ── */
function onListClick(e) {
  const target = e.target;
  if (!(target instanceof Element)) return;

  const oneBtn = target.closest("[data-action='copy-one']");
  if (oneBtn) {
    e.stopPropagation();
    const domain = oneBtn.dataset.domain;
    copyText(domain).then(function () {
      markDone(domain);
      const row = oneBtn.closest(".row");
      if (row) {
        row.classList.add("done", "just-copied");
        oneBtn.className = "ok";
        oneBtn.innerHTML = '' + ic("check") + ' <span>' + t("done") + '</span>';
        setTimeout(function () {
          row.classList.remove("just-copied");
        }, 600);
      }
      const cat = oneBtn.closest(".cat");
      if (cat) {
        const meta = cat.querySelector(".cat-meta");
        if (meta) {
          const all = cat.querySelectorAll(".row").length;
          const dCount = cat.querySelectorAll(".row.done").length;
          meta.textContent = dCount + " / " + all;
        }
      }
      updateNavCounts();
      showToast(t("copied") + domain);
    });
    return;
  }

  const head = target.closest(".cat-head");
  if (head) {
    const cat = head.closest(".cat");
    if (!cat) return;
    const open = cat.classList.toggle("open");
    openCats[cat.dataset.id] = open;
    saveJSON(OPEN_KEY, openCats);
    head.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) highlightNav(cat.dataset.id);
  }
}

function setFilter(f) {
  filter = f;
  document.querySelectorAll(".chip[data-filter]").forEach(function (c) {
    c.classList.toggle("on", c.dataset.filter === f);
  });
  render();
}

function onSearchInput() {
  const q = (document.getElementById("q").value || "").trim().toLowerCase();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(function () {
    searchQuery = q;
    render();
  }, 120);
}

let scrollTick = false;
function onScroll() {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(function () {
    scrollTick = false;
    const cats = document.querySelectorAll(".cat");
    const tb = document.getElementById("toolbar");
    const line = (tb ? tb.getBoundingClientRect().bottom : 0) + 28;
    let current = cats.length ? cats[0].dataset.id : null;
    for (let i = 0; i < cats.length; i++) {
      if (cats[i].getBoundingClientRect().top <= line) current = cats[i].dataset.id;
    }
    if (current) highlightNav(current);
  });
}

let io = null;
let revealed = false;

function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (e) { e.classList.add("in"); });
    return;
  }
  io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
  els.forEach(function (e) { io.observe(e); });
}

function initBug() {
  const bug = document.getElementById("bug");
  if (!bug) return;
  bug.addEventListener("click", function () {
    bug.classList.remove("hop");
    void bug.getBoundingClientRect();
    bug.classList.add("hop");
  });
  bug.addEventListener("animationend", function (e) {
    if (e.animationName === "hop") bug.classList.remove("hop");
  });
}

function init() {
  document.documentElement.classList.add("js");
  loadTheme();
  let savedLang = null;
  try { savedLang = localStorage.getItem(LANG_KEY); } catch (e) {}
  LANG = savedLang === "en" || savedLang === "es"
    ? savedLang
    : ((navigator.language || "es").toLowerCase().indexOf("es") === 0 ? "es" : "en");
  applyStatic();
  done = loadJSON(STORAGE_KEY, {});
  openCats = loadJSON(OPEN_KEY, {});

  DATA = typeof DOMAINS !== "undefined" ? DOMAINS : [];
  total = 0;
  for (let i = 0; i < DATA.length; i++) total += DATA[i].items.length;

  if (Object.keys(openCats).length === 0 && DATA.length) {
    for (let i = 0; i < DATA.length; i++) {
      openCats[String(DATA[i].id)] = i === 0;
    }
    saveJSON(OPEN_KEY, openCats);
  }

  updateStats();
  buildCatNav();
  updateProgress();
  initReveal();
  render();
  initBug();
  setTb();
  onScroll();

  const tgl = document.getElementById("cat-toggle");
  if (tgl) tgl.addEventListener("click", openSheet);
  const cls = document.getElementById("cat-close");
  if (cls) cls.addEventListener("click", closeSheet);
  const sbg = document.getElementById("sheet-bg");
  if (sbg) sbg.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });
  window.addEventListener("resize", setTb);

  document.querySelectorAll(".seg button").forEach(function (b) {
    b.addEventListener("click", function () { if (b.dataset.lang !== LANG) setLang(b.dataset.lang); });
  });

  const list = document.getElementById("list");
  if (list) list.addEventListener("click", onListClick);

  const q = document.getElementById("q");
  if (q) q.addEventListener("input", onSearchInput);

  const rs = document.getElementById("rs");
  if (rs) {
    rs.addEventListener("click", function () {
      if (confirm(t("confirm"))) {
        done = {};
        saveJSON(STORAGE_KEY, done);
        updateProgress();
        render();
        showToast(t("cleared"));
      }
    });
  }

  const theme = document.getElementById("theme");
  if (theme) theme.addEventListener("click", cycleTheme);

  document.querySelectorAll(".chip[data-filter]").forEach(function (c) {
    c.addEventListener("click", function () {
      setFilter(c.dataset.filter);
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
