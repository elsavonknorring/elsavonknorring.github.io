// background.js — service worker
// Hanterar meddelanden från popup och content scripts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getList") {
    chrome.storage.sync.get(["shoppingList", "savedAt"], (data) => {
      sendResponse(data);
    });
    return true; // Behövs för asynkront svar
  }

  if (request.action === "clearList") {
    chrome.storage.sync.remove(["shoppingList", "savedAt"], () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});