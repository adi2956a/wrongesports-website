function adminPick(object, keys, fallback = "") {
  return pick(object, keys, fallback);
}

function openModal(id) {
  document.getElementById(id)?.classList.add("active");
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove("active");
}

async function handleAdminLogin() {
  const form = document.getElementById("adminLoginForm");
  if (!form) return false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");
    const hash = CryptoJS.SHA256(password).toString();
    const response = await apiPost("adminLogin", { email, hash, adminSecret: CONFIG.ADMIN_SECRET });
    const message = document.getElementById("adminLoginMessage");
    if (response.success) {
      localStorage.setItem("we_token", response.token || "");
      localStorage.setItem("we_admin_token", response.token || "");
      localStorage.setItem("we_role", "admin");
      localStorage.setItem("we_playerName", response.playerName || "Admin");
      window.location.href = "/admin/panel.html";
    } else {
      message.textContent = "Access denied";
    }
  });

  return true;
}

function playerRow(user) {
  const verified = String(adminPick(user, ["verified", "Verified"], "false")).toLowerCase() === "true";
  return `
    <tr data-user-id="${escapeHtml(adminPick(user, ["userId", "UserID", "id"], ""))}">
      <td>${escapeHtml(adminPick(user, ["playerName", "PlayerName", "name"], "Unknown"))}</td>
      <td>${escapeHtml(adminPick(user, ["ffuid", "FFUID"], "-"))}</td>
      <td>${escapeHtml(adminPick(user, ["teamName", "TeamName"], "Solo"))}</td>
      <td>${escapeHtml(adminPick(user, ["email", "Email"], "-"))}</td>
      <td>${verified ? '<span class="status-badge status-approved">Verified</span>' : '<span class="status-badge status-pending">Pending</span>'}</td>
      <td>${verified ? '<span class="status-badge status-approved">Verified</span>' : `<button class="btn-primary verify-btn" data-user-id="${escapeHtml(adminPick(user, ["userId", "UserID", "id"], ""))}">Verify</button>`}</td>
    </tr>
  `;
}

function tournamentRow(item) {
  const id = tournamentId(item);
  const currentStatus = String(adminPick(item, ["status", "Status"], "upcoming")).toLowerCase();
  return `
    <tr>
      <td>${escapeHtml(adminPick(item, ["name", "Name"], "Tournament"))}</td>
      <td>${escapeHtml(adminPick(item, ["game", "Game"], "Free Fire"))}</td>
      <td>${escapeHtml(formatDate(adminPick(item, ["date", "Date"])))}</td>
      <td>
        <select class="statusSelect" data-id="${escapeHtml(id)}">
          ${["upcoming", "ongoing", "past"].map((status) => `<option value="${status}" ${currentStatus === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
      <td>${escapeHtml(String(adminPick(item, ["totalSlots", "TotalSlots"], "0")))}</td>
      <td><button class="btn-secondary editTournamentBtn" data-id="${escapeHtml(id)}">Edit</button></td>
    </tr>
  `;
}

function requestRow(item) {
  const status = String(adminPick(item, ["status", "Status"], "pending")).toLowerCase();
  const reqId = adminPick(item, ["reqId", "id", "RequestID"], "");
  return `
    <tr>
      <td>${escapeHtml(adminPick(item, ["playerName", "PlayerName"], "Player"))}</td>
      <td>${escapeHtml(adminPick(item, ["field", "Field"], "-"))}</td>
      <td>${escapeHtml(adminPick(item, ["newValue", "NewValue"], "-"))}</td>
      <td>${escapeHtml(adminPick(item, ["reason", "Reason"], "-"))}</td>
      <td>${escapeHtml(formatDate(adminPick(item, ["date", "Date", "createdAt"], "")))}</td>
      <td><span class="status-badge ${statusClass(status)}">${escapeHtml(formatStatus(status))}</span></td>
      <td>${status === "pending" ? `<div class="inline-actions"><button class="btn-primary requestAction" data-id="${escapeHtml(reqId)}" data-decision="approved">Approve</button><button class="btn-secondary requestAction" data-id="${escapeHtml(reqId)}" data-decision="rejected">Reject</button></div>` : "-"}</td>
    </tr>
  `;
}

function announcementRow(item) {
  return `
    <tr>
      <td>${escapeHtml(adminPick(item, ["title", "Title"], "Announcement"))}</td>
      <td>${escapeHtml(formatDate(adminPick(item, ["date", "Date", "createdAt"], "")))}</td>
      <td>${escapeHtml(adminPick(item, ["telegramStatus", "TelegramStatus", "status"], "Sent"))}</td>
    </tr>
  `;
}

async function loadAdminPanel() {
  const handledLogin = await handleAdminLogin();
  if (handledLogin || !document.getElementById("adminPanel")) return;

  await requireAdmin();
  document.getElementById("adminGreeting").textContent = `${getPlayerName()} Dashboard`;
  document.getElementById("adminIdentityName").textContent = getPlayerName();
  bindScrollTabs(".admin-tab", ".admin-panel");

  document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
    clearAuth();
    localStorage.removeItem("we_admin_token");
    window.location.href = "/admin/index.html";
  });

  document.getElementById("adminStats").innerHTML = createFakeLoader("Loading dashboard stats", 3);
  document.getElementById("playersTableBody").innerHTML = `<tr><td colspan="6">${createFakeLoader("Loading players", 2)}</td></tr>`;
  document.getElementById("adminTournamentsTableBody").innerHTML = `<tr><td colspan="6">${createFakeLoader("Loading tournaments", 2)}</td></tr>`;
  document.getElementById("changeRequestsTableBody").innerHTML = `<tr><td colspan="7">${createFakeLoader("Loading requests", 2)}</td></tr>`;
  document.getElementById("announcementsTableBody").innerHTML = `<tr><td colspan="3">${createFakeLoader("Loading announcements", 2)}</td></tr>`;

  try {
    const [usersRes, tournamentsRes, requestsRes, announcementsRes] = await Promise.all([
      adminGetUsers(),
      getTournaments("all"),
      adminGetChangeRequests("all"),
      apiGet("getAnnouncements", { adminSecret: CONFIG.ADMIN_SECRET })
    ]);

    const users = normalizeArray(usersRes);
    const tournaments = normalizeArray(tournamentsRes);
    const requests = normalizeArray(requestsRes);
    const announcements = normalizeArray(announcementsRes);

    document.getElementById("adminStats").innerHTML = `
      <div class="stats-grid">
        <div class="surface-card stat-card"><h3>Total Players</h3><strong>${users.length}</strong></div>
        <div class="surface-card stat-card"><h3>Total Tournaments</h3><strong>${tournaments.length}</strong></div>
        <div class="surface-card stat-card"><h3>Pending Requests</h3><strong>${requests.filter((item) => String(adminPick(item, ["status", "Status"], "")).toLowerCase() === "pending").length}</strong></div>
        <div class="surface-card stat-card"><h3>Active Tournaments</h3><strong>${tournaments.filter((item) => ["upcoming", "ongoing"].includes(String(adminPick(item, ["status", "Status"], "")).toLowerCase())).length}</strong></div>
      </div>
    `;

    const playersBody = document.getElementById("playersTableBody");
    const resultsBody = document.getElementById("matchResultsTableBody");
    const submitResultsBtn = document.getElementById("submitMatchResultsBtn");
    const resultsMessage = document.getElementById("matchResultsMessage");
    const renderPlayers = (term = "") => {
      const filtered = users.filter((user) => adminPick(user, ["playerName", "PlayerName", "name"], "").toLowerCase().includes(term.toLowerCase()));
      playersBody.innerHTML = filtered.map(playerRow).join("");
      playersBody.querySelectorAll(".verify-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          event.stopPropagation();
          const response = await adminVerifyPlayer(button.dataset.userId);
          if (response.success) window.location.reload();
        });
      });
      playersBody.querySelectorAll("tr[data-user-id]").forEach((row) => {
        row.addEventListener("click", () => {
          const payload = users.find((entry) => String(adminPick(entry, ["userId", "UserID", "id"], "")) === row.dataset.userId);
          document.getElementById("adminPlayerModalBody").innerHTML = `
            <h3>${escapeHtml(adminPick(payload, ["playerName", "PlayerName", "name"], "Unknown"))}</h3>
            <div class="stack" style="margin-top:1rem;">
              <div class="surface-card">FFUID: ${escapeHtml(adminPick(payload, ["ffuid", "FFUID"], "-"))}</div>
              <div class="surface-card">Team: ${escapeHtml(adminPick(payload, ["teamName", "TeamName"], "-"))}</div>
              <div class="surface-card">Email: ${escapeHtml(adminPick(payload, ["email", "Email"], "-"))}</div>
              <div class="surface-card">Discord: ${escapeHtml(adminPick(payload, ["discordId", "DiscordID"], "-"))}</div>
            </div>
          `;
          openModal("adminPlayerModal");
        });
      });
    };
    renderPlayers();
    document.getElementById("playerSearch")?.addEventListener("input", (event) => renderPlayers(event.target.value));

    const tournamentsBody = document.getElementById("adminTournamentsTableBody");
    tournamentsBody.innerHTML = tournaments.map(tournamentRow).join("");
    document.querySelectorAll(".statusSelect").forEach((select) => {
      select.addEventListener("change", async () => {
        await adminUpdateTournament(select.dataset.id, { status: select.value });
      });
    });

    const roomOptions = tournaments
      .filter((item) => String(adminPick(item, ["status", "Status"], "")).toLowerCase() === "ongoing")
      .map((item) => `<option value="${escapeHtml(tournamentId(item))}">${escapeHtml(adminPick(item, ["name", "Name"], "Tournament"))}</option>`)
      .join("");
    const allOptions = tournaments
      .map((item) => `<option value="${escapeHtml(tournamentId(item))}">${escapeHtml(adminPick(item, ["name", "Name"], "Tournament"))}</option>`)
      .join("");
    document.getElementById("roomTournamentSelect").innerHTML = `<option value="">Select tournament</option>${roomOptions}`;
    document.getElementById("resultsTournamentSelect").innerHTML = `<option value="">Select tournament</option>${allOptions}`;

    document.getElementById("openAddTournament")?.addEventListener("click", () => {
      const form = document.getElementById("tournamentForm");
      form.reset();
      form.dataset.mode = "add";
      form.dataset.id = "";
      document.getElementById("tournamentMessage").textContent = "";
      openModal("tournamentModal");
    });
    document.getElementById("closeTournamentModal")?.addEventListener("click", () => closeModal("tournamentModal"));
    document.querySelectorAll(".editTournamentBtn").forEach((button) => {
      button.addEventListener("click", () => {
        const item = tournaments.find((entry) => tournamentId(entry) === button.dataset.id);
        const form = document.getElementById("tournamentForm");
        form.dataset.mode = "edit";
        form.dataset.id = button.dataset.id;
        ["name", "game", "date", "time", "prizePool", "totalSlots", "rules", "mapName", "bannerUrl"].forEach((field) => {
          const fallbackKey = field === "bannerUrl" ? "BannerURL" : field.charAt(0).toUpperCase() + field.slice(1);
          form.elements[field].value = adminPick(item, [field, fallbackKey], "");
        });
        openModal("tournamentModal");
      });
    });

    document.getElementById("tournamentForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = form.dataset.mode === "edit" ? await adminUpdateTournament(form.dataset.id, payload) : await adminAddTournament(payload);
      document.getElementById("tournamentMessage").textContent = response.success ? "Tournament added & Telegram notified!" : (response.message || "Unable to save tournament.");
      if (response.success) window.location.reload();
    });

    document.getElementById("roomDetailsForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const response = await adminAddRoomDetails(formData.get("tournamentId"), formData.get("roomId"), formData.get("roomPass"));
      document.getElementById("roomDetailsMessage").textContent = response.success ? "Room details saved & Telegram notified!" : (response.message || "Unable to save room details.");
    });

    document.getElementById("resultsTournamentSelect")?.addEventListener("change", async (event) => {
      const targetId = event.target.value;
      const body = document.getElementById("matchResultsTableBody");
      if (submitResultsBtn) submitResultsBtn.disabled = true;
      if (resultsMessage) resultsMessage.textContent = "";
      if (!targetId) {
        body.innerHTML = "";
        return;
      }
      const detailRes = await getTournamentDetail(targetId, localStorage.getItem("we_token") || "");
      const players = normalizeArray(detailRes.players || detailRes.registeredPlayers || detailRes.registrations);
      if (!players.length) {
        body.innerHTML = '<tr><td colspan="3">No registered players were returned for this tournament.</td></tr>';
        if (resultsMessage) {
          resultsMessage.textContent = "Select a tournament that has registered players, or update the backend to return registrations in tournament detail.";
          resultsMessage.style.color = "#ff8c87";
        }
        return;
      }
      body.innerHTML = players.map((player, index) => `
        <tr data-user-id="${escapeHtml(adminPick(player, ["userId", "UserID", "playerId", "id"], ""))}">
          <td>${escapeHtml(adminPick(player, ["playerName", "PlayerName", "name"], `Player ${index + 1}`))}</td>
          <td><input type="number" min="0" name="kills_${index}"></td>
          <td><input type="number" min="1" name="rank_${index}"></td>
        </tr>
      `).join("");
      if (submitResultsBtn) submitResultsBtn.disabled = false;
    });

    document.getElementById("matchResultsForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const tournamentIdValue = document.getElementById("resultsTournamentSelect").value;
      const rows = Array.from(document.querySelectorAll("#matchResultsTableBody tr"));
      if (!tournamentIdValue || !rows.length || rows[0].children.length < 3) {
        document.getElementById("matchResultsMessage").textContent = "Load a tournament with registered players first.";
        return;
      }
      const results = rows.map((row) => {
        const cells = row.querySelectorAll("td");
        return {
          userId: row.dataset.userId || "",
          playerName: cells[0].textContent,
          kills: cells[1].querySelector("input").value,
          rank: cells[2].querySelector("input").value
        };
      });
      if (results.some((row) => row.kills === "" || row.rank === "")) {
        document.getElementById("matchResultsMessage").textContent = "Please fill kills and rank for every row.";
        return;
      }
      const response = await adminAddMatchResult(tournamentIdValue, results);
      document.getElementById("matchResultsMessage").textContent = response.success ? "Results saved & winner announced on Telegram!" : (response.message || "Unable to save results.");
    });

    const renderRequests = (filter = "all") => {
      const filtered = filter === "all" ? requests : requests.filter((item) => String(adminPick(item, ["status", "Status"], "")).toLowerCase() === filter);
      document.getElementById("changeRequestsTableBody").innerHTML = filtered.map(requestRow).join("");
      document.querySelectorAll(".requestAction").forEach((button) => {
        button.addEventListener("click", async () => {
          await adminResolveChangeRequest(button.dataset.id, button.dataset.decision);
          window.location.reload();
        });
      });
    };
    renderRequests();
    document.querySelectorAll(".request-filter").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".request-filter").forEach((entry) => entry.classList.remove("active"));
        button.classList.add("active");
        renderRequests(button.dataset.filter);
      });
    });

    document.getElementById("announcementForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const response = await adminPostAnnouncement(formData.get("title"), formData.get("body"));
      document.getElementById("announcementMessage").textContent = response.success ? "Posted & sent to Telegram!" : (response.message || "Unable to post announcement.");
    });
    document.getElementById("announcementsTableBody").innerHTML = announcements.map(announcementRow).join("");

    document.getElementById("closeAdminPlayerModal")?.addEventListener("click", () => closeModal("adminPlayerModal"));
    document.getElementById("adminPlayerModal")?.addEventListener("click", (event) => { if (event.target.id === "adminPlayerModal") closeModal("adminPlayerModal"); });
    document.getElementById("tournamentModal")?.addEventListener("click", (event) => { if (event.target.id === "tournamentModal") closeModal("tournamentModal"); });
  } catch (error) {
    console.error(error);
    document.getElementById("adminStats").innerHTML = '<div class="error-card"><p class="error-text">Could not load data. Check your connection.</p></div>';
  }
}

document.addEventListener("DOMContentLoaded", loadAdminPanel);
