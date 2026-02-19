// ---- Glass dropdowns ----
function customHostFor(select) {
  if (!select || !select.parentElement) return null;
  return select.parentElement.querySelector(`.glassSelect[data-for="${select.id}"]`);
}

function closeCustomSelects(except = null) {
  document.querySelectorAll(".glassSelect.open").forEach((host) => {
    if (host !== except) host.classList.remove("open");
  });
}

function syncCustomSelect(select) {
  const host = customHostFor(select);
  if (!host) return;

  const valueEl = host.querySelector(".glassSelectValue");
  const trigger = host.querySelector(".glassSelectTrigger");
  const selected = select.selectedOptions?.[0] || select.options[0];

  valueEl.textContent = selected ? selected.textContent : t("choose");
  trigger.disabled = select.disabled || select.options.length === 0;

  host.querySelectorAll(".glassSelectItem").forEach((item) => {
    item.classList.toggle("selected", item.dataset.value === select.value);
  });
}

function renderCustomSelect(select) {
  if (!select || !select.id) return;
  select.classList.add("nativeSelect");

  let host = customHostFor(select);
  if (!host) {
    host = document.createElement("div");
    host.className = "glassSelect";
    host.dataset.for = select.id;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "glassSelectTrigger";

    const value = document.createElement("span");
    value.className = "glassSelectValue";

    const arrow = document.createElement("span");
    arrow.className = "glassSelectArrow";
    arrow.setAttribute("aria-hidden", "true");

    trigger.appendChild(value);
    trigger.appendChild(arrow);

    const menu = document.createElement("div");
    menu.className = "glassSelectMenu";

    host.appendChild(trigger);
    host.appendChild(menu);
    select.insertAdjacentElement("afterend", host);
  }

  const menu = host.querySelector(".glassSelectMenu");
  menu.innerHTML = "";

  for (const option of Array.from(select.options)) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "glassSelectItem";
    item.dataset.value = option.value;
    item.textContent = option.textContent;
    item.disabled = !!option.disabled;

    if (option.disabled) item.classList.add("disabled");
    if (option.value === select.value) item.classList.add("selected");

    item.onclick = () => {
      if (option.disabled) return;
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncCustomSelect(select);
      closeCustomSelects();
    };

    menu.appendChild(item);
  }

  if (!host.dataset.bound) {
    const trigger = host.querySelector(".glassSelectTrigger");

    trigger.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const opening = !host.classList.contains("open");
      closeCustomSelects(host);
      host.classList.toggle("open", opening);
    });

    trigger.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " " || ev.key === "ArrowDown") {
        ev.preventDefault();
        closeCustomSelects(host);
        host.classList.add("open");
      } else if (ev.key === "Escape") {
        host.classList.remove("open");
      }
    });

    host.dataset.bound = "1";
  }

  if (!select.dataset.customBound) {
    select.addEventListener("change", () => syncCustomSelect(select));
    select.dataset.customBound = "1";
  }

  syncCustomSelect(select);
}

function renderCustomSelects() {
  managedSelects.forEach((select) => renderCustomSelect(select));
}

document.addEventListener("click", (ev) => {
  if (ev.target.closest(".glassSelect")) return;
  closeCustomSelects();
});

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") closeCustomSelects();
});
