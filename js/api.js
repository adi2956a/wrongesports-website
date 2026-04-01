// =============================================
// CORE - All requests go as GET to avoid CORS
// =============================================

async function apiGet(action, params = {}) {
  try {
    params.action = action;
    const url = CONFIG.API_URL + "?" + new URLSearchParams(params).toString();
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const text = await res.text();
    return JSON.parse(text);
  } catch (err) {
    console.error("apiGet error:", err);
    return { success: false, error: err.message };
  }
}

// FORCE apiPost to actually use GET under the hood
async function apiPost(action, body = {}) {
  try {
    body.action = action;
    const url = CONFIG.API_URL + "?" + new URLSearchParams(body).toString();
    
    // Notice this says GET! This is the magic trick to bypass CORS
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const text = await res.text();
    return JSON.parse(text);
  } catch (err) {
    console.error("apiPost error:", err);
    return { success: false, error: err.message };
  }
}

// =============================================
// NAMED FUNCTIONS
// =============================================

function getTournaments(status) {
  return apiGet("getTournaments", { status: status || "all" });
}

function getTournamentDetail(id, token) {
  return apiGet("getTournamentDetail", { tournamentId: id, token: token || "" });
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

function getRegisteredTournaments(token) {
  return apiGet("getRegisteredTournaments", { token });
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
  return apiPost("updateTournament", {
    adminSecret: CONFIG.ADMIN_SECRET, tournamentId: id, ...data
  });
}

function adminAddRoomDetails(id, roomId, roomPass) {
  return apiPost("addRoomDetails", {
    adminSecret: CONFIG.ADMIN_SECRET, tournamentId: id, roomId, roomPass
  });
}

function adminAddMatchResult(tournamentId, results) {
  // results array needs special handling - encode as JSON string
  return apiGet("addMatchResult", {
    adminSecret: CONFIG.ADMIN_SECRET,
    tournamentId,
    results: JSON.stringify(results)
  });
}

function adminGetChangeRequests(status) {
  return apiGet("getChangeRequests", {
    adminSecret: CONFIG.ADMIN_SECRET, status: status || "all"
  });
}

function adminResolveChangeRequest(reqId, decision) {
  return apiPost("resolveChangeRequest", {
    adminSecret: CONFIG.ADMIN_SECRET, requestId: reqId, status: decision
  });
}

function adminPostAnnouncement(title, message) {
  return apiPost("postAnnouncement", {
    adminSecret: CONFIG.ADMIN_SECRET, title, message
  });
}

// Step 2 still calls this helper from admin/, so keep it as a GET alias.
function apiGetPost(action, params = {}) {
  return apiGet(action, params);
}
