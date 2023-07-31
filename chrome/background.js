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
    const {script, params} = applyFunctions[`applyKind${rule.kind}`](rule);
      chrome.scripting.executeScript({
        target: {tabId: tab.id}, 
        args: [params],
        func: script
      });
  }
});

const applyKind1 = ({ selector, extraInfo }) => {
  const toRemoveClasses = extraInfo
    .split(";")
    .map((klass) => `"${klass}"`)
    .join(",");
  console.log(toRemoveClasses)
  return {
    script: ({selector, toRemoveClasses}) => document.querySelectorAll(selector).forEach(node => node.classList.remove(toRemoveClasses)),
    params: {selector, toRemoveClasses}
  }
};

const applyKind2 = ({ selector, extraInfo }) => {
  const toAddClasses = extraInfo
    .split(";")
    .map((klass) => `"${klass}"`)
    .join(",");

  return {
    script: ({selector, toAddClasses}) => document.querySelectorAll(selector).forEach(node => node.classList.add(toAddClasses)),
    params: {selector, toAddClasses}
  }
};

const applyKind3 = ({ selector, extraInfo }) => {
  return {
    script: ({selector, extraInfo}) => document.querySelectorAll(selector).forEach(node => node.style.cssText += extraInfo),
    params: {selector, extraInfo}
  }
};

const applyKind4 = ({ selector }) => {
  return {
    script: ({selector}) => document.querySelectorAll(selector).forEach(node => node.parentNode.removeChild(node)),
    params: {selector}
  }
};

const applyKind5 = ({ extraInfo }) => {
  return {script: ({extraInfo}) => {
    document.documentElement.setAttribute('onreset', extraInfo);
    document.documentElement.dispatchEvent(new CustomEvent('reset'));
    document.documentElement.removeAttribute('onreset');
  }, params: {extraInfo}};
};

const applyKind6 = ({ extraInfo }) => {
  const loadScript = () => {
    const bScriptNode = document.createElement("script");
    bScriptNode.type = "text/javascript";
    bScriptNode.src = extraInfo;
    document.querySelector("head").appendChild(bScriptNode);
  }
  return {
    script: ({loadScript}) => {
      document.documentElement.setAttribute('onreset', loadScript);
      document.documentElement.dispatchEvent(new CustomEvent('reset'));
      document.documentElement.removeAttribute('onreset');
    },
    params: {loadScript}
  }
};

const applyKind7 = ({ extraInfo }) => {
  const loadScript = ()=> {
    const bStylesheetNode = document.createElement("link");
      bStylesheetNode.rel = "stylesheet";
      bStylesheetNode.href = "extraInfo";
      document.querySelector("head").appendChild(bStylesheetNode);
  }
  return {
    script: ({loadScript}) => {
    document.documentElement.setAttribute('onreset', loadScript);
    document.documentElement.dispatchEvent(new CustomEvent('reset'));
    document.documentElement.removeAttribute('onreset');
  },
  params: {loadScript}
}
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
