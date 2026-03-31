function showFieldError(form, name, message) {
  const target = form.querySelector(`[data-error-for="${name}"]`);
  if (target) target.textContent = message || "";
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((node) => {
    node.textContent = "";
  });
}

function setButtonLoading(button, loading, text) {
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? "Please wait..." : text;
}

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const forgotModal = document.getElementById("forgotModal");

  if (registerForm) {
    if (localStorage.getItem("we_token")) {
      window.location.href = "/dashboard.html";
      return;
    }

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearFieldErrors(registerForm);
      const message = document.getElementById("registerMessage");
      message.textContent = "";

      const formData = new FormData(registerForm);
      const values = Object.fromEntries(formData.entries());
      let valid = true;

      Object.entries(values).forEach(([key, value]) => {
        if (!String(value).trim()) {
          showFieldError(registerForm, key, "This field is required.");
          valid = false;
        }
      });

      if (values.password.length < 8) {
        showFieldError(registerForm, "password", "Password must be at least 8 characters.");
        valid = false;
      }

      if (values.password !== values.confirmPassword) {
        showFieldError(registerForm, "confirmPassword", "Passwords do not match.");
        valid = false;
      }

      if (!/^\d+$/.test(values.ffuid)) {
        showFieldError(registerForm, "ffuid", "Free Fire UID must contain numbers only.");
        valid = false;
      }

      if (!valid) return;

      const button = registerForm.querySelector("button[type='submit']");
      setButtonLoading(button, true, "CREATE ACCOUNT");

      try {
        const response = await register(values.email, values.password, values.playerName, values.ffuid, values.teamName, values.discordId);
        if (response.success) {
          registerForm.classList.add("hidden");
          document.getElementById("registerSuccess").classList.remove("hidden");
        } else {
          message.textContent = response.message || "Unable to create account.";
          message.className = "field-error";
        }
      } catch (error) {
        console.error(error);
        message.textContent = "Could not load data. Check your connection.";
        message.className = "field-error";
      } finally {
        setButtonLoading(button, false, "CREATE ACCOUNT");
      }
    });
  }

  if (loginForm) {
    if (localStorage.getItem("we_token")) {
      window.location.href = "/dashboard.html";
      return;
    }

    const forgotButton = document.getElementById("forgotPasswordBtn");
    const closeForgot = document.getElementById("closeForgotModal");
    const joinDiscord = document.getElementById("forgotDiscordBtn");

    if (forgotButton) forgotButton.addEventListener("click", () => forgotModal.classList.add("active"));
    if (closeForgot) closeForgot.addEventListener("click", () => forgotModal.classList.remove("active"));
    if (joinDiscord) joinDiscord.addEventListener("click", () => openExternalLink(CONFIG.DISCORD_INVITE));
    if (forgotModal) {
      forgotModal.addEventListener("click", (event) => {
        if (event.target === forgotModal) forgotModal.classList.remove("active");
      });
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const errorBox = document.getElementById("loginError");
      errorBox.textContent = "";
      const button = loginForm.querySelector("button[type='submit']");
      setButtonLoading(button, true, "LOGIN");

      try {
        const formData = new FormData(loginForm);
        const response = await login(formData.get("email"), formData.get("password"));
        if (response.success) {
          const returnUrl = localStorage.getItem("returnUrl");
          localStorage.removeItem("returnUrl");
          window.location.href = returnUrl || "/dashboard.html";
        } else {
          errorBox.textContent = response.message || "Invalid email or password.";
        }
      } catch (error) {
        console.error(error);
        errorBox.textContent = "Could not load data. Check your connection.";
      } finally {
        setButtonLoading(button, false, "LOGIN");
      }
    });
  }
});
