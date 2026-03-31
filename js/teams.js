let teamsSource = [];

function buildTeams(players) {
  const teams = new Map();
  players.forEach((player) => {
    const teamName = pick(player, ["teamName", "TeamName"], "Solo");
    if (!teams.has(teamName)) teams.set(teamName, []);
    teams.get(teamName).push(player);
  });

  return Array.from(teams.entries()).map(([teamName, members]) => ({
    teamName,
    captain: pick(members[0], ["playerName", "PlayerName", "name"], "Unknown"),
    memberCount: members.length,
    totalPoints: members.reduce((sum, member) => sum + Number(pick(member, ["wins", "Wins", "points", "Points"], 0)), 0),
    members
  }));
}

function renderTeamCards(term = "") {
  const grid = document.getElementById("teamsGrid");
  const modal = document.getElementById("teamModal");
  const modalBody = document.getElementById("teamModalBody");
  const teams = buildTeams(teamsSource).filter((team) => team.teamName.toLowerCase().includes(term.toLowerCase()));

  grid.innerHTML = teams.length ? teams.map((team, index) => `
    <article class="surface-card clickable-card" data-team-index="${index}">
      <h3>${escapeHtml(team.teamName)}</h3>
      <div class="team-meta">
        <p>Captain: ${escapeHtml(team.captain)}</p>
        <p>Members: ${team.memberCount}</p>
        <p>Total Points: ${team.totalPoints}</p>
      </div>
    </article>
  `).join("") : '<div class="empty-state">No teams found.</div>';

  grid.querySelectorAll("[data-team-index]").forEach((card) => {
    card.addEventListener("click", () => {
      const team = teams[Number(card.dataset.teamIndex)];
      modalBody.innerHTML = `
        <h3>${escapeHtml(team.teamName)}</h3>
        <p style="margin-top:0.5rem;">Members</p>
        <div class="stack" style="margin-top:1rem;">
          ${team.members.map((member) => `<div class="surface-card">${escapeHtml(pick(member, ["playerName", "PlayerName", "name"], "Unknown"))}</div>`).join("")}
        </div>
      `;
      modal.classList.add("active");
    });
  });
}

async function loadTeams() {
  const grid = document.getElementById("teamsGrid");
  if (!grid) return;
  setLoading(grid, createSkeletonCards(6, '<div class="surface-card"><div class="skeleton" style="height:120px;"></div></div>'));

  try {
    teamsSource = normalizeArray(await getLeaderboard());
    renderTeamCards();
  } catch (error) {
    console.error(error);
    renderError(grid, loadTeams);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("teamSearch");
  const modal = document.getElementById("teamModal");
  const close = document.getElementById("closeTeamModal");
  if (search) search.addEventListener("input", () => renderTeamCards(search.value));
  if (close) close.addEventListener("click", () => modal.classList.remove("active"));
  if (modal) modal.addEventListener("click", (event) => { if (event.target === modal) modal.classList.remove("active"); });
  loadTeams();
});
