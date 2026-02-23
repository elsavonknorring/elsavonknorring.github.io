// popup.js
document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");

  // Hämta sparad lista från storage
  chrome.storage.sync.get(["shoppingList", "savedAt"], (data) => {
    const list = data.shoppingList;
    const savedAt = data.savedAt;

    if (!list || list.length === 0) {
      // Ingen lista sparad
      content.innerHTML = `
        <div class="empty">
          <div class="emoji">🍳</div>
          <p>Ingen lista sparad ännu.<br><br>
          Gå till en receptsida som
          <a href="https://www.ica.se/recept/" target="_blank">ICA</a> eller
          <a href="https://www.coop.se/recept/" target="_blank">Coop</a>
          och klicka i vad du har hemma!</p>
        </div>
      `;
      return;
    }

    // Formatera datum
    let dateStr = "";
    if (savedAt) {
      const d = new Date(savedAt);
      dateStr = `Sparad ${d.toLocaleDateString("sv-SE")} kl. ${d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Bygg listan
    const items = list.map(item => `<li>${escapeHtml(item)}</li>`).join("");

    content.innerHTML = `
      <div class="list-title">${list.length} sak${list.length !== 1 ? "er" : ""} att handla</div>
      ${dateStr ? `<div class="saved-at">${dateStr}</div>` : ""}
      <ul class="shopping-list">${items}</ul>
      <div class="actions">
        <button class="btn-primary" id="copy-btn">📋 Kopiera</button>
        <button class="btn-ghost" id="clear-btn">🗑 Rensa</button>
      </div>
    `;

    // Kopiera
    document.getElementById("copy-btn").addEventListener("click", () => {
      const text = list.join("\n");
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById("copy-btn");
        btn.textContent = "✓ Kopierad!";
        setTimeout(() => (btn.textContent = "📋 Kopiera"), 2000);
      });
    });

    // Rensa
    document.getElementById("clear-btn").addEventListener("click", () => {
      chrome.storage.sync.remove(["shoppingList", "savedAt"], () => {
        content.innerHTML = `
          <div class="empty">
            <div class="emoji">✨</div>
            <p>Listan rensad! Gå till ett recept för att börja om.</p>
          </div>
        `;
      });
    });
  });
});

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}