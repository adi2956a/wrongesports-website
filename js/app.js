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

  if (Array.isArray(payload?.users)) {
    return payload.users;
  }

  if (Array.isArray(payload?.requests)) {
    return payload.requests;
  }

  if (Array.isArray(payload?.matches)) {
    return payload.matches;
  }

  if (Array.isArray(payload?.announcements)) {
    return payload.announcements;
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
  const playerName = getPlayerName();
  const initial = escapeHtml((playerName || "P").charAt(0).toUpperCase());
  const roleLabel = role === "admin" ? "Admin access" : "Player dashboard";

  if (token) {
    const dashboardHref = role === "admin" ? "/admin/panel.html" : "/dashboard.html";
    navAuth.innerHTML = `
      <div class="nav-user-card">
        <span class="nav-user-avatar">${initial}</span>
        <span class="nav-user-copy">
          <strong>${escapeHtml(playerName)}</strong>
          <small>${roleLabel}</small>
        </span>
      </div>
      <a href="${dashboardHref}" class="btn-secondary nav-dashboard-link">Dashboard</a>
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

function renderVerifiedBadge(label = "Verified") {
  return `
    <span class="verified-badge" aria-label="${escapeHtml(label)} player">
      <span class="verified-badge-icon"></span>
      ${escapeHtml(label)}
    </span>
  `;
}

function createFakeLoader(title, lines = 3) {
  return `
    <div class="loading-card fake-loader-card">
      <div class="fake-loader-head">
        <p>${escapeHtml(title)}</p>
        <span class="fake-loader-percent">0 - 100</span>
      </div>
      <div class="fake-loader-track"><span class="fake-loader-bar"></span></div>
      <div class="fake-loader-scale">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
      <div class="stack">
        ${createSkeletonCards(lines, '<div class="skeleton" style="height:18px;"></div>')}
      </div>
    </div>
  `;
}

function bindScrollTabs(buttonSelector, panelSelector) {
  const buttons = Array.from(document.querySelectorAll(buttonSelector));
  const panels = Array.from(document.querySelectorAll(panelSelector));
  if (!buttons.length || !panels.length) return;

  const activate = (value) => {
    buttons.forEach((button) => {
      button.classList.toggle("active", button.dataset.tab === value);
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = panels.find((panel) => panel.dataset.tab === button.dataset.tab);
      if (!target) return;
      activate(button.dataset.tab);
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) activate(visible.target.dataset.tab);
    }, {
      threshold: [0.2, 0.5, 0.8],
      rootMargin: "-120px 0px -45% 0px"
    });

    panels.forEach((panel) => observer.observe(panel));
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
