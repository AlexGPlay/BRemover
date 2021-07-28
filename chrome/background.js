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

  for (const rule of rules) {
    applyFunctions[`applyKind${rule.kind}`](tab, rule);
  }
});

const applyKind1 = (tab, { selector, extraInfo }) => {
  const toRemoveClasses = extraInfo
    .split(";")
    .map((klass) => `"${klass}"`)
    .join(",");

  chrome.tabs.executeScript(tab.id, {
    code: `document.querySelectorAll("${selector}").forEach(node => node.classList.remove(${toRemoveClasses}))`,
  });
};

const applyKind2 = (tab, { selector, extraInfo }) => {
  const toAddClasses = extraInfo
    .split(";")
    .map((klass) => `"${klass}"`)
    .join(",");

  chrome.tabs.executeScript(tab.id, {
    code: `document.querySelectorAll("${selector}").forEach(node => node.classList.add(${toAddClasses}))`,
  });
};

const applyKind3 = (tab, { selector, extraInfo }) => {
  chrome.tabs.executeScript(tab.id, {
    code: `document.querySelectorAll("${selector}").forEach(node => node.style.cssText += "${extraInfo}")`,
  });
};

const applyKind4 = (tab, { selector }) => {
  chrome.tabs.executeScript(tab.id, {
    code: `document.querySelectorAll("${selector}").forEach(node => node.parentNode.removeChild(node))`,
  });
};

const applyKind5 = (tab, { extraInfo }) => {
  const script = `(function (){ ${extraInfo} })();`;

  chrome.tabs.executeScript(tab.id, {
    code: `
      const bRemoverNode = document.createElement("script");
      const bRemoverData = document.createTextNode(\`${script}\`);
      bRemoverNode.appendChild(bRemoverData);
      document.querySelector("head").appendChild(bRemoverNode);
    `,
  });
};

const applyKind6 = (tab, { extraInfo }) => {
  chrome.tabs.executeScript(tab.id, {
    code: `
      const bScriptNode = document.createElement("script");
      bScriptNode.type = "text/javascript";
      bScriptNode.src = "${extraInfo}";
      document.querySelector("head").appendChild(bScriptNode);
    `,
  });
};

const applyKind7 = (tab, { extraInfo }) => {
  chrome.tabs.executeScript(tab.id, {
    code: `
      const bStylesheetNode = document.createElement("link");
      bStylesheetNode.rel = "stylesheet";
      bStylesheetNode.href = "${extraInfo}";
      document.querySelector("head").appendChild(bStylesheetNode);
    `,
  });
};

const applyFunctions = {
  applyKind1,
  applyKind2,
  applyKind3,
  applyKind4,
  applyKind5,
  applyKind6,
  applyKind7,
};
