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
  if (!tab) return;
  const currentHost = new URL(tab.url).hostname;
  const rules = elements[currentHost];
  if (!rules) return;
  for (const rule of rules) {
    if(rule.kind.toString() !== '5') continue;
    applyFunctions[`applyKind${rule.kind}`](tab, rule);
  }
});

// const applyKind1 = (tab, { selector, extraInfo }) => {
//   const toRemoveClasses = extraInfo
//     .split(";")
//     .map((klass) => `"${klass}"`)
//     .join(",");

//   chrome.scripting.executeScript(tab.id, {
//     code: `document.querySelectorAll("${selector}").forEach(node => node.classList.remove(${toRemoveClasses}))`,
//   });
// };

// const applyKind2 = (tab, { selector, extraInfo }) => {
//   const toAddClasses = extraInfo
//     .split(";")
//     .map((klass) => `"${klass}"`)
//     .join(",");

//   chrome.scripting.executeScript(tab.id, {
//     code: `document.querySelectorAll("${selector}").forEach(node => node.classList.add(${toAddClasses}))`,
//   });
// };

// const applyKind3 = (tab, { selector, extraInfo }) => {
//   chrome.scripting.executeScript(tab.id, {
//     code: `document.querySelectorAll("${selector}").forEach(node => node.style.cssText += "${extraInfo}")`,
//   });
// };

// const applyKind4 = (tab, { selector }) => {
//   chrome.scripting.executeScript(tab.id, {
//     code: `document.querySelectorAll("${selector}").forEach(node => node.parentNode.removeChild(node))`,
//   });
// };

const applyKind5 = (tab, { extraInfo }) => {
  const code = `
      const bRemoverNode = document.createElement("script");
      const bRemoverData = document.createTextNode(\`${extraInfo}\`);
      bRemoverNode.appendChild(bRemoverData);
      document.querySelector("head").appendChild(bRemoverNode);
    `
  chrome.scripting.executeScript({
    target: {tabId: tab.id}, 
    args: [code],
    func: ({code}) => eval(code)
  });
};

// const applyKind6 = (tab, { extraInfo }) => {
//   chrome.scripting.executeScript(tab.id, {
//     code: `
//       const bScriptNode = document.createElement("script");
//       bScriptNode.type = "text/javascript";
//       bScriptNode.src = "${extraInfo}";
//       document.querySelector("head").appendChild(bScriptNode);
//     `,
//   });
// };

// const applyKind7 = (tab, { extraInfo }) => {
//   chrome.scripting.executeScript(tab.id, {
//     code: `
//       const bStylesheetNode = document.createElement("link");
//       bStylesheetNode.rel = "stylesheet";
//       bStylesheetNode.href = "${extraInfo}";
//       document.querySelector("head").appendChild(bStylesheetNode);
//     `,
//   });
// };

const applyFunctions = {
  // applyKind1,
  // applyKind2,
  // applyKind3,
  // applyKind4,
  applyKind5,
  // applyKind6,
  // applyKind7,
};
