document.addEventListener("DOMContentLoaded", () => {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const discordBtn = document.getElementById("mediaDiscordBtn");

  document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    button.addEventListener("click", () => {
      lightboxImage.src = button.dataset.lightboxSrc;
      lightbox.classList.add("active");
    });
  });

  if (discordBtn) discordBtn.addEventListener("click", () => openExternalLink(CONFIG.DISCORD_INVITE));
  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) lightbox.classList.remove("active");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") lightbox.classList.remove("active");
  });
});
