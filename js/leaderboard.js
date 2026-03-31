let leaderboardData = [];
let filteredData = [];
let currentPage = 1;
const pageSize = 20;

function rankLabel(rank) {
  if (rank === 1) return "??";
  if (rank === 2) return "??";
  if (rank === 3) return "??";
  return `#${rank}`;
}

function renderPodium() {
  const container = document.getElementById("podium");
  if (!container) return;
  const top = filteredData.slice(0, 3);
  const order = [top[1], top[0], top[2]];
  const classes = ["podium-second", "podium-first", "podium-third"];
  const medals = ["??", "??", "??"];
  container.innerHTML = order.map((player, index) => player ? `
    <article class="card podium-card ${classes[index]}">
      <div style="font-size:2rem;">${medals[index]}</div>
      <h3>${escapeHtml(pick(player, ["playerName", "PlayerName", "name"], "Unknown"))}</h3>
      <p>KD ${escapeHtml(String(pick(player, ["kd", "KD"], "0")))}</p>
    </article>
  ` : "").join("");
}

function renderLeaderboardTable() {
  const container = document.getElementById("leaderboardTable");
  if (!container) return;
  const totalPages = Math.max(Math.ceil(filteredData.length / pageSize), 1);
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * pageSize;
  const rows = filteredData.slice(start, start + pageSize).map((player, index) => {
    const rank = start + index + 1;
    const userId = pick(player, ["userId", "UserID", "id"]);
    const rowClass = rank === 1 ? "rank-gold" : rank === 2 ? "rank-silver" : rank === 3 ? "rank-bronze" : "";
    return `
      <tr class="${rowClass}" data-user-id="${escapeHtml(userId)}">
        <td>${rankLabel(rank)}</td>
        <td>${escapeHtml(pick(player, ["playerName", "PlayerName", "name"], "Unknown"))}</td>
        <td>${escapeHtml(String(pick(player, ["kd", "KD"], "0")))}</td>
        <td>${escapeHtml(String(pick(player, ["wins", "Wins"], "0")))}</td>
        <td>${escapeHtml(String(pick(player, ["kills", "Kills"], "0")))}</td>
        <td>${escapeHtml(String(pick(player, ["matches", "Matches"], "0")))}</td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="table-wrap">
      <table class="table-clickable">
        <thead><tr><th>Rank</th><th>Player Name</th><th>KD</th><th>Wins</th><th>Kills</th><th>Matches</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">No players found.</td></tr>'}</tbody>
      </table>
    </div>
    <div class="pagination">
      <button class="btn-secondary" id="prevPage" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
      <span>Page ${currentPage} of ${totalPages}</span>
      <button class="btn-secondary" id="nextPage" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    </div>
  `;

  container.querySelectorAll("tbody tr[data-user-id]").forEach((row) => {
    row.addEventListener("click", () => {
      window.location.href = `/profile.html?userId=${encodeURIComponent(row.dataset.userId)}`;
    });
  });

  const prev = document.getElementById("prevPage");
  const next = document.getElementById("nextPage");
  if (prev) prev.addEventListener("click", () => { currentPage -= 1; renderLeaderboardTable(); });
  if (next) next.addEventListener("click", () => { currentPage += 1; renderLeaderboardTable(); });
}

function applySearch(term) {
  filteredData = leaderboardData.filter((player) => pick(player, ["playerName", "PlayerName", "name"], "").toLowerCase().includes(term.toLowerCase()));
  currentPage = 1;
  renderPodium();
  renderLeaderboardTable();
}

async function loadLeaderboardPage() {
  const table = document.getElementById("leaderboardTable");
  if (!table) return;
  setLoading(table, '<div class="loading-card"><div class="skeleton" style="height: 300px;"></div></div>');

  try {
    leaderboardData = normalizeArray(await getLeaderboard());
    filteredData = [...leaderboardData];
    renderPodium();
    renderLeaderboardTable();
  } catch (error) {
    console.error(error);
    renderError(table, loadLeaderboardPage);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("leaderboardSearch");
  if (search) search.addEventListener("input", () => applySearch(search.value));
  loadLeaderboardPage();
});
