function renderInfoItem(label, value) {
  return `
    <div class="info-strip-item">
      <p>${escapeHtml(label)}</p>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function prizeLine(label, value) {
  return `<div class="surface-card"><p>${escapeHtml(label)}</p><strong>${escapeHtml(formatCurrency(value))}</strong></div>`;
}

async function loadTournamentDetail() {
  const content = document.getElementById("tournamentDetailContent");
  if (!content) return;
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    content.innerHTML = '<div class="error-card"><p class="error-text">Tournament not found.</p></div>';
    return;
  }

  setLoading(content, '<div class="loading-card"><div class="skeleton" style="height:280px;"></div></div>');

  try {
    const user = getUser();
    const data = await getTournamentDetail(id, user.token || "");
    const item = data.data || data.tournament || data;
    if (!item || data.success === false) {
      content.innerHTML = '<div class="error-card"><p class="error-text">Tournament not found.</p></div>';
      return;
    }

    const banner = pick(item, ["bannerUrl", "BannerURL", "banner"]);
    const status = String(pick(item, ["status", "Status"], "upcoming")).toLowerCase();
    const slots = Number(pick(item, ["totalSlots", "TotalSlots"], 0));
    const filled = Number(pick(item, ["registeredCount", "RegisteredCount"], 0));
    const remaining = Math.max(slots - filled, 0);
    const roomId = pick(item, ["roomId", "RoomID"]);
    const roomPass = pick(item, ["roomPass", "RoomPassword", "roomPassword"]);
    const isRegistered = Boolean(pick(item, ["isRegistered", "registered"], false));

    content.innerHTML = `
      <div class="stack">
        <section class="tournament-hero ${banner ? "" : "banner-fallback"}" ${banner ? `style="background:url('${escapeHtml(banner)}') center/cover"` : ""}>
          <h1 class="tournament-hero-title">${escapeHtml(pick(item, ["name", "Name"], "Tournament"))}</h1>
        </section>
        <section class="info-strip">
          ${renderInfoItem("Game", pick(item, ["game", "Game"], "Free Fire"))}
          ${renderInfoItem("Date", formatDate(pick(item, ["date", "Date"]))) }
          ${renderInfoItem("Time", formatTime(pick(item, ["time", "Time"]))) }
          ${renderInfoItem("Prize", formatCurrency(pick(item, ["prizePool", "PrizePool"], 0))) }
          ${renderInfoItem("Slots Remaining", `${remaining}`) }
        </section>
        <section class="detail-layout">
          <div class="stack">
            <div class="tabs">
              <button class="tab-btn active" data-tab="overview">Overview</button>
              <button class="tab-btn" data-tab="rules">Rules</button>
              <button class="tab-btn" data-tab="schedule">Schedule</button>
              <button class="tab-btn" data-tab="prize">Prize Breakdown</button>
            </div>
            <div class="panel active surface-card" data-tab="overview">
              <p>${escapeHtml(pick(item, ["description", "Description"], "Details coming soon."))}</p>
              <div class="stack" style="margin-top:1rem;">
                <div><p>Map Name</p><strong>${escapeHtml(pick(item, ["mapName", "MapName"], "TBD"))}</strong></div>
                <div><p>Entry Requirements</p><strong>${escapeHtml(pick(item, ["entryRequirements", "EntryRequirements"], "All eligible players can join."))}</strong></div>
              </div>
            </div>
            <div class="panel surface-card" data-tab="rules">
              <p style="white-space:pre-line;">${escapeHtml(pick(item, ["rules", "Rules"], "Rules will be announced before the match."))}</p>
            </div>
            <div class="panel surface-card" data-tab="schedule">
              <p style="white-space:pre-line;">${escapeHtml(pick(item, ["schedule", "Schedule"], `${formatDate(pick(item, ["date", "Date"]))} - ${formatTime(pick(item, ["time", "Time"]))}`))}</p>
            </div>
            <div class="panel" data-tab="prize">
              <div class="grid grid-3">
                ${prizeLine("1st Place", pick(item, ["firstPrize", "FirstPrize"], pick(item, ["prizePool", "PrizePool"], 0)))}
                ${prizeLine("2nd Place", pick(item, ["secondPrize", "SecondPrize"], 0))}
                ${prizeLine("3rd Place", pick(item, ["thirdPrize", "ThirdPrize"], 0))}
              </div>
            </div>
          </div>
          <aside class="sticky-card">
            <div class="surface-card stack" id="detailSidebar"></div>
          </aside>
        </section>
      </div>
    `;

    document.querySelectorAll(".tab-btn").forEach((button) => {
      button.addEventListener("click", () => togglePanels(".tab-btn", ".panel", button.dataset.tab));
    });

    const sidebar = document.getElementById("detailSidebar");

    if (status === "upcoming") {
      sidebar.innerHTML = `
        <h3>Ready to lock in?</h3>
        <p>Secure your slot before the lobby fills up.</p>
        <button class="btn-primary" id="registerTournamentBtn" ${isRegistered ? "disabled" : ""}>${isRegistered ? "Registered ?" : "Register"}</button>
        <p id="registerState" style="color: var(--success);">${isRegistered ? "Registered!" : ""}</p>
      `;

      const registerBtn = document.getElementById("registerTournamentBtn");
      if (registerBtn && !isRegistered) {
        registerBtn.addEventListener("click", async () => {
          const currentUser = getUser();
          if (!currentUser.token) {
            localStorage.setItem("returnUrl", window.location.pathname + window.location.search);
            window.location.href = "/login.html";
            return;
          }

          registerBtn.disabled = true;
          registerBtn.textContent = "Registering...";
          const response = await registerTournament(currentUser.token, id);
          const state = document.getElementById("registerState");
          if (response.success) {
            state.textContent = "Registered!";
            registerBtn.textContent = "Registered ?";
          } else {
            state.style.color = "#ff8c87";
            state.textContent = response.message || "Registration failed.";
            registerBtn.disabled = false;
            registerBtn.textContent = "Register";
          }
        });
      }
    } else if (status === "ongoing") {
      sidebar.innerHTML = isRegistered ? `
        <h3>Room Access</h3>
        <div class="room-box">
          <p>Room ID</p>
          <code>${escapeHtml(roomId || "Pending")}</code>
        </div>
        <div class="room-box">
          <p>Password</p>
          <code>${escapeHtml(roomPass || "Pending")}</code>
        </div>
      ` : `
        <h3>Match Access</h3>
        <p>You are not registered for this tournament.</p>
      `;
    } else {
      sidebar.innerHTML = `
        <h3>Tournament Closed</h3>
        <p>This tournament has ended. Check the leaderboard for results.</p>
      `;
    }
  } catch (error) {
    console.error(error);
    renderError(content, loadTournamentDetail);
  }
}

document.addEventListener("DOMContentLoaded", loadTournamentDetail);
