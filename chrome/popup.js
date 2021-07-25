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

  container.innerHTML = Object.entries(elements)
    .map(
      ([pagename]) =>
        `<div class='page'>${pagename}<div class='align-right'><button>🖉</button><button>🗑</button></div></div>`
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
  const newElements = { ...currentElements, [form.pagename.value]: [] };

  await saveElements(newElements);
  updateViewElements();
});
