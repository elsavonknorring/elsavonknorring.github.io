(function () {
  if (document.getElementById("receptlistan-panel")) return;

  function scrapeIngredients() {
    const results = [];

    // Mathem
    const mathemSpans = document.querySelectorAll('span[class*="k-text-style--body-m"], span[class*="k-text-style"]');
    if (mathemSpans.length > 0) {
      mathemSpans.forEach(el => {
        const text = el.textContent.trim().replace(/\s+/g, " ");
        if (text.length > 1 && text.length < 120) results.push(text);
      });
      if (results.length > 0) return [...new Set(results)];
    }

    // Arla
    const arlaGroup = document.querySelector('[class*="c-recipe__ingredients-group"]');
    if (arlaGroup) {
      arlaGroup.querySelectorAll("tr").forEach(row => {
        const text = row.textContent.trim().replace(/\s+/g, " ");
        if (text.length > 1 && text.length < 120) results.push(text);
      });
      if (results.length > 0) return [...new Set(results)];
    }

    const selectors = [
      '[class*="ingredients-list-group__card"]',
      'ul.List--section li',
      '.List--section li',
      'li[class*="u-paddingHxsm"]',
      '[class*="IngredientList"] li',
      '[class*="ingredient-list"] li',
      '[class*="ingredients"] li',
      '[itemprop="recipeIngredient"]',
      '[class*="Ingredient"] li',
      '[class*="ingredient"] li',
      'ul[class*="ingredient"] li',
      'li[class*="ingredient"]',
    ];

    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) {
        els.forEach(el => {
          const text = el.textContent.trim().replace(/\s+/g, " ");
          if (text.length > 1 && text.length < 120) results.push(text);
        });
        break;
      }
    }

    if (results.length === 0) {
      const headers = document.querySelectorAll("h1,h2,h3,h4,strong,b");
      for (const h of headers) {
        if (/ingrediens|du behöver|innehåll/i.test(h.textContent)) {
          let sibling = h.nextElementSibling;
          for (let i = 0; i < 5; i++) {
            if (!sibling) break;
            const lis = sibling.querySelectorAll("li");
            if (lis.length > 0) {
              lis.forEach(li => {
                const t = li.textContent.trim().replace(/\s+/g, " ");
                if (t.length > 1) results.push(t);
              });
              break;
            }
            sibling = sibling.nextElementSibling;
          }
          if (results.length > 0) break;
        }
      }
    }

    return [...new Set(results)];
  }

  function buildPanel(ingredients) {
    const panel = document.createElement("div");
    panel.id = "receptlistan-panel";

    panel.innerHTML = `
      <div class="rl-header">
        <span>🛒 Receptlistan</span>
        <button class="rl-close" id="rl-close-btn">✕</button>
      </div>
      <div class="rl-body" id="rl-body"></div>
    `;

    document.body.appendChild(panel);

    document.getElementById("rl-close-btn").addEventListener("click", () => {
      panel.classList.toggle("rl-collapsed");
    });

    renderIngredients(ingredients, panel);
  }

  function renderIngredients(ingredients, panel) {
    const body = document.getElementById("rl-body");

    if (ingredients.length === 0) {
      body.innerHTML = `<p class="rl-empty">Kunde inte hitta ingredienser automatiskt.<br>Prova att navigera till ett recept!</p>`;
      return;
    }

    body.innerHTML = `<p class="rl-instruction">Klicka i det du <strong>redan har hemma</strong>:</p>`;

    const list = document.createElement("ul");
    list.className = "rl-list";

    ingredients.forEach((ing, i) => {
      const li = document.createElement("li");
      li.className = "rl-item";
      li.innerHTML = `
        <label class="rl-label">
          <input type="checkbox" class="rl-check" data-ingredient="${escapeHtml(ing)}" />
          <span class="rl-text">${escapeHtml(ing)}</span>
        </label>
      `;
      list.appendChild(li);
    });

    body.appendChild(list);

    const footer = document.createElement("div");
    footer.className = "rl-footer";
    footer.innerHTML = `
      <button class="rl-btn primary" id="rl-generate-btn">Skapa inköpslista →</button>
      <button class="rl-btn ghost" id="rl-clear-btn">Rensa allt</button>
    `;
    body.appendChild(footer);

    document.getElementById("rl-generate-btn").addEventListener("click", () => {
      const checked = [...document.querySelectorAll(".rl-check:checked")]
        .map(cb => cb.dataset.ingredient);
      const missing = ingredients.filter(ing => !checked.includes(ing));
      showShoppingList(missing, panel);
    });

    document.getElementById("rl-clear-btn").addEventListener("click", () => {
      document.querySelectorAll(".rl-check").forEach(cb => (cb.checked = false));
      document.querySelectorAll(".rl-item").forEach(li => li.classList.remove("rl-has"));
    });

    body.addEventListener("change", (e) => {
      if (e.target.classList.contains("rl-check")) {
        e.target.closest(".rl-item").classList.toggle("rl-has", e.target.checked);
      }
    });
  }

  function showShoppingList(missing, panel) {
    chrome.storage.sync.set({ shoppingList: missing, savedAt: new Date().toISOString() });
    const body = document.getElementById("rl-body");

    if (missing.length === 0) {
      body.innerHTML = `
        <div class="rl-result-empty">
          <div style="font-size:40px">🎉</div>
          <p>Du har allt hemma!</p>
          <button class="rl-btn ghost" id="rl-back-btn">← Tillbaka</button>
        </div>
      `;
    } else {
      body.innerHTML = `
        <p class="rl-instruction"><strong>${missing.length} sak${missing.length !== 1 ? "er" : ""}</strong> att handla:</p>
        <ul class="rl-shopping-list">
          ${missing.map(item => `<li class="rl-shopping-item">🛒 ${escapeHtml(item)}</li>`).join("")}
        </ul>
        <div class="rl-footer">
          <button class="rl-btn primary" id="rl-copy-btn">📋 Kopiera lista</button>
          <button class="rl-btn ghost" id="rl-back-btn">← Tillbaka</button>
        </div>
      `;

      document.getElementById("rl-copy-btn").addEventListener("click", () => {
        navigator.clipboard.writeText(missing.join("\n")).then(() => {
          const btn = document.getElementById("rl-copy-btn");
          btn.textContent = "✓ Kopierad!";
          setTimeout(() => (btn.textContent = "📋 Kopiera lista"), 2000);
        });
      });
    }

    document.getElementById("rl-back-btn").addEventListener("click", () => {
      panel.remove();
      // Vänta lite och försök igen
      setTimeout(() => {
        const fresh = scrapeIngredients();
        buildPanel(fresh);
      }, 500);
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ─── STARTA — vänta på att sidan laddar klart (fixar ICA + Arla) ───
  function init() {
    const ingredients = scrapeIngredients();
    if (ingredients.length > 0) {
      buildPanel(ingredients);
    } else {
      // Vänta 2 sekunder och försök igen (för dynamiska sidor)
      setTimeout(() => {
        const retryIngredients = scrapeIngredients();
        buildPanel(retryIngredients);
      }, 2000);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();