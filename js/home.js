function pick(object, keys, fallback = "") {
  if (!object) return fallback;
  for (const key of keys) {
    const value = object[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
}

function tournamentId(item) {
  return pick(item, ["id", "ID", "tournamentId", "TournamentID"]);
}

function renderTournamentStripCard(item) {
  const id = tournamentId(item);
  const banner = pick(item, ["bannerUrl", "BannerURL", "banner", "image"]);
  const status = String(pick(item, ["status", "Status"], "upcoming")).toLowerCase();
  return `
    <article class="card tournament-strip-card">
      <div class="tournament-banner ${banner ? "" : "banner-fallback"}" ${banner ? `style="background-image:url('${escapeHtml(banner)}')"` : ""}></div>
      <div class="tournament-card-body">
        <div class="inline-actions" style="justify-content:space-between; align-items:center;">
          <span class="game-badge">${escapeHtml(pick(item, ["game", "Game"], "Free Fire"))}</span>
          <span class="status-badge ${statusClass(status)}">${escapeHtml(formatStatus(status))}</span>
        </div>
        <div>
          <h3>${escapeHtml(pick(item, ["name", "Name", "tournamentName"], "Untitled Tournament"))}</h3>
          <p style="margin-top:0.5rem;">${escapeHtml(formatDate(pick(item, ["date", "Date"])))}</p>
        </div>
        <div class="inline-actions" style="justify-content:space-between; align-items:center;">
          <strong>${escapeHtml(formatCurrency(pick(item, ["prizePool", "PrizePool", "prize"], 0)))}</strong>
          <a class="btn-primary" href="/tournament-detail.html?id=${encodeURIComponent(id)}">Register</a>
        </div>
      </div>
    </article>
  `;
}

function renderLeaderboardRows(players) {
  return players.map((player, index) => {
    const rank = index + 1;
    const rankClass = rank === 1 ? "rank-gold" : rank === 2 ? "rank-silver" : rank === 3 ? "rank-bronze" : "";
    return `
      <tr class="${rankClass}">
        <td>#${rank}</td>
        <td>${escapeHtml(pick(player, ["playerName", "PlayerName", "name"], "Unknown"))}</td>
        <td>${escapeHtml(String(pick(player, ["kd", "KD"], "0")))}</td>
        <td>${escapeHtml(String(pick(player, ["wins", "Wins"], "0")))}</td>
        <td>${escapeHtml(String(pick(player, ["matches", "Matches"], "0")))}</td>
      </tr>
    `;
  }).join("");
}

async function loadActiveTournaments() {
  const container = document.getElementById("homeTournaments");
  if (!container) return;

  setLoading(container, createSkeletonCards(3, `
    <div class="card tournament-strip-card">
      <div class="tournament-banner skeleton"></div>
      <div class="tournament-card-body">
        <div class="skeleton" style="height:18px;"></div>
        <div class="skeleton" style="height:28px;"></div>
        <div class="skeleton" style="height:18px;"></div>
      </div>
    </div>
  `));

  try {
    const data = normalizeArray(await getTournaments("all"));
    const filtered = data.filter((item) => ["upcoming", "ongoing"].includes(String(pick(item, ["status", "Status"], "")).toLowerCase()));
    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">No active tournaments. Stay tuned!</div>';
      return;
    }
    container.innerHTML = filtered.map(renderTournamentStripCard).join("");
  } catch (error) {
    console.error(error);
    renderError(container, loadActiveTournaments);
  }
}

async function loadTopPlayers() {
  const container = document.getElementById("topPlayersTable");
  if (!container) return;

  setLoading(container, `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Rank</th><th>Player</th><th>KD</th><th>Wins</th><th>Matches</th></tr></thead>
        <tbody>
          ${createSkeletonCards(5, '<tr><td colspan="5"><div class="skeleton" style="height:18px;"></div></td></tr>')}
        </tbody>
      </table>
    </div>
  `);

  try {
    const data = normalizeArray(await getLeaderboard()).slice(0, 5);
    container.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>Rank</th><th>Player</th><th>KD</th><th>Wins</th><th>Matches</th></tr></thead>
          <tbody>${renderLeaderboardRows(data)}</tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error(error);
    renderError(container, loadTopPlayers);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadActiveTournaments();
  loadTopPlayers();

  const discordBtn = document.getElementById("discordBtn");
  const telegramBtn = document.getElementById("telegramBtn");
  const instagramBtn = document.getElementById("instagramBtn");
  const youtubeBtn = document.getElementById("youtubeBtn");
  if (discordBtn) discordBtn.addEventListener("click", () => openExternalLink(CONFIG.DISCORD_INVITE));
  if (telegramBtn) telegramBtn.addEventListener("click", () => openExternalLink(CONFIG.TELEGRAM_GROUP));
  if (instagramBtn) instagramBtn.addEventListener("click", () => openExternalLink(CONFIG.INSTAGRAM_URL));
  if (youtubeBtn) youtubeBtn.addEventListener("click", () => openExternalLink(CONFIG.YOUTUBE_URL));
});
