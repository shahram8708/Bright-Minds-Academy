import { getStats } from "../data-service.js";
import { initCounters, initScrollReveal } from "../animations.js";
import { clearChildren, createElement, createEmptyState } from "../render.js";

function setBusy(host, isBusy) {
  if (!host) {
    return;
  }

  host.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function createLoadingCard() {
  const card = createElement("div", {
    className: "stat-counter-card loading-card h-100"
  });

  card.appendChild(createElement("span", { className: "placeholder-wave mb-2" }));
  card.appendChild(createElement("span", { className: "placeholder-wave placeholder-sm" }));

  return card;
}

function renderLoadingStats(host, count = 4) {
  clearChildren(host);

  for (let index = 0; index < count; index += 1) {
    const col = createElement("div", {
      className: "col-12 col-sm-6 col-lg-3"
    });

    col.appendChild(createLoadingCard());
    host.appendChild(col);
  }
}

function createStatCard(stat, index) {
  const col = createElement("div", {
    className: "col-12 col-sm-6 col-lg-4 reveal"
  });
  col.style.transitionDelay = `${index * 70}ms`;

  const card = createElement("article", {
    className: "stat-counter-card h-100"
  });

  const valueText = stat.value || `${stat.prefix || ""}${stat.numericValue || 0}${stat.suffix || ""}`;
  const value = createElement("div", {
    className: "stat-counter-value",
    text: valueText,
    attrs: {
      "data-counter": "",
      "data-counter-target": Number(stat.numericValue || 0),
      "data-counter-prefix": stat.prefix || "",
      "data-counter-suffix": stat.suffix || ""
    }
  });

  card.appendChild(value);
  card.appendChild(
    createElement("p", {
      className: "mb-1 fw-semibold",
      text: stat.label || ""
    })
  );
  card.appendChild(
    createElement("p", {
      className: "small text-muted mb-0",
      text: stat.description || ""
    })
  );

  col.appendChild(card);
  return col;
}

async function renderStats() {
  const host = document.querySelector("[data-about-stats]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  renderLoadingStats(host, 4);

  const result = await getStats();

  if (!result.ok || !Array.isArray(result.data)) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "Stats unavailable",
        message: "Trust metrics will appear shortly.",
        actionText: "View Programs",
        actionHref: "./programs.html"
      })
    );
    setBusy(host, false);
    return;
  }

  const stats = result.data.slice(0, 6);
  clearChildren(host);

  if (!stats.length) {
    host.appendChild(
      createEmptyState({
        title: "No stats available",
        message: "Check back soon for updated academy metrics."
      })
    );
    setBusy(host, false);
    return;
  }

  stats.forEach((stat, index) => {
    host.appendChild(createStatCard(stat, index));
  });

  setBusy(host, false);
  initCounters();
}

async function initAboutPage() {
  await renderStats();
  initScrollReveal(".reveal");
}

window.addEventListener("bma:ready", initAboutPage, { once: true });
