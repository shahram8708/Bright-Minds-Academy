import { getFaqs } from "../data-service.js";
import { initScrollReveal } from "../animations.js";
import { clearChildren, createElement, createEmptyState } from "../render.js";

const CATEGORY_ALIASES = new Map([
  ["demo class", "Demo Class"],
  ["pricing", "Pricing & Plans"],
  ["plan selection", "Pricing & Plans"],
  ["refunds", "Pricing & Plans"],
  ["tutors", "Tutor Quality"],
  ["tutor matching", "Tutor Quality"],
  ["session format", "Session Format"],
  ["progress tracking", "Progress Tracking"],
  ["scheduling", "Scheduling"],
  ["rescheduling", "Scheduling"],
  ["parent communication", "Parent Updates"],
  ["dashboard", "Dashboard & App Access"],
  ["mobile app", "Dashboard & App Access"],
  ["contact", "Privacy & Contact"],
  ["online learning", "Online Learning"]
]);

const CATEGORY_ORDER = [
  "Demo Class",
  "Pricing & Plans",
  "Tutor Quality",
  "Session Format",
  "Progress Tracking",
  "Scheduling",
  "Parent Updates",
  "Dashboard & App Access",
  "Online Learning",
  "Privacy & Contact",
  "Other"
];

const CATEGORY_DESCRIPTIONS = {
  "Demo Class": "What to expect during the first session and tutor match review.",
  "Pricing & Plans": "Plan structure, pricing clarity, and what is included.",
  "Tutor Quality": "How we vet and match expert tutors for each learner.",
  "Session Format": "Session flow, format details, and tutoring structure.",
  "Progress Tracking": "How we measure and communicate student progress.",
  "Scheduling": "Timings, rescheduling expectations, and routine planning.",
  "Parent Updates": "Parent visibility and weekly communication details.",
  "Dashboard & App Access": "Dashboard access and mobile support options.",
  "Online Learning": "Technology requirements for online tutoring.",
  "Privacy & Contact": "How to reach us for support and privacy questions.",
  "Other": "Additional questions families ask before enrollment."
};

let cachedFaqs = [];

function setBusy(host, isBusy) {
  if (!host) {
    return;
  }

  host.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function toKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function resolveCategory(value) {
  const key = toKey(value);
  return CATEGORY_ALIASES.get(key) || (value ? String(value).trim() : "Other");
}

function createLoadingCard() {
  const card = createElement("div", {
    className: "faq-category-card loading-card"
  });

  card.appendChild(createElement("span", { className: "placeholder-wave mb-2" }));
  card.appendChild(createElement("span", { className: "placeholder-wave placeholder-sm" }));

  return card;
}

function renderLoading(host, count = 3) {
  clearChildren(host);
  for (let index = 0; index < count; index += 1) {
    host.appendChild(createLoadingCard());
  }
}

function buildGroups(faqs) {
  const groups = new Map();

  faqs.forEach((faq) => {
    const label = resolveCategory(faq.category);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label).push(faq);
  });

  const ordered = [];
  CATEGORY_ORDER.forEach((label) => {
    if (groups.has(label)) {
      ordered.push({ label, items: groups.get(label) });
      groups.delete(label);
    }
  });

  groups.forEach((items, label) => {
    ordered.push({ label, items });
  });

  return ordered;
}

function createAccordionItem(faq, index, accordionId) {
  const itemId = `${accordionId}-item-${index}`;

  const item = createElement("article", {
    className: "accordion-item"
  });

  const header = createElement("h3", {
    className: "accordion-header",
    attrs: {
      id: `${itemId}-heading`
    }
  });

  const button = createElement("button", {
    className: "accordion-button collapsed",
    text: faq.question || "",
    attrs: {
      type: "button",
      "data-bs-toggle": "collapse",
      "data-bs-target": `#${itemId}-collapse`,
      "aria-expanded": "false",
      "aria-controls": `${itemId}-collapse`
    }
  });

  header.appendChild(button);

  const collapse = createElement("div", {
    className: "accordion-collapse collapse",
    attrs: {
      id: `${itemId}-collapse`,
      "aria-labelledby": `${itemId}-heading`,
      "data-bs-parent": `#${accordionId}-accordion`
    }
  });

  const body = createElement("div", {
    className: "accordion-body",
    text: faq.answer || ""
  });

  collapse.appendChild(body);
  item.appendChild(header);
  item.appendChild(collapse);

  return item;
}

function createCategoryCard(group, index) {
  const categoryId = `faq-${toKey(group.label).replace(/[^a-z0-9]+/g, "-") || "group"}`;

  const card = createElement("article", {
    className: "faq-category-card reveal"
  });
  card.style.transitionDelay = `${index * 70}ms`;

  const header = createElement("div", {
    className: "faq-category-header"
  });

  const titleWrap = createElement("div");
  titleWrap.appendChild(
    createElement("h3", {
      className: "h5 mb-1",
      text: group.label
    })
  );
  titleWrap.appendChild(
    createElement("p", {
      className: "faq-category-description",
      text: CATEGORY_DESCRIPTIONS[group.label] || CATEGORY_DESCRIPTIONS.Other
    })
  );

  const badge = createElement("span", {
    className: "component-badge component-badge-gold faq-category-badge",
    text: `${group.items.length} answers`
  });

  header.appendChild(titleWrap);
  header.appendChild(badge);

  const accordion = createElement("div", {
    className: "accordion",
    attrs: {
      id: `${categoryId}-accordion`
    }
  });

  group.items.forEach((faq, faqIndex) => {
    accordion.appendChild(createAccordionItem(faq, faqIndex, categoryId));
  });

  card.appendChild(header);
  card.appendChild(accordion);

  return card;
}

function updateStatus(message) {
  const status = document.querySelector("[data-faq-status]");
  if (status) {
    status.textContent = message;
  }
}

function matchesQuery(faq, query) {
  if (!query) {
    return true;
  }

  const haystack = [faq.question, faq.answer, faq.category]
    .map((value) => toKey(value))
    .join(" ");

  return haystack.includes(query);
}

function renderFaqs(host, faqs, query) {
  const normalizedQuery = toKey(query);
  const filtered = faqs.filter((faq) => matchesQuery(faq, normalizedQuery));
  const groups = buildGroups(filtered);

  clearChildren(host);

  if (!filtered.length) {
    host.appendChild(
      createEmptyState({
        title: "No matching answers",
        message: "Try another keyword or clear the search to view all questions.",
        actionText: "Book Free Demo",
        actionHref: "./booking.html"
      })
    );
    updateStatus("No matches found. Try a different keyword.");
    setBusy(host, false);
    return;
  }

  groups.forEach((group, index) => {
    host.appendChild(createCategoryCard(group, index));
  });

  updateStatus(`Showing ${filtered.length} questions across ${groups.length} categories.`);
  setBusy(host, false);
  initScrollReveal(".reveal");
}

function bindSearch(host) {
  const input = document.querySelector("[data-faq-search]");
  const clearButton = document.querySelector("[data-faq-clear]");

  if (!input) {
    return;
  }

  const handleSearch = () => {
    renderFaqs(host, cachedFaqs, input.value || "");
  };

  input.addEventListener("input", handleSearch);

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      input.value = "";
      input.focus();
      handleSearch();
    });
  }
}

async function initFaqPage() {
  const host = document.querySelector("[data-faq-categories]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  renderLoading(host, 3);

  const result = await getFaqs();

  if (!result.ok || !Array.isArray(result.data)) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "FAQs unavailable",
        message: "We are refreshing answers for you. Please check back shortly.",
        actionText: "Contact Us",
        actionHref: "./contact.html"
      })
    );
    updateStatus("FAQ content is unavailable right now.");
    setBusy(host, false);
    return;
  }

  cachedFaqs = result.data;
  renderFaqs(host, cachedFaqs, "");
  bindSearch(host);
}

window.addEventListener("bma:ready", initFaqPage, { once: true });
