async function register(email, password, playerName, ffuid, teamName, discordId) {
  const hash = CryptoJS.SHA256(password).toString();
  const response = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "register",
      email,
      passwordHash: hash,
      playerName,
      ffuid,
      teamName,
      discordId
    })
  });

  return response.json();
}

async function login(email, password) {
  const passwordHash = CryptoJS.SHA256(password).toString();
  const response = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "login",
      email,
      passwordHash
    })
  });
  const data = await response.json();

  if (data.success) {
    localStorage.setItem("we_token", data.token || "");
    localStorage.setItem("we_userId", data.userId || "");
    localStorage.setItem("we_playerName", data.playerName || "");
    localStorage.setItem("we_role", data.role || "player");
  }

  return data;
}

async function validateSession() {
  const token = localStorage.getItem("we_token");

  if (!token) {
    return false;
  }

  const response = await fetch(`${CONFIG.API_URL}?${new URLSearchParams({ action: "validateSession", token }).toString()}`);
  const data = await response.json();

  if (!data.success) {
    clearAuth();
    return false;
  }

  return true;
}

function clearAuth() {
  localStorage.removeItem("we_token");
  localStorage.removeItem("we_userId");
  localStorage.removeItem("we_playerName");
  localStorage.removeItem("we_role");
}

async function logout() {
  const token = localStorage.getItem("we_token");

  try {
    await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "logout",
        token
      })
    });
  } catch (error) {
    console.error("Logout request failed", error);
  } finally {
    clearAuth();
    window.location.href = "/login.html";
  }
}

async function requireAuth() {
  const valid = await validateSession();

  if (!valid) {
    window.location.href = "/login.html";
  }
}

async function requireAdmin() {
  const valid = await validateSession();
  const role = localStorage.getItem("we_role");

  if (!valid || role !== "admin") {
    window.location.href = "/admin/index.html";
  }
}

function getUser() {
  return {
    token: localStorage.getItem("we_token"),
    userId: localStorage.getItem("we_userId"),
    playerName: localStorage.getItem("we_playerName"),
    role: localStorage.getItem("we_role")
  };
}
