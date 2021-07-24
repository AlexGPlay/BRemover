const getElements = () =>
  new Promise((resolve) =>
    chrome.storage.sync.get(["elements"], (elementsHash) => resolve(elementsHash.elements || {}))
  );

chrome.webNavigation.onCompleted.addListener(async () => {
  const elements = await getElements();

  const getActiveTabs = () =>
    new Promise((resolve) =>
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs))
    );

  const [tab] = await getActiveTabs();
  const currentHost = new URL(tab.url).hostname;
  const rules = elements[currentHost];
  if (!rules) return;
  const toRemoveClasses = rules.split(",");

  chrome.tabs.executeScript(tab.id, {
    code: `document.querySelectorAll("${toRemoveClasses
      .map((cssClass) => `.${cssClass}`)
      .join(",")}").forEach(node => node.classList.remove(${toRemoveClasses
      .map((cssClass) => `'${cssClass}'`)
      .join(",")}))`,
  });
});
