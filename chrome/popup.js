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

const updateViewElements = async () => {
  const elements = await getElements();
  const container = document.getElementById("content");

  console.log(elements);

  container.innerHTML = Object.entries(elements)
    .map(
      ([pagename, rules]) =>
        `<div style='display: flex; align-items: center;'><p style='margin: 5px 0;'>${pagename};${rules}</p><button data-remove data-key='${pagename}' style='margin-left: auto; height: 20px'>x</button></div>`
    )
    .join("");

  document.querySelectorAll("button[data-remove]").forEach((elem) => {
    elem.removeEventListener("click", removeItems);
    elem.addEventListener("click", removeItems);
  });
};

updateViewElements();

document.getElementById("newRulesForm").addEventListener("submit", async (evt) => {
  evt.preventDefault();
  const form = evt.target;

  const currentElements = await getElements();
  const newElements = { ...currentElements, [form.pagename.value]: form.rules.value };

  console.log("elements", newElements);

  await saveElements(newElements);
  updateViewElements();
});
