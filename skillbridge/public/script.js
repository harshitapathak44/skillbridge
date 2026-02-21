/* ═══════════════════════════════════════════════
   SKILLBRIDGE AI — script.js
   Frontend Logic: Form handling, API calls, Rendering
═══════════════════════════════════════════════ */

// ─── DOM References ───────────────────────────
const form          = document.getElementById("analyzeForm");
const generateBtn   = document.getElementById("generateBtn");
const loader        = document.getElementById("loader");
const errorWrap     = document.getElementById("errorWrap");
const errorMsg      = document.getElementById("errorMsg");
const resultsWrap   = document.getElementById("resultsWrap");
const sliderEl      = document.getElementById("confidence");
const sliderBubble  = document.getElementById("sliderBubble");
const sliderFill    = document.getElementById("sliderFill");
const loaderSteps   = document.querySelectorAll(".lstep");

// ─── Slider Logic ────────────────────────────
function updateSlider() {
  const val = sliderEl.value;
  const pct = ((val - 1) / 9) * 100;
  sliderBubble.textContent = val;
  sliderFill.style.width = `calc(${pct}% + ${(1 - pct / 100) * 0}px)`;
  // Correct calculation for thumb position
  const thumbOffset = (pct / 100) * (sliderEl.offsetWidth - 24);
  sliderFill.style.width = `calc(${thumbOffset}px + 12px)`;
}
sliderEl.addEventListener("input", updateSlider);
// Init on load
window.addEventListener("load", () => {
  setTimeout(updateSlider, 100);
});
window.addEventListener("resize", updateSlider);

// ─── Resource Tab Logic ──────────────────────
document.querySelectorAll(".res-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;
    document.querySelectorAll(".res-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".resources-panel").forEach((p) => {
      p.classList.toggle("hidden", p.dataset.panel !== target);
    });
  });
});

// ─── Loader Animation ────────────────────────
let loaderInterval = null;
function startLoaderAnimation() {
  let step = 0;
  loaderSteps.forEach((s) => { s.classList.remove("active", "done"); });
  loaderSteps[0].classList.add("active");
  loaderInterval = setInterval(() => {
    if (step < loaderSteps.length - 1) {
      loaderSteps[step].classList.remove("active");
      loaderSteps[step].classList.add("done");
      step++;
      loaderSteps[step].classList.add("active");
    }
  }, 2000);
}
function stopLoaderAnimation() {
  if (loaderInterval) clearInterval(loaderInterval);
  loaderSteps.forEach((s) => { s.classList.remove("active"); s.classList.add("done"); });
}

// ─── Visibility Helpers ──────────────────────
function showEl(el)  { el.hidden = false; }
function hideEl(el)  { el.hidden = true; }
function scrollTo(el){ el.scrollIntoView({ behavior: "smooth", block: "start" }); }

// ─── Reset ───────────────────────────────────
function resetForm() {
  hideEl(resultsWrap);
  hideEl(loader);
  hideEl(errorWrap);
  generateBtn.disabled = false;
  generateBtn.querySelector(".btn-text").textContent = "Generate My Roadmap";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Form Submit ─────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const confidence  = sliderEl.value;
  const skills      = document.getElementById("skills").value.trim();
  const desiredJob  = document.getElementById("desiredJob").value.trim();
  const weeklyHours = document.getElementById("weeklyHours").value;

  if (!skills || !desiredJob || !weeklyHours) {
    alert("Please fill in all required fields.");
    return;
  }

  // UI: loading state
  generateBtn.disabled = true;
  generateBtn.querySelector(".btn-text").textContent = "Analyzing...";
  hideEl(resultsWrap);
  hideEl(errorWrap);
  showEl(loader);
  startLoaderAnimation();
  scrollTo(loader);

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confidence, skills, desiredJob, weeklyHours }),
    });

    const result = await response.json();

    stopLoaderAnimation();
    hideEl(loader);

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Unknown server error.");
    }

    renderResults(result.data);
    showEl(resultsWrap);
    scrollTo(resultsWrap);
    generateBtn.disabled = false;
    generateBtn.querySelector(".btn-text").textContent = "Generate My Roadmap";

  } catch (err) {
    stopLoaderAnimation();
    hideEl(loader);
    errorMsg.textContent = err.message || "Unexpected error. Please try again.";
    showEl(errorWrap);
    scrollTo(errorWrap);
    generateBtn.disabled = false;
    generateBtn.querySelector(".btn-text").textContent = "Generate My Roadmap";
  }
});

// ═══════════════════════════════════════════════
//  RENDER FUNCTIONS
// ═══════════════════════════════════════════════

function escHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getLevelClass(level) {
  const l = (level || "").toLowerCase();
  if (l.includes("begin")) return "level-beginner";
  if (l.includes("inter")) return "level-intermediate";
  if (l.includes("advan")) return "level-advanced";
  return "";
}

// ─── Master Render ────────────────────────────
function renderResults(d) {
  renderProfile(d);
  renderRoles(d);
  renderGaps(d);
  renderRoadmap(d);
  renderSchedule(d);
  renderResources(d);
  renderFeedback(d);
  renderJson(d);
}

// ─── Profile Card ─────────────────────────────
function renderProfile(d) {
  document.getElementById("profileSummary").textContent = d.profile_summary || "—";

  const lvlEl = document.getElementById("statLevel");
  lvlEl.textContent = d.current_level || "—";
  lvlEl.className = "stat-value " + getLevelClass(d.current_level);

  document.getElementById("statRole").textContent = d.recommended_role || "—";
}

// ─── Roles Card ──────────────────────────────
function renderRoles(d) {
  document.getElementById("primaryRole").textContent = d.recommended_role || "—";

  const altEl = document.getElementById("altRoles");
  altEl.innerHTML = "";
  (d.alternative_roles || []).forEach((role) => {
    const pill = document.createElement("span");
    pill.className = "alt-role-pill";
    pill.textContent = role;
    altEl.appendChild(pill);
  });
}

// ─── Skill Gaps Card ──────────────────────────
function renderGaps(d) {
  const el = document.getElementById("gapsList");
  el.innerHTML = "";
  (d.skill_gaps || []).forEach((gap) => {
    const tag = document.createElement("span");
    tag.className = "gap-tag";
    tag.textContent = gap;
    el.appendChild(tag);
  });
}

// ─── Roadmap Phases ───────────────────────────
const PHASE_COLORS = ["#f5a623", "#5ca8ff", "#a78bff", "#52d98c"];
const PHASE_ICONS  = ["⬡", "◈", "◎", "✦"];

function renderPhaseCard(phaseData, phaseKey, index) {
  const p = phaseData || {};
  const topics   = Array.isArray(p.topics) ? p.topics : [];
  const color    = PHASE_COLORS[index] || "#f5a623";
  const icon     = PHASE_ICONS[index] || "→";
  const num      = index + 1;

  return `
  <div class="phase-card">
    <div class="phase-badge" style="background:${color}18;border-color:${color}44;color:${color}">
      ${icon} Phase ${num}
    </div>
    <div class="phase-title">${escHtml(p.title || `Phase ${num}`)}</div>
    <div class="phase-duration">${escHtml(p.duration || "")}</div>
    <ul class="phase-topics">
      ${topics.map((t) => `<li>${escHtml(t)}</li>`).join("")}
    </ul>
    <div class="phase-task-label">Weekly Plan</div>
    <div class="phase-task">${escHtml(p.weekly_plan || "")}</div>
    ${p.practical_task ? `
    <div class="phase-task-label" style="margin-top:0.6rem">Practical Task</div>
    <div class="phase-task" style="color:#a78bff;background:rgba(167,139,255,0.08)">${escHtml(p.practical_task)}</div>
    ` : ""}
  </div>`;
}

function renderRoadmap(d) {
  const grid = document.getElementById("phasesGrid");
  const phases = d.roadmap || {};
  const phaseKeys = ["phase_1", "phase_2", "phase_3", "phase_4"];
  grid.innerHTML = phaseKeys
    .map((key, i) => renderPhaseCard(phases[key], key, i))
    .join("");
}

// ─── Schedule Card ────────────────────────────
function renderSchedule(d) {
  document.getElementById("scheduleBox").textContent = d.weekly_schedule || "Not specified.";
}

// ─── Resources Card ───────────────────────────
function buildResourceItem(item, icon) {
  const url = item.url || "#";
  const isExternal = url.startsWith("http");
  return `
  <a class="resource-item" href="${escHtml(url)}" target="${isExternal ? "_blank" : "_self"}" rel="noopener noreferrer">
    <span class="resource-item-icon">${icon}</span>
    <div class="resource-item-body">
      <div class="resource-item-name">${escHtml(item.name || "Resource")}</div>
      <div class="resource-item-desc">${escHtml(item.topic || item.description || "")}</div>
      <div class="resource-item-url">${escHtml(url)}</div>
    </div>
    <span class="resource-item-arrow">↗</span>
  </a>`;
}

function renderResources(d) {
  const res = d.free_resources || {};
  const yt  = Array.isArray(res.youtube)            ? res.youtube            : [];
  const doc = Array.isArray(res.docs)               ? res.docs               : [];
  const pr  = Array.isArray(res.practice_platforms) ? res.practice_platforms : [];

  document.getElementById("resYoutube").innerHTML =
    yt.length ? yt.map((r) => buildResourceItem(r, "▶")).join("") : "<p style='color:var(--muted);font-size:0.8rem'>No YouTube resources listed.</p>";

  document.getElementById("resDocs").innerHTML =
    doc.length ? doc.map((r) => buildResourceItem(r, "📄")).join("") : "<p style='color:var(--muted);font-size:0.8rem'>No docs listed.</p>";

  document.getElementById("resPractice").innerHTML =
    pr.length ? pr.map((r) => buildResourceItem(r, "💻")).join("") : "<p style='color:var(--muted);font-size:0.8rem'>No platforms listed.</p>";
}

// ─── Feedback Card ────────────────────────────
function renderFeedback(d) {
  document.getElementById("feedbackText").textContent    = d.feedback       || "—";
  document.getElementById("motivationText").textContent  = d.motivation_tip || "Keep going.";
}

// ─── JSON Output ──────────────────────────────
function renderJson(d) {
  document.getElementById("jsonOutput").textContent = JSON.stringify(d, null, 2);
}
