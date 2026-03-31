function safeText(value, fallback = "N/A") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function escapeHtml(value) {
  return safeText(value, "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function normalizeArray(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.tournaments)) {
    return payload.tournaments;
  }

  if (Array.isArray(payload?.players)) {
    return payload.players;
  }

  return [];
}

function setLoading(container, markup) {
  container.innerHTML = markup;
}

function renderError(container, retryHandler) {
  container.innerHTML = `
    <div class="error-card">
      <p class="error-text">Could not load data. Check your connection.</p>
      <div class="inline-actions" style="justify-content:center; margin-top: 1rem;">
        <button class="btn-secondary" id="retryBtn">Retry</button>
      </div>
    </div>
  `;

  const retryBtn = container.querySelector("#retryBtn");
  if (retryBtn) {
    retryBtn.addEventListener("click", retryHandler);
  }
}

function getCurrentPath() {
  const path = window.location.pathname;
  return path === "/" ? "/index.html" : path;
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "ongoing") return "status-ongoing";
  if (value === "upcoming") return "status-upcoming";
  if (value === "approved" || value === "verified") return "status-approved";
  if (value === "pending") return "status-pending";
  if (value === "rejected") return "status-rejected";
  return "status-past";
}

function formatStatus(status) {
  return safeText(status, "unknown").replace(/^\w/, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(value) {
  if (!value) return "TBD";
  if (/^\d{1,2}:\d{2}/.test(value)) {
    const [hours, minutes] = value.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes));
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  }
  return value;
}

function formatCurrency(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return safeText(value, "TBD");
  return `?${amount.toLocaleString("en-IN")}`;
}

function openExternalLink(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function getPlayerName() {
  return localStorage.getItem("we_playerName") || "Player";
}

function renderNavAuth() {
  const navAuth = document.getElementById("navAuth");
  if (!navAuth) return;

  const token = localStorage.getItem("we_token");
  const role = localStorage.getItem("we_role");

  if (token) {
    const dashboardHref = role === "admin" ? "/admin/panel.html" : "/dashboard.html";
    navAuth.innerHTML = `
      <span class="nav-user">?? ${escapeHtml(getPlayerName())}</span>
      <a href="${dashboardHref}" class="btn-secondary">Dashboard</a>
      <button type="button" class="btn-secondary" id="navLogoutBtn">Logout</button>
    `;
    const logoutBtn = document.getElementById("navLogoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
  } else {
    navAuth.innerHTML = `
      <a href="/login.html" class="btn-secondary">Login</a>
      <a href="/register.html" class="btn-primary">Register</a>
    `;
  }
}

function initNavbar() {
  const currentPath = getCurrentPath();
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === currentPath) {
      link.classList.add("active");
    }
  });

  renderNavAuth();

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  const navAuth = document.getElementById("navAuth");

  if (toggle && links && navAuth) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
      navAuth.classList.toggle("open");
      document.body.classList.toggle("nav-open");
    });
  }
}

function createSkeletonCards(count, markup) {
  return Array.from({ length: count }, () => markup).join("");
}

function togglePanels(buttonSelector, panelSelector, activeValue, attr = "data-tab") {
  document.querySelectorAll(buttonSelector).forEach((button) => {
    button.classList.toggle("active", button.getAttribute(attr) === activeValue);
  });

  document.querySelectorAll(panelSelector).forEach((panel) => {
    panel.classList.toggle("active", panel.getAttribute(attr) === activeValue);
  });
}

document.addEventListener("DOMContentLoaded", initNavbar);
