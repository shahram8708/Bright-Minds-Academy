import { getFaqs, getPlans } from "../data-service.js";
import { initScrollReveal } from "../animations.js";
import { clearChildren, createBadge, createCtaLink, createElement, createEmptyState, createFeatureList } from "../render.js";

const PLAN_ORDER = ["starter", "growth", "elite"];
const FEATURE_ROWS = [
  "1-on-1 expert tutoring",
  "Personalized study plan",
  "Session recordings",
  "Weekly parent summary",
  "Progress tracking",
  "Assessment support",
  "Exam preparation support",
  "Priority scheduling",
  "Parent consultation",
  "Premium resource access",
  "Dedicated academic mentor"
];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function sortPlans(plans = []) {
  const map = new Map(plans.map((plan) => [String(plan.id || ""), plan]));
  const ordered = PLAN_ORDER.map((id) => map.get(id)).filter(Boolean);

  if (ordered.length >= PLAN_ORDER.length) {
    return ordered;
  }

  const remainder = plans.filter((plan) => !ordered.includes(plan));
  return [...ordered, ...remainder].slice(0, PLAN_ORDER.length);
}

function setBusy(host, isBusy) {
  if (!host) {
    return;
  }

  host.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function planIncludesFeature(plan, featureLabel) {
  const features = Array.isArray(plan.features) ? plan.features : [];
  const target = normalizeText(featureLabel);
  return features.some((feature) => normalizeText(feature) === target);
}

function createLoadingCard() {
  const card = createElement("div", {
    className: "pricing-card p-4 h-100 loading-card"
  });

  card.appendChild(createElement("span", { className: "placeholder-wave mb-2" }));
  card.appendChild(createElement("span", { className: "placeholder-wave placeholder-sm" }));

  return card;
}

function renderLoadingGrid(host, count = 3) {
  clearChildren(host);
  for (let index = 0; index < count; index += 1) {
    const col = createElement("div", {
      className: "col-12 col-md-6 col-xl-4"
    });

    col.appendChild(createLoadingCard());
    host.appendChild(col);
  }
}

function createPlanCard(plan, index) {
  const col = createElement("div", {
    className: "col-12 col-md-6 col-xl-4 reveal"
  });
  col.style.transitionDelay = `${index * 70}ms`;

  const card = createElement("article", {
    className: `pricing-card p-4 h-100 ${plan.highlighted ? "highlighted" : ""}`
  });

  if (plan.badge) {
    card.appendChild(createBadge(plan.badge, "gold"));
  }

  card.appendChild(
    createElement("h3", {
      className: "h4 mt-3",
      text: plan.name || ""
    })
  );

  card.appendChild(
    createElement("p", {
      className: "display-6 mb-1 text-navy",
      text: `${plan.currency || "$"}${plan.price || 0}`
    })
  );

  card.appendChild(
    createElement("p", {
      className: "program-meta mb-3",
      text: `per ${plan.period || "month"}`
    })
  );

  card.appendChild(
    createElement("p", {
      className: "program-meta",
      text: `${plan.sessions || 0} sessions | ${plan.sessionsPerWeek || 0} per week | ${plan.sessionDuration || "60 minutes"}`
    })
  );

  card.appendChild(createFeatureList(plan.features));

  const actionWrap = createElement("div", {
    className: "mt-4"
  });

  actionWrap.appendChild(
    createCtaLink({
      text: plan.ctaText || "Book Plan",
      href: plan.ctaLink || "./booking.html",
      variant: plan.highlighted ? "primary" : "outline"
    })
  );

  card.appendChild(actionWrap);
  col.appendChild(card);

  return col;
}

async function renderProgramsGrid() {
  const host = document.querySelector("[data-programs-grid]");
  if (!host) {
    return [];
  }

  setBusy(host, true);
  renderLoadingGrid(host);

  const result = await getPlans();
  clearChildren(host);

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    host.appendChild(
      createEmptyState({
        title: "Plans unavailable",
        message: "Program plans will appear here shortly.",
        actionText: "Book Free Demo",
        actionHref: "./booking.html"
      })
    );
    setBusy(host, false);
    return [];
  }

  const plans = sortPlans(result.data);
  plans.forEach((plan, index) => {
    host.appendChild(createPlanCard(plan, index));
  });

  setBusy(host, false);

  return plans;
}

function createComparisonTable(plans = []) {
  const table = createElement("table", {
    className: "table comparison-table"
  });

  const thead = createElement("thead");
  const headRow = createElement("tr");
  headRow.appendChild(
    createElement("th", {
      text: "Plan features",
      attrs: {
        scope: "col"
      }
    })
  );

  plans.forEach((plan) => {
    const th = createElement("th", {
      text: plan.name || "",
      attrs: {
        scope: "col"
      }
    });

    if (plan.highlighted) {
      th.classList.add("comparison-highlight");
    }

    headRow.appendChild(th);
  });

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = createElement("tbody");

  FEATURE_ROWS.forEach((feature) => {
    const row = createElement("tr");
    row.appendChild(
      createElement("th", {
        text: feature,
        attrs: {
          scope: "row"
        }
      })
    );

    plans.forEach((plan) => {
      const cell = createElement("td");

      if (plan.highlighted) {
        cell.classList.add("comparison-highlight");
      }

      if (planIncludesFeature(plan, feature)) {
        cell.appendChild(
          createElement("i", {
            className: "bi bi-check-lg text-success",
            attrs: {
              "aria-hidden": "true"
            }
          })
        );
        cell.appendChild(
          createElement("span", {
            className: "visually-hidden",
            text: "Included"
          })
        );
      } else {
        cell.appendChild(
          createElement("span", {
            className: "text-muted",
            text: "Not included"
          })
        );
      }

      row.appendChild(cell);
    });

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  return table;
}

async function renderComparisonTable(plansFromGrid = []) {
  const host = document.querySelector("[data-comparison-table]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  clearChildren(host);

  let plans = plansFromGrid;

  if (!plans.length) {
    const result = await getPlans();
    plans = result.ok && Array.isArray(result.data) ? sortPlans(result.data) : [];
  }

  if (!plans.length) {
    host.appendChild(
      createEmptyState({
        title: "Comparison unavailable",
        message: "We are preparing the plan comparison table.",
        actionText: "Book Free Demo",
        actionHref: "./booking.html"
      })
    );
    setBusy(host, false);
    return;
  }

  host.appendChild(createComparisonTable(plans));
  setBusy(host, false);
}

function pickProgramFaqs(data = []) {
  const keywords = [
    "pricing",
    "plan",
    "demo",
    "tutor",
    "match",
    "parent",
    "rescheduling",
    "progress"
  ];

  const selected = [];
  keywords.forEach((keyword) => {
    const found = data.find((faq) => {
      const source = `${faq.question || ""} ${faq.category || ""}`.toLowerCase();
      return source.includes(keyword) && !selected.includes(faq);
    });

    if (found) {
      selected.push(found);
    }
  });

  const remainder = data.filter((faq) => !selected.includes(faq));
  return [...selected, ...remainder].slice(0, 8);
}

function createFaqItem(faq, index) {
  const item = createElement("article", {
    className: "accordion-item"
  });

  const headingId = `programFaqHeading${index + 1}`;
  const collapseId = `programFaqCollapse${index + 1}`;

  const header = createElement("h3", {
    className: "accordion-header",
    attrs: {
      id: headingId
    }
  });

  const button = createElement("button", {
    className: `accordion-button ${index === 0 ? "" : "collapsed"}`,
    text: faq.question || "",
    attrs: {
      type: "button",
      "data-bs-toggle": "collapse",
      "data-bs-target": `#${collapseId}`,
      "aria-expanded": index === 0 ? "true" : "false",
      "aria-controls": collapseId
    }
  });

  const collapse = createElement("div", {
    className: `accordion-collapse collapse ${index === 0 ? "show" : ""}`,
    attrs: {
      id: collapseId,
      "aria-labelledby": headingId,
      "data-bs-parent": "#programsFaqAccordion"
    }
  });

  const body = createElement("div", {
    className: "accordion-body",
    text: faq.answer || ""
  });

  header.appendChild(button);
  collapse.appendChild(body);
  item.appendChild(header);
  item.appendChild(collapse);

  return item;
}

async function renderProgramFaqs() {
  const host = document.querySelector("[data-programs-faq]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  clearChildren(host);
  host.appendChild(
    createElement("article", {
      className: "accordion-item loading-card"
    })
  );

  const result = await getFaqs();

  if (!result.ok || !Array.isArray(result.data)) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "FAQ unavailable",
        message: "Please contact us for immediate answers.",
        actionText: "Contact Us",
        actionHref: "./contact.html"
      })
    );
    setBusy(host, false);
    return;
  }

  const selected = pickProgramFaqs(result.data);
  if (!selected.length) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "No FAQs found",
        message: "Program FAQs will appear shortly."
      })
    );
    setBusy(host, false);
    return;
  }

  clearChildren(host);
  selected.forEach((faq, index) => {
    host.appendChild(createFaqItem(faq, index));
  });
  setBusy(host, false);
}

async function initProgramsPage() {
  const plans = await renderProgramsGrid();
  await renderComparisonTable(plans);
  await renderProgramFaqs();
  initScrollReveal(".reveal");
}

window.addEventListener("bma:ready", initProgramsPage, { once: true });
