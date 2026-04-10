chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "UPDATE_BADGE") {
    const speed = message.speed;

    // Format: z.B. "1.25x"
    const text = speed.toFixed(1) + "x";

    chrome.action.setBadgeText({
      tabId: sender.tab.id,
      text: text
    });

    chrome.action.setBadgeBackgroundColor({
      tabId: sender.tab.id,
      color: "#00d4aa"
    });
  }
});