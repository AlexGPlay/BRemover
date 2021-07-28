const getElements = () =>
  new Promise((resolve) =>
    chrome.storage.sync.get(["elements"], (elementsHash) => resolve(elementsHash.elements || {}))
  );

const saveElements = (elements) =>
  new Promise((resolve) => chrome.storage.sync.set({ elements }, () => resolve()));

const removeItems = async (evt) => {
  const key = evt.target.dataset.key;
  const elements = await getElements();
  const newElements = Object.fromEntries(
    Object.entries(elements).filter(([elemKey]) => elemKey !== key)
  );

  await saveElements(newElements);
  updateViewElements();
};

const removeRule = async (evt) => {
  const domain = evt.target.dataset.domain;
  const rule = evt.target.dataset.id;

  const elements = await getElements();
  const rules = elements[domain];
  rules.splice(rule, 1);

  const newElements = { ...elements, [domain]: rules };
  saveElements(newElements);
  openEditView({ target: { dataset: { key: domain } } });
};

const openEditView = async (evt) => {
  const domain = evt.target.dataset.key;
  const domainData = (await getElements())[domain];

  const toShowData = domainData
    .map(
      (data, idx) =>
        `<tr><td>${data.kind}</td><td>${data.selector || ""}</td><td>${
          data.extraInfo || ""
        }</td><td><button data-remove-rule data-id='${idx}' data-domain='${domain}'>🗑</button></td></tr>`
    )
    .join("");

  document.getElementById("newRulesForm").dataset.domain = domain;
  document.getElementById("editHeader").innerHTML = domain;
  document.getElementById("main").classList.add("hidden");
  document.getElementById("edit").classList.remove("hidden");
  document.getElementById("currentRules").innerHTML = `
    <table>
      <thead>
        <tr>
          <td>Kind</td>
          <td>Selector</td>
          <td>Extra Info</td>
        </tr>
      </thead>
      <tbody>
        ${toShowData}
      </tbody>
    </table>`;

  document
    .querySelectorAll("button[data-remove-rule]")
    .forEach((button) => button.removeEventListener("click", removeRule));
  document
    .querySelectorAll("button[data-remove-rule]")
    .forEach((button) => button.addEventListener("click", removeRule));
};

const updateViewElements = async () => {
  const elements = await getElements();
  const container = document.getElementById("content");

  container.innerHTML = Object.entries(elements)
    .map(
      ([pagename]) =>
        `<div class='page'>
        ${pagename}
          <div class='align-right'>
            <button data-edit data-key='${pagename}'>🖉</button>
            <button data-remove data-key='${pagename}'>🗑</button>
          </div>
        </div>`
    )
    .join("");

  document.querySelectorAll("button[data-remove]").forEach((elem) => {
    elem.removeEventListener("click", removeItems);
    elem.addEventListener("click", removeItems);
  });

  document.querySelectorAll("button[data-edit]").forEach((elem) => {
    elem.removeEventListener("click", openEditView);
    elem.addEventListener("click", openEditView);
  });
};

updateViewElements();

document.getElementById("newDomainsForm").addEventListener("submit", async (evt) => {
  evt.preventDefault();
  const form = evt.target;

  const currentElements = await getElements();
  const newElements = { ...currentElements, [form.pagename.value]: [] };

  await saveElements(newElements);
  updateViewElements();
});

document.getElementById("ruleType").addEventListener("change", (evt) => {
  const select = evt.target;
  const selectedOption = select.options[select.selectedIndex];

  const toUseText = selectedOption.dataset.extra;
  const neededFields = selectedOption.dataset.fields.split(";");

  const fields = ["selector", "extraInfo"];

  for (const field of fields) {
    const elem = document.getElementById(field);
    const elemLabel = document.querySelector(`label[for='${field}']`);

    if (neededFields.includes(field)) {
      elem.classList.remove("hidden");
      elemLabel.classList.remove("hidden");
    } else {
      elem.classList.add("hidden");
      elemLabel.classList.add("hidden");
    }
  }

  if (toUseText) document.querySelector("label[for='extraInfo']").innerHTML = toUseText;
});

document.getElementById("newRulesForm").addEventListener("submit", async (evt) => {
  const select = evt.target["ruleType"];
  const needsSelector = select.options[select.selectedIndex].dataset.fields
    .split(";")
    .includes("selector");

  const needsExtra = select.options[select.selectedIndex].dataset.fields
    .split(";")
    .includes("extraInfo");

  const data = {
    kind: evt.target["ruleType"].value,
    selector: needsSelector ? evt.target["selector"].value : null,
    extraInfo: needsExtra ? evt.target["extraInfo"].value : null,
  };

  if (!data.kind || (needsSelector && !data.selector) || (needsExtra && !data.extraInfo)) return;

  const elements = await getElements();
  const newElements = {
    ...elements,
    [evt.target.dataset.domain]: [...elements[evt.target.dataset.domain], data],
  };

  saveElements(newElements);
});

document.getElementById("settingsBtn").addEventListener("click", async () => {
  document.getElementById("main").classList.add("hidden");
  document.getElementById("edit").classList.add("hidden");
  document.getElementById("settings").classList.remove("hidden");

  const elements = await getElements();
  const data = Object.keys(elements)
    .map(
      (element) =>
        `<div class="settingsRule"><input id="${element}" type="checkbox"/><label class="settingsLabel" for="${element}">${element}</label></div>`
    )
    .join("");

  document.getElementById("domainsSettingsList").innerHTML = data;
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  const domains = [...document.querySelectorAll("#settings input[type='checkbox']:checked")].map(
    (input) => input.id
  );

  const elements = await getElements();
  const neededRules = domains.reduce((acc, cur) => ({ ...acc, [cur]: elements[cur] }), {});

  const url = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(neededRules))}`;
  const filename = "BRemover-rules.json";

  chrome.downloads.download({ url, filename });
});

document
  .getElementById("importBtn")
  .addEventListener("click", () => document.getElementById("importFile").click());

document.getElementById("importFile").addEventListener("change", async (evt) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const jsonData = JSON.parse(e.target.result);
    const currentElements = await getElements();
    Object.keys(jsonData).forEach((key) =>
      currentElements[key]
        ? (currentElements[key] = [...currentElements[key], ...jsonData[key]])
        : (currentElements[key] = jsonData[key])
    );
    await saveElements(currentElements);
    document.getElementById("settingsBtn").click();
  };
  reader.readAsText(evt.target.files[0]);
});
