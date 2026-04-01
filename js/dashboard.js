async function loadDashboard() {
  await requireAuth();
  const user = getUser();
  const profilePanel = document.getElementById("profilePanel");
  const tournamentsPanel = document.getElementById("myTournamentsPanel");
  const historyPanel = document.getElementById("matchHistoryPanel");
  const changePanel = document.getElementById("changeRequestPanel");
  const greeting = document.getElementById("dashboardGreeting");
  const userName = document.getElementById("dashboardUserName");

  if (greeting) greeting.textContent = `${getPlayerName()} Dashboard`;
  if (userName) userName.textContent = getPlayerName();
  bindScrollTabs(".dashboard-tab", ".dashboard-panel");

  profilePanel.innerHTML = createFakeLoader("Loading profile", 4);
  tournamentsPanel.innerHTML = createFakeLoader("Loading tournaments", 4);
  historyPanel.innerHTML = createFakeLoader("Loading match history", 4);
  changePanel.innerHTML = createFakeLoader("Loading change requests", 3);

  try {
    const [profileRes, tournamentsRes, historyRes, changeRes] = await Promise.all([
      getProfile(user.userId),
      getRegisteredTournaments(user.token),
      getMatchHistory(user.userId),
      apiGet("getChangeRequests", { token: user.token, status: "pending" })
    ]);

    const profile = profileRes.data || profileRes.profile || profileRes;
    const tournaments = normalizeArray(tournamentsRes);
    const history = normalizeArray(historyRes);
    const pendingRequests = normalizeArray(changeRes);
    const verified = String(pick(profile, ["verified", "Verified"], "false")).toLowerCase() === "true";

    profilePanel.innerHTML = `
      <div class="stack">
        <div class="profile-hero card">
          <div class="panel-heading">
            <div>
              <p class="panel-kicker">Profile</p>
              <h2>${escapeHtml(pick(profile, ["playerName", "PlayerName", "name"], getPlayerName()))}</h2>
            </div>
            ${verified ? renderVerifiedBadge() : '<span class="status-badge status-pending">Pending verification</span>'}
          </div>
          <div class="label-grid">
            <div class="label-row"><p>FFUID</p><strong>${escapeHtml(pick(profile, ["ffuid", "FFUID"], "N/A"))}</strong></div>
            <div class="label-row"><p>Team</p><strong>${escapeHtml(pick(profile, ["teamName", "TeamName"], "Solo"))}</strong></div>
            <div class="label-row"><p>Discord</p><strong>${escapeHtml(pick(profile, ["discordId", "DiscordID"], "N/A"))}</strong></div>
            <div class="label-row"><p>Email</p><strong>${escapeHtml(pick(profile, ["email", "Email"], "N/A"))}</strong></div>
          </div>
        </div>
        <div class="stats-grid">
          <div class="surface-card stat-card"><h3>Matches</h3><strong>${escapeHtml(String(pick(profile, ["matches", "Matches"], 0)))}</strong></div>
          <div class="surface-card stat-card"><h3>Kills</h3><strong>${escapeHtml(String(pick(profile, ["kills", "Kills"], 0)))}</strong></div>
          <div class="surface-card stat-card"><h3>Wins</h3><strong>${escapeHtml(String(pick(profile, ["wins", "Wins"], 0)))}</strong></div>
          <div class="surface-card stat-card"><h3>KD</h3><strong>${escapeHtml(String(pick(profile, ["kd", "KD"], 0)))}</strong></div>
        </div>
        <div class="notice-card">Profile is locked. Use Change Request tab to update your info.</div>
      </div>
    `;

    tournamentsPanel.innerHTML = tournaments.length ? `
      <div class="stack">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">Competition</p>
            <h2>My Tournaments</h2>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tournament Name</th><th>Date</th><th>Status</th><th>Access</th></tr></thead>
            <tbody>
              ${tournaments.map((item) => {
                const status = String(pick(item, ["status", "Status"], "upcoming")).toLowerCase();
                return `
                  <tr>
                    <td>${escapeHtml(pick(item, ["name", "Name"], "Tournament"))}</td>
                    <td>${escapeHtml(formatDate(pick(item, ["date", "Date"])))}</td>
                    <td><span class="status-badge ${statusClass(status)}">${escapeHtml(formatStatus(status))}</span></td>
                    <td>${status === "ongoing" ? `<a href="/tournament-detail?id=${encodeURIComponent(tournamentId(item))}">View Room</a>` : "-"}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : '<div class="empty-state"><p class="panel-kicker">Competition</p><h2>My Tournaments</h2><p>You haven\'t registered for any tournaments yet.</p></div>';

    historyPanel.innerHTML = history.length ? `
      <div class="stack">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">Performance</p>
            <h2>Match History</h2>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Tournament</th><th>Kills</th><th>Rank</th><th>Date</th></tr></thead>
            <tbody>
              ${history.map((match, index) => {
                const rank = Number(pick(match, ["rank", "Rank"], 0));
                return `
                  <tr class="${rank === 1 ? "rank-gold" : ""}">
                    <td>${index + 1}</td>
                    <td>${escapeHtml(pick(match, ["tournamentName", "TournamentName", "name"], "Tournament"))}</td>
                    <td>${escapeHtml(String(pick(match, ["kills", "Kills"], 0)))}</td>
                    <td>${rank === 1 ? "Winner" : escapeHtml(String(rank || "-"))}</td>
                    <td>${escapeHtml(formatDate(pick(match, ["date", "Date"])))}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    ` : '<div class="empty-state"><p class="panel-kicker">Performance</p><h2>Match History</h2><p>No matches played yet.</p></div>';

    const pending = pendingRequests[0];
    changePanel.innerHTML = pending ? `
      <div class="surface-card stack">
        <p class="panel-kicker">Support</p>
        <h3>Pending Request</h3>
        <p>Field: ${escapeHtml(pick(pending, ["field", "Field"], "-"))}</p>
        <p>New Value: ${escapeHtml(pick(pending, ["newValue", "NewValue"], "-"))}</p>
        <p>Status: pending</p>
      </div>
    ` : `
      <div class="stack">
        <div class="panel-heading">
          <div>
            <p class="panel-kicker">Support</p>
            <h2>Change Request</h2>
          </div>
        </div>
        <div class="notice-card">You can request a change to one profile field at a time. Admin reviews within 24 hours.</div>
        <form id="changeRequestForm" class="surface-card stack">
          <div class="field">
            <label for="field">Field</label>
            <select id="field" name="field">
              <option>Player Name</option>
              <option>Team Name</option>
              <option>Discord ID</option>
              <option>In-Game Name</option>
            </select>
          </div>
          <div class="field">
            <label for="newValue">New Value</label>
            <input id="newValue" name="newValue" required>
          </div>
          <div class="field">
            <label for="reason">Reason</label>
            <textarea id="reason" name="reason" required></textarea>
          </div>
          <button type="submit" class="btn-primary">Submit Request</button>
          <p id="changeRequestMessage"></p>
        </form>
      </div>
    `;

    const form = document.getElementById("changeRequestForm");
    if (form) {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const response = await submitChangeRequest(user.token, formData.get("field"), formData.get("newValue"), formData.get("reason"));
        const message = document.getElementById("changeRequestMessage");
        message.textContent = response.success ? "Request submitted!" : (response.message || "Unable to submit request.");
        message.style.color = response.success ? "var(--success)" : "#ff8c87";
        if (response.success) form.reset();
      });
    }
  } catch (error) {
    console.error(error);
    [profilePanel, tournamentsPanel, historyPanel, changePanel].forEach((panel) => {
      panel.innerHTML = '<div class="error-card"><p class="error-text">Could not load data. Check your connection.</p></div>';
    });
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
