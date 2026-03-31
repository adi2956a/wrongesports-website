async function apiGet(action, params = {}) {
  params.action = action;
  const url = `${CONFIG.API_URL}?${new URLSearchParams(params).toString()}`;
  return (await fetch(url)).json();
}

async function apiPost(action, body = {}) {
  body.action = action;
  return (await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })).json();
}

function getTournaments(status) {
  return apiGet("getTournaments", { status });
}

function getTournamentDetail(id, token) {
  return apiGet("getTournamentDetail", { tournamentId: id, token });
}

function registerTournament(token, tournamentId) {
  return apiPost("registerTournament", { token, tournamentId });
}

function getLeaderboard() {
  return apiGet("getLeaderboard");
}

function getProfile(userId) {
  return apiGet("getProfile", { userId });
}

function getMatchHistory(userId) {
  return apiGet("getMatchHistory", { userId });
}

function submitChangeRequest(token, field, newValue, reason) {
  return apiPost("submitChangeRequest", { token, field, newValue, reason });
}

function adminGetUsers() {
  return apiGet("adminGetUsers", { adminSecret: CONFIG.ADMIN_SECRET });
}

function adminVerifyPlayer(userId) {
  return apiPost("adminVerifyPlayer", { adminSecret: CONFIG.ADMIN_SECRET, userId });
}

function adminAddTournament(data) {
  return apiPost("addTournament", { adminSecret: CONFIG.ADMIN_SECRET, ...data });
}

function adminUpdateTournament(id, data) {
  return apiPost("updateTournament", { adminSecret: CONFIG.ADMIN_SECRET, tournamentId: id, ...data });
}

function adminAddRoomDetails(id, roomId, roomPass) {
  return apiPost("addRoomDetails", { adminSecret: CONFIG.ADMIN_SECRET, tournamentId: id, roomId, roomPass });
}

function adminAddMatchResult(tournamentId, results) {
  return apiPost("addMatchResult", { adminSecret: CONFIG.ADMIN_SECRET, tournamentId, results });
}

function adminGetChangeRequests(status) {
  return apiGet("getChangeRequests", { adminSecret: CONFIG.ADMIN_SECRET, status });
}

function adminResolveChangeRequest(reqId, decision) {
  return apiPost("resolveChangeRequest", { adminSecret: CONFIG.ADMIN_SECRET, reqId, decision });
}

function adminPostAnnouncement(title, body) {
  return apiPost("postAnnouncement", { adminSecret: CONFIG.ADMIN_SECRET, title, body });
}

function getRegisteredTournaments(token) {
  return apiGet("getRegisteredTournaments", { token });
}

// Special function for actions that need to bypass CORS
// Sends data as GET params instead of POST body
function apiGetPost(action, params = {}) {
  params.action = action;
  const url = CONFIG.API_URL + "?" + new URLSearchParams(params).toString();
  return fetch(url, {
    method: "GET",
    redirect: "follow"
  })
    .then((r) => r.text())
    .then((t) => JSON.parse(t))
    .catch((err) => ({ success: false, error: err.message }));
}
