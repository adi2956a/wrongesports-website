/*
TELEGRAM BOT SETUP:
1. Open Telegram → search @BotFather → send /newbot
2. Name: WrongEsports Bot | Username: wrongesports_bot
3. Copy token → paste as TELEGRAM_BOT_TOKEN below
4. Create Telegram Group → add bot as Administrator
5. For public group: TELEGRAM_CHANNEL_ID = "@yourgroupusername"
   For private group: add @userinfobot → send any message → copy the chat ID
6. Set ADMIN_SECRET to any strong string example: "wre_admin_2024_xK9p"
   Same string must be in your frontend config.js
7. Deploy: Deploy → New Deployment → Web App
   Execute as: Me | Who has access: Anyone
   Copy Web App URL → paste in frontend config.js as API_URL
*/

const SHEET_ID = "1Kinu3bKDSibfklPMooRnsM2NeMu6ASBEWpGYTtXmm9M";
const TELEGRAM_BOT_TOKEN = "8671225961:AAGW2N498Bh1mlmuTr_WX1Nyc8uTndSnkYs";
const TELEGRAM_CHANNEL_ID = "1003350957601";
const ADMIN_SECRET = "I_AM_WRONG_ADMIN";

// =======================================================
// HELPER FUNCTIONS
// =======================================================

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

function generateID(prefix) {
  return prefix + new Date().getTime().toString();
}

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function hashMatches(stored, incoming) {
  return stored === incoming;
}

function sendTelegramMessage(message) {
  try {
    const url = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage";
    const payload = {
      chat_id: TELEGRAM_CHANNEL_ID,
      text: message,
      parse_mode: "HTML"
    };
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    if (result.ok) {
      return result.result.message_id;
    } else {
      Logger.log("Telegram API Error: " + JSON.stringify(result));
      return null;
    }
  } catch (error) {
    Logger.log("Error sending Telegram message: " + error.message);
    return null;
  }
}

function validateSessionToken(token) {
  if (!token) return { valid: false };
  
  const sessionSheet = getSheet("Sessions");
  const sessionData = sessionSheet.getDataRange().getValues();

  for (let i = 1; i < sessionData.length; i++) {
    const row = sessionData[i];
    if (row[0] === token) {
      const expiresAt = new Date(row[3]);
      if (expiresAt > new Date()) {
        const userId = row[1];
        const usersSheet = getSheet("Users");
        const usersData = usersSheet.getDataRange().getValues();
        let playerName = "";
        let role = "";
        for (let j = 1; j < usersData.length; j++) {
          if (usersData[j][0] === userId) {
            playerName = usersData[j][3];
            role = usersData[j][8];
            break;
          }
        }
        return { valid: true, userId: userId, playerName: playerName, role: role };
      } else {
        return { valid: false };
      }
    }
  }
  return { valid: false };
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function checkAdmin(adminSecret) {
  return adminSecret === ADMIN_SECRET;
}

// =======================================================
// MAIN ROUTING — FIXED FOR CORS (ALL ACTIONS ON GET)
// =======================================================

function doGet(e) {
  try {
    const action = e.parameter.action;
    switch (action) {
      // AUTH
      case "login":                    return handleLogin(e.parameter);
      case "adminLogin":               return handleAdminLogin(e.parameter);
      case "validateSession":          return handleValidateSession(e.parameter);
      case "logout":                   return handleLogout(e.parameter);
      case "register":                 return handleRegister(e.parameter);

      // TOURNAMENTS
      case "getTournaments":           return handleGetTournaments(e.parameter);
      case "getTournamentDetail":      return handleGetTournamentDetail(e.parameter);
      case "registerTournament":       return handleRegisterTournament(e.parameter);
      case "getRegisteredTournaments": return handleGetRegisteredTournaments(e.parameter);

      // STATS
      case "getLeaderboard":           return handleGetLeaderboard(e.parameter);
      case "getProfile":               return handleGetProfile(e.parameter);
      case "getMatchHistory":          return handleGetMatchHistory(e.parameter);
      case "submitChangeRequest":      return handleSubmitChangeRequest(e.parameter);

      // ADMIN
      case "adminGetUsers":            return handleAdminGetUsers(e.parameter);
      case "adminVerifyPlayer":        return handleAdminVerifyPlayer(e.parameter);
      case "addTournament":            return handleAdminAddTournament(e.parameter);
      case "updateTournament":         return handleAdminUpdateTournament(e.parameter);
      case "addRoomDetails":           return handleAdminAddRoomDetails(e.parameter);
      case "addMatchResult":           return handleAdminAddMatchResultGET(e.parameter);
      case "getChangeRequests":        return handleAdminGetChangeRequests(e.parameter);
      case "resolveChangeRequest":     return handleAdminResolveChangeRequest(e.parameter);
      case "postAnnouncement":         return handleAdminPostAnnouncement(e.parameter);

      default:
        return respond({ success: false, error: "Unknown GET action: " + action });
    }
  } catch (err) {
    Logger.log("doGet error: " + err.message);
    return respond({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    let body;
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else {
      return respond({ success: false, error: "No data received" });
    }

    const action = body.action;

    switch (action) {
      case "register":              return handleRegister(body);
      case "login":                 return handleLogin(body);
      case "logout":                return handleLogout(body);
      case "registerTournament":    return handleRegisterTournament(body);
      case "submitChangeRequest":   return handleSubmitChangeRequest(body);
      case "adminLogin":            return handleAdminLogin(body);
      case "adminVerifyPlayer":     return handleAdminVerifyPlayer(body);
      case "addTournament":         return handleAdminAddTournament(body);
      case "updateTournament":      return handleAdminUpdateTournament(body);
      case "addRoomDetails":        return handleAdminAddRoomDetails(body);
      case "addMatchResult":        return handleAdminAddMatchResult(body);
      case "resolveChangeRequest":  return handleAdminResolveChangeRequest(body);
      case "postAnnouncement":      return handleAdminPostAnnouncement(body);
      default:
        return respond({ success: false, error: "Unknown POST action: " + action });
    }
  } catch (err) {
    Logger.log("doPost error: " + err.message);
    return respond({ success: false, error: err.message });
  }
}

// =======================================================
// AUTH FUNCTIONS
// =======================================================

function handleRegister(body) {
  const sheet = getSheet("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === body.email) {
      return respond({ success: false, error: "Email already registered" });
    }
  }

  const UserID = generateID("USR");
  const now = new Date();

  sheet.appendRow([
    UserID,
    body.email,
    body.passwordHash,
    body.playerName,
    body.ffuid,
    body.teamName,
    body.discordId,
    false,
    "player",
    now
  ]);

  SpreadsheetApp.flush();

  return respond({ success: true, userId: UserID });
}

function handleLogin(body) {
  const sheet = getSheet("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === body.email) {
      if (row[2] === body.passwordHash) {
        const userId = row[0];
        const playerName = row[3];
        const role = row[8];
        const token = generateToken();
        const now = new Date();
        const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const sessionSheet = getSheet("Sessions");
        sessionSheet.appendRow([token, userId, now, expires]);

        // Force Google to save immediately
        SpreadsheetApp.flush();

        return respond({ success: true, token: token, userId: userId, playerName: playerName, role: role });
      } else {
        return respond({ success: false, error: "Invalid credentials" });
      }
    }
  }
  return respond({ success: false, error: "Invalid credentials" });
}

function handleValidateSession(params) {
  const result = validateSessionToken(params.token);
  return respond(result);
}

function handleLogout(body) {
  const sheet = getSheet("Sessions");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === body.token) {
      sheet.deleteRow(i + 1);
      
      SpreadsheetApp.flush();
      
      return respond({ success: true });
    }
  }
  return respond({ success: true });
}

// =======================================================
// TOURNAMENT FUNCTIONS
// =======================================================

function handleGetTournaments(params) {
  const sheet = getSheet("Tournaments");
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return respond({ success: true, tournaments: [] });

  let tournaments = rows.slice(1).map(row => ({
    tournamentId: row[0],
    name: row[1],
    game: row[2],
    date: row[3],
    time: row[4],
    prizePool: row[5],
    totalSlots: row[6],
    filledSlots: row[7],
    status: row[8],
    mapName: row[12],
    bannerURL: row[13]
  }));

  if (params.status && params.status !== "all") {
    tournaments = tournaments.filter(t => t.status === params.status);
  }

  return respond({ success: true, tournaments: tournaments });
}

function handleGetTournamentDetail(params) {
  const sheet = getSheet("Tournaments");
  const rows = sheet.getDataRange().getValues();
  let tournamentData = null;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === params.tournamentId) {
      tournamentData = rows[i];
      break;
    }
  }

  if (!tournamentData) {
    return respond({ success: false, error: "Tournament not found" });
  }

  const tournament = {
    tournamentId: tournamentData[0],
    name: tournamentData[1],
    game: tournamentData[2],
    date: tournamentData[3],
    time: tournamentData[4],
    prizePool: tournamentData[5],
    totalSlots: tournamentData[6],
    filledSlots: tournamentData[7],
    status: tournamentData[8],
    roomId: tournamentData[9],
    roomPass: tournamentData[10],
    rules: tournamentData[11],
    mapName: tournamentData[12],
    bannerURL: tournamentData[13]
  };

  let isRegistered = false;

  if (params.token) {
    const session = validateSessionToken(params.token);
    if (session.valid) {
      const regSheet = getSheet("Registrations");
      const regData = regSheet.getDataRange().getValues();
      for (let j = 1; j < regData.length; j++) {
        if (regData[j][1] === params.tournamentId && regData[j][2] === session.userId) {
          isRegistered = true;
          break;
        }
      }
    }
  }

  if (!isRegistered) {
    tournament.roomId = null;
    tournament.roomPass = null;
  }

  return respond({ success: true, tournament: tournament, isRegistered: isRegistered });
}

function handleRegisterTournament(body) {
  const session = validateSessionToken(body.token);
  if (!session.valid) {
    return respond({ success: false, error: "Not logged in" });
  }

  const regSheet = getSheet("Registrations");
  const regData = regSheet.getDataRange().getValues();
  for (let i = 1; i < regData.length; i++) {
    if (regData[i][1] === body.tournamentId && regData[i][2] === session.userId) {
      return respond({ success: false, error: "Already registered" });
    }
  }

  const tourSheet = getSheet("Tournaments");
  const tourData = tourSheet.getDataRange().getValues();
  let tourRowIndex = -1;
  let filledSlots = 0;

  for (let i = 1; i < tourData.length; i++) {
    if (tourData[i][0] === body.tournamentId) {
      if (Number(tourData[i][7]) >= Number(tourData[i][6])) {
        return respond({ success: false, error: "Tournament is full" });
      }
      tourRowIndex = i;
      filledSlots = Number(tourData[i][7]);
      break;
    }
  }

  if (tourRowIndex === -1) {
    return respond({ success: false, error: "Tournament not found" });
  }

  const usersSheet = getSheet("Users");
  const usersData = usersSheet.getDataRange().getValues();
  let teamName = "";
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][0] === session.userId) {
      teamName = usersData[i][5];
      break;
    }
  }

  const RegID = generateID("REG");
  regSheet.appendRow([RegID, body.tournamentId, session.userId, session.playerName, teamName, new Date()]);
  tourSheet.getRange(tourRowIndex + 1, 8).setValue(filledSlots + 1);

  SpreadsheetApp.flush();

  return respond({ success: true });
}

function handleGetRegisteredTournaments(params) {
  const session = validateSessionToken(params.token);
  if (!session.valid) {
    return respond({ success: false, error: "Not logged in" });
  }

  const regSheet = getSheet("Registrations");
  const regData = regSheet.getDataRange().getValues();
  const tourSheet = getSheet("Tournaments");
  const tourData = tourSheet.getDataRange().getValues();

  const registeredTournaments = [];

  for (let i = 1; i < regData.length; i++) {
    if (regData[i][2] === session.userId) {
      const regRow = regData[i];
      for (let j = 1; j < tourData.length; j++) {
        if (tourData[j][0] === regRow[1]) {
          registeredTournaments.push({
            regId: regRow[0],
            registeredAt: regRow[5],
            tournamentId: tourData[j][0],
            name: tourData[j][1],
            game: tourData[j][2],
            date: tourData[j][3],
            time: tourData[j][4],
            prizePool: tourData[j][5],
            status: tourData[j][8],
            bannerURL: tourData[j][13]
          });
          break;
        }
      }
    }
  }

  return respond({ success: true, tournaments: registeredTournaments });
}

// =======================================================
// STATS FUNCTIONS
// =======================================================

function handleGetLeaderboard(params) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("leaderboard");
  if (cached) return respond({ success: true, players: JSON.parse(cached) });

  const sheet = getSheet("PlayerStats");
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return respond({ success: true, players: [] });

  const players = rows.slice(1).map(row => ({
    playerId: row[0],
    playerName: row[1],
    totalMatches: Number(row[2]),
    totalKills: Number(row[3]),
    totalWins: Number(row[4]),
    kd: Number(row[5])
  }));

  players.sort((a, b) => {
    if (b.kd !== a.kd) return b.kd - a.kd;
    if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
    return b.totalMatches - a.totalMatches;
  });

  const top100 = players.slice(0, 100);
  cache.put("leaderboard", JSON.stringify(top100), 300);

  return respond({ success: true, players: top100 });
}

function handleGetProfile(params) {
  const usersSheet = getSheet("Users");
  const usersData = usersSheet.getDataRange().getValues();
  let userRow = null;

  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][0] === params.userId) {
      userRow = usersData[i];
      break;
    }
  }

  if (!userRow) return respond({ success: false, error: "Player not found" });

  const profile = {
    userId: userRow[0],
    email: userRow[1],
    playerName: userRow[3],
    ffuid: userRow[4],
    teamName: userRow[5],
    discordId: userRow[6],
    verified: userRow[7],
    role: userRow[8]
  };

  const statsSheet = getSheet("PlayerStats");
  const statsData = statsSheet.getDataRange().getValues();

  let statsRow = null;
  for (let i = 1; i < statsData.length; i++) {
    if (statsData[i][0] === params.userId) {
      statsRow = statsData[i];
      break;
    }
  }

  if (statsRow) {
    profile.totalMatches = Number(statsRow[2]);
    profile.totalKills = Number(statsRow[3]);
    profile.totalWins = Number(statsRow[4]);
    profile.kd = Number(statsRow[5]);
  } else {
    profile.totalMatches = 0;
    profile.totalKills = 0;
    profile.totalWins = 0;
    profile.kd = 0;
  }

  return respond({ success: true, profile: profile });
}

function handleGetMatchHistory(params) {
  const sheet = getSheet("Matches");
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return respond({ success: true, matches: [] });

  const matches = rows.slice(1)
    .filter(row => row[2] === params.userId)
    .map(row => ({
      matchId: row[0],
      tournamentId: row[1],
      playerId: row[2],
      playerName: row[3],
      kills: row[4],
      rank: row[5],
      date: row[6]
    }));

  matches.sort((a, b) => new Date(b.date) - new Date(a.date));

  return respond({ success: true, matches: matches });
}

function handleSubmitChangeRequest(body) {
  const session = validateSessionToken(body.token);
  if (!session.valid) return respond({ success: false, error: "Not logged in" });

  const sheet = getSheet("ChangeRequests");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === session.userId && data[i][6] === "pending") {
      return respond({ success: false, error: "You already have a pending request" });
    }
  }

  const ReqID = generateID("REQ");
  sheet.appendRow([ReqID, session.userId, session.playerName, body.field, body.newValue, body.reason, "pending", new Date()]);
  
  SpreadsheetApp.flush();

  return respond({ success: true });
}

// =======================================================
// ADMIN FUNCTIONS
// =======================================================

function handleAdminLogin(body) {
  const sheet = getSheet("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[1] === body.email && row[2] === body.passwordHash) {
      if (row[8] !== "admin") {
        return respond({ success: false, error: "Not authorized" });
      }
      const userId = row[0];
      const playerName = row[3];
      const role = row[8];
      const token = generateToken();
      const now = new Date();
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const sessionSheet = getSheet("Sessions");
      sessionSheet.appendRow([token, userId, now, expires]);

      // Force Google to save immediately
      SpreadsheetApp.flush();

      return respond({ success: true, token: token, userId: userId, playerName: playerName, role: role });
    }
  }
  return respond({ success: false, error: "Invalid credentials" });
}

function handleAdminGetUsers(params) {
  if (!checkAdmin(params.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const sheet = getSheet("Users");
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return respond({ success: true, users: [] });

  const users = rows.slice(1).map(row => ({
    userId: row[0],
    email: row[1],
    playerName: row[3],
    ffuid: row[4],
    teamName: row[5],
    discordId: row[6],
    verified: row[7],
    role: row[8]
  }));

  return respond({ success: true, users: users });
}

function handleAdminGetChangeRequests(params) {
  if (!checkAdmin(params.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const sheet = getSheet("ChangeRequests");
  const rows = sheet.getDataRange().getValues();

  if (rows.length <= 1) return respond({ success: true, requests: [] });

  let requests = rows.slice(1).map(row => ({
    requestId: row[0],
    userId: row[1],
    playerName: row[2],
    field: row[3],
    newValue: row[4],
    reason: row[5],
    status: row[6],
    date: row[7]
  }));

  if (params.status && params.status !== "all") {
    requests = requests.filter(r => r.status === params.status);
  }

  return respond({ success: true, requests: requests });
}

function handleAdminVerifyPlayer(body) {
  if (!checkAdmin(body.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const sheet = getSheet("Users");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === body.userId) {
      sheet.getRange(i + 1, 8).setValue(true);
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: "User not found" });
}

function handleAdminAddTournament(body) {
  if (!checkAdmin(body.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const TournamentID = generateID("TOUR");
  const sheet = getSheet("Tournaments");

  sheet.appendRow([
    TournamentID, body.name, body.game, body.date, body.time,
    body.prizePool, body.totalSlots, 0, "upcoming", "", "",
    body.rules, body.mapName, body.bannerURL || ""
  ]);

  const msg = "🏆 <b>New Tournament!</b>\n\n" +
    "<b>Name:</b> " + body.name + "\n" +
    "<b>Game:</b> " + body.game + "\n" +
    "<b>Date:</b> " + body.date + " at " + body.time + "\n" +
    "<b>Prize Pool:</b> " + body.prizePool + "\n" +
    "<b>Slots:</b> " + body.totalSlots + "\n\n" +
    "Register now at esports.onlyaadi.in 🎮";

  const msgId = sendTelegramMessage(msg);

  const annSheet = getSheet("Announcements");
  annSheet.appendRow([generateID("ANN"), "New Tournament: " + body.name, msg, new Date(), true, msgId || ""]);

  SpreadsheetApp.flush();

  return respond({ success: true, tournamentId: TournamentID });
}

function handleAdminUpdateTournament(body) {
  if (!checkAdmin(body.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const sheet = getSheet("Tournaments");
  const data = sheet.getDataRange().getValues();
  let foundRowIndex = -1;
  let tournamentName = "";

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === body.tournamentId) {
      foundRowIndex = i;
      tournamentName = data[i][1];
      break;
    }
  }

  if (foundRowIndex === -1) return respond({ success: false, error: "Tournament not found" });

  const columnMap = {
    name: 1, game: 2, date: 3, time: 4, prizePool: 5,
    totalSlots: 6, rules: 11, mapName: 12, bannerURL: 13, status: 8
  };

  for (const key in columnMap) {
    if (body[key] !== undefined) {
      sheet.getRange(foundRowIndex + 1, columnMap[key] + 1).setValue(body[key]);
    }
  }

  if (body.status === "ongoing") {
    sendTelegramMessage("🎮 <b>Tournament is now LIVE!</b>\n\n<b>" + tournamentName + "</b> has started!\n\nGood luck to all players! 🔥");
  }
  if (body.status === "past") {
    sendTelegramMessage("✅ <b>Tournament Ended</b>\n\n<b>" + tournamentName + "</b> has concluded. Check leaderboard for results.");
  }

  SpreadsheetApp.flush();

  return respond({ success: true });
}

function handleAdminAddRoomDetails(body) {
  if (!checkAdmin(body.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const sheet = getSheet("Tournaments");
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === body.tournamentId) {
      const tournamentName = data[i][1];
      sheet.getRange(i + 1, 10).setValue(body.roomId);
      sheet.getRange(i + 1, 11).setValue(body.roomPass);
      sendTelegramMessage("🔑 <b>Room Details Ready!</b>\n\n<b>" + tournamentName + "</b>\nRoom details are now available.\n\nLogin at esports.onlyaadi.in to view your Room ID and Password 🎯");
      
      SpreadsheetApp.flush();
      
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: "Tournament not found" });
}

function handleAdminResolveChangeRequest(body) {
  if (!checkAdmin(body.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const requestsSheet = getSheet("ChangeRequests");
  const requestsData = requestsSheet.getDataRange().getValues();
  let foundRowIndex = -1;

  for (let i = 1; i < requestsData.length; i++) {
    if (requestsData[i][0] === body.requestId) {
      foundRowIndex = i;
      break;
    }
  }

  if (foundRowIndex === -1) return respond({ success: false, error: "Request not found" });

  requestsSheet.getRange(foundRowIndex + 1, 7).setValue(body.status);

  if (body.status === "approved") {
    const userId = requestsData[foundRowIndex][1];
    const field = requestsData[foundRowIndex][3];
    const newValue = requestsData[foundRowIndex][4];

    const usersSheet = getSheet("Users");
    const usersData = usersSheet.getDataRange().getValues();

    for (let j = 1; j < usersData.length; j++) {
      if (usersData[j][0] === userId) {
        let colIndex = -1;
        if (field === "PlayerName")  colIndex = 4;
        else if (field === "FFUID")       colIndex = 5;
        else if (field === "TeamName")    colIndex = 6;
        else if (field === "DiscordID")   colIndex = 7;
        else if (field === "InGameName")  colIndex = 5;
        if (colIndex !== -1) {
          usersSheet.getRange(j + 1, colIndex).setValue(newValue);
        }
        break;
      }
    }
  }
  
  SpreadsheetApp.flush();

  return respond({ success: true });
}

function handleAdminPostAnnouncement(body) {
  if (!checkAdmin(body.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const message = "📢 <b>" + (body.title || "Announcement") + "</b>\n\n" + body.message;
  const msgId = sendTelegramMessage(message);

  const annSheet = getSheet("Announcements");
  annSheet.appendRow([generateID("ANN"), body.title || "Announcement", body.message, new Date(), true, msgId || ""]);

  SpreadsheetApp.flush();

  return respond({ success: true });
}

// Special wrapper to parse JSON string from GET parameters for addMatchResult
function handleAdminAddMatchResultGET(params) {
  if (!checkAdmin(params.adminSecret)) {
    return respond({ success: false, error: "Unauthorized" });
  }
  try {
    params.results = JSON.parse(params.results);
  } catch(e) {
    return respond({ success: false, error: "Invalid results format" });
  }
  return handleAdminAddMatchResult(params);
}

function handleAdminAddMatchResult(body) {
  if (!checkAdmin(body.adminSecret)) return respond({ success: false, error: "Unauthorized" });

  const tourSheet = getSheet("Tournaments");
  const tourData = tourSheet.getDataRange().getValues();
  let tournamentName = "";
  for (let i = 1; i < tourData.length; i++) {
    if (tourData[i][0] === body.tournamentId) {
      tournamentName = tourData[i][1];
      break;
    }
  }

  const statsSheet = getSheet("PlayerStats");
  const statsData = statsSheet.getDataRange().getValues();
  const matchesSheet = getSheet("Matches");
  const date = new Date();

  body.results.forEach((player, index) => {
    const MatchID = generateID("MATCH") + index;
    matchesSheet.appendRow([MatchID, body.tournamentId, player.userId, player.playerName, player.kills, player.rank, date]);

    let existingRowIndex = -1;
    for (let i = 1; i < statsData.length; i++) {
      if (statsData[i][0] === player.userId) {
        existingRowIndex = i;
        break;
      }
    }

    if (existingRowIndex >= 0) {
      const newMatches = Number(statsData[existingRowIndex][2]) + 1;
      const newKills = Number(statsData[existingRowIndex][3]) + Number(player.kills);
      const newWins = Number(statsData[existingRowIndex][4]) + (player.rank == 1 ? 1 : 0);
      const newKD = newKills / Math.max(newMatches - newWins, 1);

      statsSheet.getRange(existingRowIndex + 1, 3).setValue(newMatches);
      statsSheet.getRange(existingRowIndex + 1, 4).setValue(newKills);
      statsSheet.getRange(existingRowIndex + 1, 5).setValue(newWins);
      statsSheet.getRange(existingRowIndex + 1, 6).setValue(newKD);

      statsData[existingRowIndex][2] = newMatches;
      statsData[existingRowIndex][3] = newKills;
      statsData[existingRowIndex][4] = newWins;
      statsData[existingRowIndex][5] = newKD;
    } else {
      const newWins = (player.rank == 1 ? 1 : 0);
      const newKD = Number(player.kills) / Math.max(1 - newWins, 1);
      statsSheet.appendRow([player.userId, player.playerName, 1, Number(player.kills), newWins, newKD]);
      statsData.push([player.userId, player.playerName, 1, Number(player.kills), newWins, newKD]);
    }
  });

  const winner = body.results.find(p => p.rank == 1);
  if (winner) {
    sendTelegramMessage(
      "🏆 <b>Match Results!</b>\n\n" +
      "<b>Tournament:</b> " + tournamentName + "\n\n" +
      "🥇 <b>Winner:</b> " + winner.playerName + " (" + winner.kills + " kills)\n\n" +
      "Full results at esports.onlyaadi.in 📊"
    );
  }

  CacheService.getScriptCache().remove("leaderboard");
  
  SpreadsheetApp.flush();

  return respond({ success: true });
}