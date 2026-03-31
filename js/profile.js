async function loadPublicProfile() {
  const container = document.getElementById("publicProfile");
  if (!container) return;
  const userId = new URLSearchParams(window.location.search).get("userId");
  if (!userId) {
    container.innerHTML = '<div class="error-card"><p class="error-text">Player not found</p></div>';
    return;
  }

  setLoading(container, '<div class="loading-card"><div class="skeleton" style="height:280px;"></div></div>');

  try {
    const [profileRes, historyRes] = await Promise.all([getProfile(userId), getMatchHistory(userId)]);
    const profile = profileRes.data || profileRes.profile || profileRes;
    const history = normalizeArray(historyRes).slice(0, 10);
    if (!profile || profileRes.success === false) {
      container.innerHTML = '<div class="error-card"><p class="error-text">Player not found</p></div>';
      return;
    }

    const verified = String(pick(profile, ["verified", "Verified"], "false")).toLowerCase() === "true";
    container.innerHTML = `
      <div class="stack">
        <section class="profile-hero card">
          <h1>${escapeHtml(pick(profile, ["playerName", "PlayerName", "name"], "Player"))} ${verified ? "?" : ""}</h1>
          <div class="label-grid">
            <div class="label-row"><p>FFUID</p><strong>${escapeHtml(pick(profile, ["ffuid", "FFUID"], "N/A"))}</strong></div>
            <div class="label-row"><p>Team</p><strong>${escapeHtml(pick(profile, ["teamName", "TeamName"], "Solo"))}</strong></div>
            <div class="label-row"><p>Discord</p><strong>${escapeHtml(pick(profile, ["discordId", "DiscordID"], "N/A"))}</strong></div>
          </div>
        </section>
        <section class="stats-grid">
          <div class="surface-card stat-card"><h3>Matches</h3><strong>${escapeHtml(String(pick(profile, ["matches", "Matches"], 0)))}</strong></div>
          <div class="surface-card stat-card"><h3>Kills</h3><strong>${escapeHtml(String(pick(profile, ["kills", "Kills"], 0)))}</strong></div>
          <div class="surface-card stat-card"><h3>Wins</h3><strong>${escapeHtml(String(pick(profile, ["wins", "Wins"], 0)))}</strong></div>
          <div class="surface-card stat-card"><h3>KD</h3><strong>${escapeHtml(String(pick(profile, ["kd", "KD"], 0)))}</strong></div>
        </section>
        <section class="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Tournament</th><th>Kills</th><th>Rank</th><th>Date</th></tr></thead>
            <tbody>
              ${history.length ? history.map((match, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(pick(match, ["tournamentName", "TournamentName", "name"], "Tournament"))}</td>
                  <td>${escapeHtml(String(pick(match, ["kills", "Kills"], 0)))}</td>
                  <td>${escapeHtml(String(pick(match, ["rank", "Rank"], "-")))}</td>
                  <td>${escapeHtml(formatDate(pick(match, ["date", "Date"])))}</td>
                </tr>
              `).join("") : '<tr><td colspan="5">No recent matches.</td></tr>'}
            </tbody>
          </table>
        </section>
      </div>
    `;
  } catch (error) {
    console.error(error);
    renderError(container, loadPublicProfile);
  }
}

document.addEventListener("DOMContentLoaded", loadPublicProfile);
