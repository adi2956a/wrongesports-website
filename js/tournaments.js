function pickTournament(item, keys, fallback = "") {
  return pick(item, keys, fallback);
}

function renderTournamentCard(item) {
  const id = tournamentId(item);
  const banner = pickTournament(item, ["bannerUrl", "BannerURL", "banner"]);
  const status = String(pickTournament(item, ["status", "Status"], "upcoming")).toLowerCase();
  const totalSlots = pickTournament(item, ["totalSlots", "TotalSlots", "slots"], 0);
  const registered = pickTournament(item, ["registeredCount", "RegisteredCount", "filledSlots"], 0);
  return `
    <article class="card tournament-card clickable-card" data-id="${escapeHtml(id)}">
      <div class="card-banner ${banner ? "" : "banner-fallback"}" ${banner ? `style="background-image:url('${escapeHtml(banner)}')"` : ""}></div>
      <div class="card-body">
        <h3>${escapeHtml(pickTournament(item, ["name", "Name"], "Untitled Tournament"))}</h3>
        <div class="inline-actions" style="justify-content:space-between; align-items:center;">
          <span class="game-badge">${escapeHtml(pickTournament(item, ["game", "Game"], "Free Fire"))}</span>
          <span class="status-badge ${statusClass(status)}">${escapeHtml(formatStatus(status))}</span>
        </div>
        <p>${escapeHtml(formatDate(pickTournament(item, ["date", "Date"]))) } · ${escapeHtml(formatTime(pickTournament(item, ["time", "Time"])))}</p>
        <p>${escapeHtml(formatCurrency(pickTournament(item, ["prizePool", "PrizePool"], 0)))}</p>
      </div>
      <div class="card-footer">
        <span>${escapeHtml(String(registered))}/${escapeHtml(String(totalSlots))} Slots</span>
        <a class="btn-primary" href="/tournament-detail.html?id=${encodeURIComponent(id)}">View Details</a>
      </div>
    </article>
  `;
}

async function loadTournaments(status = "upcoming") {
  const grid = document.getElementById("tournamentsGrid");
  if (!grid) return;

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.status === status);
  });

  setLoading(grid, createSkeletonCards(6, `
    <article class="card tournament-card">
      <div class="card-banner skeleton"></div>
      <div class="card-body">
        <div class="skeleton" style="height: 28px;"></div>
        <div class="skeleton" style="height: 20px;"></div>
        <div class="skeleton" style="height: 18px;"></div>
      </div>
    </article>
  `));

  try {
    const data = normalizeArray(await getTournaments(status));
    if (!data.length) {
      grid.innerHTML = '<div class="empty-state">No tournaments found in this section.</div>';
      return;
    }
    grid.innerHTML = data.map(renderTournamentCard).join("");
    grid.querySelectorAll(".clickable-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("a")) return;
        window.location.href = `/tournament-detail.html?id=${encodeURIComponent(card.dataset.id)}`;
      });
    });
  } catch (error) {
    console.error(error);
    renderError(grid, () => loadTournaments(status));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => loadTournaments(button.dataset.status));
  });
  loadTournaments("upcoming");
});
