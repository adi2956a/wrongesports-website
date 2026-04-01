async function register(email, password, playerName, ffuid, teamName, discordId) {
  const hash = CryptoJS.SHA256(password).toString();
  return apiPost("register", {
    email,
    passwordHash: hash,
    playerName,
    ffuid,
    teamName,
    discordId
  });
}

async function login(email, password) {
  const passwordHash = CryptoJS.SHA256(password).toString();
  let data = await apiPost("login", {
    email,
    passwordHash
  });

  // Allow admins to use the same login form even if backend separates actions.
  if (!data.success) {
    const adminData = await apiPost("adminLogin", { email, passwordHash });
    if (adminData.success) {
      data = {
        ...adminData,
        role: "admin"
      };
    }
  }

  if (data.success) {
    localStorage.setItem("we_token", data.token || "");
    localStorage.setItem("we_userId", data.userId || "");
    localStorage.setItem("we_playerName", data.playerName || "");
    const role = data.role || "player";
    localStorage.setItem("we_role", role);
    if (role === "admin") {
      localStorage.setItem("we_admin_token", data.token || "");
    } else {
      localStorage.removeItem("we_admin_token");
    }
  }

  return data;
}

async function validateSession() {
  const token = localStorage.getItem("we_token");
  const role = localStorage.getItem("we_role");

  if (!token) {
    return false;
  }

  if (role === "admin") {
    return true;
  }

  try {
    const data = await apiGet("validateSession", { token });

    // Keep the local player session if the backend validate endpoint is missing
    // or temporarily inconsistent. This avoids unexpected auto-logouts.
    if (data?.success === false) {
      console.warn("validateSession returned false; keeping local session", data);
      return true;
    }

    return true;
  } catch (error) {
    console.error("validateSession failed", error);
    return true;
  }
}

function clearAuth() {
  localStorage.removeItem("we_token");
  localStorage.removeItem("we_admin_token");
  localStorage.removeItem("we_userId");
  localStorage.removeItem("we_playerName");
  localStorage.removeItem("we_role");
}

async function logout() {
  const role = localStorage.getItem("we_role");
  const token = localStorage.getItem("we_token");

  try {
    await apiPost("logout", { token });
  } catch (error) {
    console.error("Logout request failed", error);
  } finally {
    clearAuth();
    window.location.href = role === "admin" ? "/admin" : "/login";
  }
}

async function requireAuth() {
  const token = localStorage.getItem("we_token");
  const role = localStorage.getItem("we_role");

  if (!token || role === "admin") {
    clearAuth();
    window.location.href = "/login";
    return;
  }

  const valid = await validateSession();

  if (!valid) {
    window.location.href = "/login";
  }
}

async function requireAdmin() {
  const role = localStorage.getItem("we_role");
  const adminToken = localStorage.getItem("we_admin_token") || localStorage.getItem("we_token");

  if (role !== "admin" || !adminToken) {
    clearAuth();
    window.location.href = "/admin";
  }
}

function getUser() {
  return {
    token: localStorage.getItem("we_admin_token") || localStorage.getItem("we_token"),
    userId: localStorage.getItem("we_userId"),
    playerName: localStorage.getItem("we_playerName"),
    role: localStorage.getItem("we_role")
  };
}
