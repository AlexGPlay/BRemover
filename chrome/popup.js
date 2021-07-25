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

const openEditView = async (evt) => {
  const domain = evt.target.dataset.key;
  const domainData = (await getElements())[domain];

  document.getElementById("editHeader").innerHTML = domain;
  document.getElementById("main").classList.add("hidden");
  document.getElementById("edit").classList.remove("hidden");
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
