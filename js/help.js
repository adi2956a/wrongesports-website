document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("helpDiscordBtn")?.addEventListener("click", () => openExternalLink(CONFIG.DISCORD_INVITE));
  document.getElementById("helpDiscordBtn2")?.addEventListener("click", () => openExternalLink(CONFIG.DISCORD_INVITE));
  document.getElementById("helpTelegramBtn")?.addEventListener("click", () => openExternalLink(CONFIG.TELEGRAM_GROUP));
  document.getElementById("helpInstagramBtn")?.addEventListener("click", () => openExternalLink(CONFIG.INSTAGRAM_URL));
  document.getElementById("helpYoutubeBtn")?.addEventListener("click", () => openExternalLink(CONFIG.YOUTUBE_URL));
  document.querySelectorAll(".accordion-trigger").forEach((button) => {
    button.addEventListener("click", () => {
      button.parentElement.classList.toggle("active");
    });
  });
});
