import { getFaqs, getPlans, getStats, getSteps, getSubjects, getSuccessStories, getTestimonials } from "../data-service.js";
import { initCounters, initProgressAnimations, initScrollReveal } from "../animations.js";
import { clearChildren, createBadge, createElement, createEmptyState, createFeatureList, renderStars } from "../render.js";

const REQUIRED_SUBJECTS = [
  "mathematics",
  "science",
  "english",
  "physics",
  "chemistry",
  "biology",
  "commerce",
  "history",
  "computer science"
];

const PLAN_ORDER = ["starter", "growth", "elite"];

const PLAN_LINK_MAP = {
  starter: "./booking.html?plan=starter",
  growth: "./booking.html?plan=growth",
  elite: "./booking.html?plan=elite"
};

const HOME_SECTION_IDS = ["home", "about", "how-it-works", "subjects", "pricing", "results", "testimonials", "faq", "contact"];

function isReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setBusy(host, isBusy) {
  if (!host) {
    return;
  }

  host.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function renderFallbackState(host, config) {
  if (!host) {
    return;
  }

  clearChildren(host);
  host.appendChild(createEmptyState(config));
  setBusy(host, false);
}

function createLoadingCard(cardClass = "placeholder-panel") {
  const card = createElement("div", {
    className: `${cardClass} loading-card p-4 h-100`
  });

  card.appendChild(
    createElement("span", {
      className: "placeholder-wave mb-2"
    })
  );

  card.appendChild(
    createElement("span", {
      className: "placeholder-wave placeholder-sm"
    })
  );

  return card;
}

function renderGridLoading(host, options = {}) {
  if (!host) {
    return;
  }

  const count = Number(options.count || 3);
  const colClass = options.colClass || "col-12 col-md-6 col-lg-4";
  const cardClass = options.cardClass || "placeholder-panel";

  clearChildren(host);
  for (let index = 0; index < count; index += 1) {
    const col = createElement("div", {
      className: colClass
    });

    col.appendChild(createLoadingCard(cardClass));
    host.appendChild(col);
  }

  setBusy(host, true);
}

function normalizeSubjectName(value) {
  return String(value || "").trim().toLowerCase();
}

function sortSubjects(data = []) {
  const map = new Map(data.map((subject) => [normalizeSubjectName(subject.name), subject]));
  const ordered = REQUIRED_SUBJECTS.map((name) => map.get(name)).filter(Boolean);

  if (ordered.length >= REQUIRED_SUBJECTS.length) {
    return ordered;
  }

  const remainder = data.filter((subject) => !ordered.includes(subject));
  return [...ordered, ...remainder].slice(0, REQUIRED_SUBJECTS.length);
}

function sortPlans(data = []) {
  const byId = new Map(data.map((plan) => [String(plan.id || ""), plan]));
  const ordered = PLAN_ORDER.map((id) => byId.get(id)).filter(Boolean);

  if (ordered.length >= PLAN_ORDER.length) {
    return ordered;
  }

  const remainder = data.filter((plan) => !ordered.includes(plan));
  return [...ordered, ...remainder].slice(0, PLAN_ORDER.length);
}

function mapPlanLink(plan) {
  const fallback = "./booking.html?plan=starter";
  const id = String(plan.id || "");
  return PLAN_LINK_MAP[id] || fallback;
}

function createStatCard(stat, index) {
  const col = createElement("div", {
    className: "col-6 col-lg-3 reveal"
  });

  col.style.transitionDelay = `${index * 70}ms`;

  const card = createElement("article", {
    className: "stat-counter-card p-3 h-100 text-center"
  });

  const value = createElement("p", {
    className: "stat-counter-value mb-1",
    attrs: {
      "data-counter": "true",
      "data-counter-target": String(stat.numericValue || 0),
      "data-counter-suffix": stat.suffix || "",
      "data-counter-prefix": stat.prefix || ""
    },
    text: `${stat.prefix || ""}${stat.numericValue || 0}${stat.suffix || ""}`
  });

  const label = createElement("p", {
    className: "mb-1 text-muted",
    text: stat.label || ""
  });

  const description = createElement("p", {
    className: "small mb-0 text-muted-brand",
    text: stat.description || ""
  });

  card.appendChild(value);
  card.appendChild(label);
  card.appendChild(description);
  col.appendChild(card);

  return col;
}

async function renderStats() {
  const host = document.querySelector("[data-home-stats]");
  if (!host) {
    return;
  }

  renderGridLoading(host, {
    count: 4,
    colClass: "col-6 col-lg-3",
    cardClass: "stat-counter-card"
  });

  const result = await getStats();

  if (!result.ok) {
    renderFallbackState(host, {
      title: "Stats currently unavailable",
      message: "We are refreshing student impact metrics. Please check again shortly.",
      actionText: "Contact Us",
      actionHref: "./contact.html"
    });
    return;
  }

  const data = Array.isArray(result.data) ? result.data : [];
  if (!data.length) {
    renderFallbackState(host, {
      title: "No stats found",
      message: "Student support metrics will appear here soon."
    });
    return;
  }

  const preferredIds = ["students", "countries", "improvement-rate", "experience"];
  const prioritized = preferredIds
    .map((id) => data.find((item) => item.id === id))
    .filter(Boolean);

  const selected = [...prioritized, ...data.filter((item) => !prioritized.includes(item))].slice(0, 4);

  clearChildren(host);
  selected.forEach((stat, index) => {
    host.appendChild(createStatCard(stat, index));
  });
  setBusy(host, false);
}

function createStepCard(step, index) {
  const col = createElement("div", {
    className: "col-12 col-md-6 col-lg reveal"
  });
  col.style.transitionDelay = `${index * 90}ms`;

  const card = createElement("article", {
    className: "step-card p-4 h-100"
  });

  const top = createElement("div", {
    className: "d-flex align-items-center justify-content-between mb-3"
  });

  const orderLabel = createBadge(`Step ${String(step.order || index + 1).padStart(2, "0")}`, "gold");
  orderLabel.classList.add("step-number-badge");

  const iconWrap = createElement("div", {
    className: "step-icon",
    attrs: {
      "aria-hidden": "true"
    }
  });

  iconWrap.appendChild(
    createElement("i", {
      className: `bi ${step.icon || "bi-check2-circle"}`,
      attrs: {
        "aria-hidden": "true"
      }
    })
  );

  top.appendChild(orderLabel);
  top.appendChild(iconWrap);

  card.appendChild(top);
  card.appendChild(
    createElement("h3", {
      className: "h5 mb-2",
      text: step.title || ""
    })
  );
  card.appendChild(
    createElement("p", {
      className: "mb-0",
      text: step.description || ""
    })
  );

  col.appendChild(card);
  return col;
}

async function renderSteps() {
  const host = document.querySelector("[data-steps-grid]");
  if (!host) {
    return;
  }

  renderGridLoading(host, {
    count: 5,
    colClass: "col-12 col-md-6 col-lg",
    cardClass: "step-card"
  });

  const result = await getSteps();

  if (!result.ok) {
    renderFallbackState(host, {
      title: "Process unavailable",
      message: "Unable to load the tutoring onboarding flow right now.",
      actionText: "Book Free Demo",
      actionHref: "./booking.html"
    });
    return;
  }

  const data = Array.isArray(result.data) ? result.data : [];
  if (!data.length) {
    renderFallbackState(host, {
      title: "No steps available",
      message: "The onboarding sequence will be published shortly."
    });
    return;
  }

  const ordered = [...data].sort((a, b) => Number(a.order || 0) - Number(b.order || 0)).slice(0, 5);

  clearChildren(host);
  ordered.forEach((step, index) => {
    host.appendChild(createStepCard(step, index));
  });
  setBusy(host, false);
}

function createSubjectCard(subject, index) {
  const col = createElement("div", {
    className: "col-12 col-md-6 col-lg-4 reveal"
  });
  col.style.transitionDelay = `${index * 60}ms`;

  const card = createElement("article", {
    className: "subject-card p-4 h-100"
  });

  const headingWrap = createElement("div", {
    className: "d-flex align-items-center gap-2 mb-3"
  });

  const iconWrap = createElement("div", {
    className: "subject-card-icon",
    attrs: {
      "aria-hidden": "true"
    }
  });

  iconWrap.appendChild(
    createElement("i", {
      className: `bi ${subject.icon || "bi-book"}`,
      attrs: {
        "aria-hidden": "true"
      }
    })
  );

  headingWrap.appendChild(iconWrap);
  headingWrap.appendChild(
    createElement("h3", {
      className: "h5 mb-0",
      text: subject.name || ""
    })
  );

  card.appendChild(headingWrap);
  card.appendChild(
    createElement("p", {
      className: "small text-muted mb-2",
      text: subject.gradeRange || ""
    })
  );
  card.appendChild(
    createElement("p", {
      className: "mb-3",
      text: subject.shortDescription || ""
    })
  );

  const actionButton = createElement("button", {
    className: "btn btn-sm btn-brand-outline w-100",
    text: "Inquire for this subject",
    attrs: {
      type: "button",
      "data-open-demo-modal": "true",
      "data-selected-subject": subject.name || "",
      "data-lead-source": "subject-card"
    }
  });

  card.appendChild(actionButton);
  col.appendChild(card);
  return col;
}

async function renderSubjects() {
  const host = document.querySelector("[data-subjects-grid]");
  if (!host) {
    return;
  }

  renderGridLoading(host, {
    count: 6,
    colClass: "col-12 col-md-6 col-lg-4",
    cardClass: "subject-card"
  });

  const result = await getSubjects();

  if (!result.ok) {
    renderFallbackState(host, {
      title: "Subjects unavailable",
      message: "We are unable to load subjects at the moment.",
      actionText: "Contact Us",
      actionHref: "./contact.html"
    });
    return;
  }

  const data = Array.isArray(result.data) ? result.data : [];
  if (!data.length) {
    renderFallbackState(host, {
      title: "No subjects found",
      message: "Subject offerings will be updated shortly."
    });
    return;
  }

  const selected = sortSubjects(data).slice(0, 9);

  clearChildren(host);
  selected.forEach((subject, index) => {
    host.appendChild(createSubjectCard(subject, index));
  });

  setBusy(host, false);
}

function createPlanCard(plan, index) {
  const col = createElement("div", {
    className: "col-12 col-md-6 col-xl-4 reveal"
  });
  col.style.transitionDelay = `${index * 80}ms`;

  const card = createElement("article", {
    className: `pricing-card p-4 h-100 ${plan.highlighted ? "highlighted" : ""}`
  });

  if (plan.badge) {
    card.appendChild(createBadge(plan.badge, "gold"));
  }

  card.appendChild(
    createElement("h3", {
      className: "h4 mt-3 mb-2",
      text: plan.name || ""
    })
  );

  card.appendChild(
    createElement("p", {
      className: "display-price mb-1",
      text: `${plan.currency || "$"}${plan.price || 0}/${plan.period || "month"}`
    })
  );

  card.appendChild(
    createElement("p", {
      className: "price-period mb-2",
      text: `${plan.sessions || 0} sessions`
    })
  );

  card.appendChild(
    createElement("p", {
      className: "program-meta mb-3",
      text: `${plan.sessionsPerWeek || 0} sessions per week | ${plan.sessionDuration || "60 minutes"}`
    })
  );

  card.appendChild(createFeatureList(Array.isArray(plan.features) ? plan.features : []));

  const actionWrap = createElement("div", {
    className: "mt-4"
  });

  actionWrap.appendChild(
    createElement("a", {
      className: `btn w-100 ${plan.highlighted ? "btn-brand-primary" : "btn-brand-outline"}`,
      text: plan.ctaText || "Choose Plan",
      attrs: {
        href: mapPlanLink(plan),
        "aria-label": `${plan.name || "Plan"} booking`
      }
    })
  );

  card.appendChild(actionWrap);
  col.appendChild(card);
  return col;
}

async function renderPlans() {
  const host = document.querySelector("[data-plans-grid]");
  if (!host) {
    return;
  }

  renderGridLoading(host, {
    count: 3,
    colClass: "col-12 col-md-6 col-xl-4",
    cardClass: "pricing-card"
  });

  const result = await getPlans();

  if (!result.ok) {
    renderFallbackState(host, {
      title: "Plans unavailable",
      message: "We are currently unable to load pricing plans.",
      actionText: "Book Demo",
      actionHref: "./booking.html"
    });
    return;
  }

  const data = Array.isArray(result.data) ? result.data : [];
  if (!data.length) {
    renderFallbackState(host, {
      title: "No plans found",
      message: "Pricing details will appear shortly."
    });
    return;
  }

  const plans = sortPlans(data);

  clearChildren(host);
  plans.forEach((plan, index) => {
    host.appendChild(createPlanCard(plan, index));
  });

  setBusy(host, false);
}

function createResultCard(story, index) {
  const card = createElement("article", {
    className: "result-card p-4 reveal"
  });
  card.style.transitionDelay = `${index * 90}ms`;

  const top = createElement("div", {
    className: "d-flex align-items-start justify-content-between gap-2 mb-3"
  });

  const studentWrap = createElement("div", {
    className: "d-flex align-items-center gap-2"
  });

  studentWrap.appendChild(
    createElement("span", {
      className: "result-student-badge",
      text: story.studentInitial || "ST"
    })
  );

  const studentMeta = createElement("div");
  studentMeta.appendChild(
    createElement("p", {
      className: "mb-0 fw-semibold",
      text: story.grade || ""
    })
  );
  studentMeta.appendChild(
    createElement("p", {
      className: "mb-0 small text-muted",
      text: `${story.durationWeeks || 0} weeks`
    })
  );

  studentWrap.appendChild(studentMeta);
  top.appendChild(studentWrap);
  top.appendChild(
    createElement("span", {
      className: "premium-badge",
      text: story.subject || ""
    })
  );

  card.appendChild(top);

  const scoreGrid = createElement("div", {
    className: "score-grid"
  });

  const beforeRow = createElement("div", {
    className: "score-row"
  });
  beforeRow.appendChild(
    createElement("span", {
      className: "score-label",
      text: "Before"
    })
  );
  beforeRow.appendChild(
    createElement("span", {
      className: "score-value",
      attrs: {
        "data-counter": "true",
        "data-counter-target": String(story.beforeScore || 0),
        "data-counter-suffix": "%"
      },
      text: `${story.beforeScore || 0}%`
    })
  );

  const beforeProgress = createElement("div", {
    className: "result-progress"
  });
  beforeProgress.appendChild(
    createElement("span", {
      attrs: {
        "data-progress": String(story.beforeScore || 0)
      }
    })
  );

  const afterRow = createElement("div", {
    className: "score-row"
  });
  afterRow.appendChild(
    createElement("span", {
      className: "score-label",
      text: "After"
    })
  );
  afterRow.appendChild(
    createElement("span", {
      className: "score-value",
      attrs: {
        "data-counter": "true",
        "data-counter-target": String(story.afterScore || 0),
        "data-counter-suffix": "%"
      },
      text: `${story.afterScore || 0}%`
    })
  );

  const afterProgress = createElement("div", {
    className: "result-progress"
  });
  afterProgress.appendChild(
    createElement("span", {
      attrs: {
        "data-progress": String(story.afterScore || 0)
      }
    })
  );

  scoreGrid.appendChild(beforeRow);
  scoreGrid.appendChild(beforeProgress);
  scoreGrid.appendChild(afterRow);
  scoreGrid.appendChild(afterProgress);

  card.appendChild(scoreGrid);
  card.appendChild(
    createElement("p", {
      className: "mb-2 text-muted",
      text: story.outcome || ""
    })
  );
  card.appendChild(
    createElement("p", {
      className: "small mb-0",
      text: `"${story.quote || ""}"`
    })
  );

  return card;
}

async function renderResults() {
  const host = document.querySelector("[data-results-grid]");
  if (!host) {
    return;
  }

  clearChildren(host);
  for (let index = 0; index < 3; index += 1) {
    host.appendChild(createLoadingCard("result-card"));
  }
  setBusy(host, true);

  const result = await getSuccessStories();

  if (!result.ok) {
    renderFallbackState(host, {
      title: "Results unavailable",
      message: "Success stories are being refreshed right now.",
      actionText: "View Programs",
      actionHref: "./programs.html"
    });
    return;
  }

  const data = Array.isArray(result.data) ? result.data : [];
  if (!data.length) {
    renderFallbackState(host, {
      title: "No results found",
      message: "Student progress stories will be published soon."
    });
    return;
  }

  clearChildren(host);
  data.slice(0, 5).forEach((story, index) => {
    host.appendChild(createResultCard(story, index));
  });
  setBusy(host, false);
}

function createTestimonialSlide(testimonial, index) {
  const item = createElement("div", {
    className: `carousel-item ${index === 0 ? "active" : ""}`
  });

  const card = createElement("article", {
    className: "testimonial-slide-card"
  });

  const top = createElement("div", {
    className: "d-flex flex-column flex-md-row align-items-start justify-content-between gap-3 mb-3"
  });

  const identity = createElement("div", {
    className: "d-flex align-items-center gap-3"
  });

  identity.appendChild(
    createElement("span", {
      className: "avatar-initial",
      text: testimonial.avatarInitials || "BM"
    })
  );

  const identityText = createElement("div");
  identityText.appendChild(
    createElement("h3", {
      className: "h5 mb-1",
      text: testimonial.name || ""
    })
  );
  identityText.appendChild(
    createElement("p", {
      className: "mb-0 text-muted",
      text: `${testimonial.role || ""}${testimonial.childGrade ? ` | ${testimonial.childGrade}` : ""}`
    })
  );

  identity.appendChild(identityText);
  top.appendChild(identity);
  top.appendChild(renderStars(Number(testimonial.rating || 5), 5));

  card.appendChild(top);
  card.appendChild(
    createElement("p", {
      className: "lead mb-0",
      text: testimonial.quote || ""
    })
  );

  item.appendChild(card);
  return item;
}

async function renderTestimonials() {
  const host = document.querySelector("[data-testimonials-carousel]");
  if (!host) {
    return;
  }

  clearChildren(host);
  host.appendChild(createLoadingCard("placeholder-panel"));
  setBusy(host, true);

  const result = await getTestimonials();

  if (!result.ok) {
    renderFallbackState(host, {
      title: "Testimonials unavailable",
      message: "Parent and student feedback will appear again shortly."
    });
    return;
  }

  const data = Array.isArray(result.data) ? result.data : [];
  if (!data.length) {
    renderFallbackState(host, {
      title: "No testimonials yet",
      message: "Feedback cards will be published soon."
    });
    return;
  }

  clearChildren(host);

  const carouselId = "homeTestimonialsCarousel";
  const carousel = createElement("div", {
    className: "carousel slide",
    attrs: {
      id: carouselId,
      "data-bs-touch": "true",
      "data-bs-pause": "hover",
      "aria-label": "Bright Minds Academy testimonials"
    }
  });

  const indicators = createElement("div", {
    className: "carousel-indicators"
  });

  const inner = createElement("div", {
    className: "carousel-inner"
  });

  data.slice(0, 6).forEach((testimonial, index) => {
    indicators.appendChild(
      createElement("button", {
        attrs: {
          type: "button",
          "data-bs-target": `#${carouselId}`,
          "data-bs-slide-to": String(index),
          "aria-label": `Go to testimonial ${index + 1}`,
          "aria-current": index === 0 ? "true" : null,
          class: index === 0 ? "active" : null
        }
      })
    );

    inner.appendChild(createTestimonialSlide(testimonial, index));
  });

  const prevButton = createElement("button", {
    className: "carousel-control-prev",
    attrs: {
      type: "button",
      "data-bs-target": `#${carouselId}`,
      "data-bs-slide": "prev",
      "aria-label": "Previous testimonial"
    }
  });

  prevButton.appendChild(
    createElement("span", {
      className: "carousel-control-prev-icon",
      attrs: {
        "aria-hidden": "true"
      }
    })
  );

  const nextButton = createElement("button", {
    className: "carousel-control-next",
    attrs: {
      type: "button",
      "data-bs-target": `#${carouselId}`,
      "data-bs-slide": "next",
      "aria-label": "Next testimonial"
    }
  });

  nextButton.appendChild(
    createElement("span", {
      className: "carousel-control-next-icon",
      attrs: {
        "aria-hidden": "true"
      }
    })
  );

  carousel.appendChild(indicators);
  carousel.appendChild(inner);
  carousel.appendChild(prevButton);
  carousel.appendChild(nextButton);
  host.appendChild(carousel);

  if (window.bootstrap?.Carousel) {
    const reducedMotion = isReducedMotion();
    const instance = window.bootstrap.Carousel.getOrCreateInstance(carousel, {
      interval: reducedMotion ? false : 4000,
      pause: "hover",
      touch: true,
      wrap: true
    });

    if (!reducedMotion) {
      instance.cycle();
    }
  }

  setBusy(host, false);
}

function pickHomeFaqs(data = []) {
  const priorities = ["demo", "pricing", "tutor", "progress", "schedule", "parent", "whatsapp", "contact"];
  const selected = [];

  priorities.forEach((keyword) => {
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

  const headingId = `homeFaqHeading${index + 1}`;
  const collapseId = `homeFaqCollapse${index + 1}`;

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
      "data-bs-parent": "#homeFaqAccordion"
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

async function renderFaqs() {
  const host = document.querySelector("[data-faq-accordion]");
  if (!host) {
    return;
  }

  clearChildren(host);
  const loadingItem = createElement("article", {
    className: "accordion-item loading-card"
  });
  const loadingHeader = createElement("h3", {
    className: "accordion-header"
  });
  loadingHeader.appendChild(
    createElement("button", {
      className: "accordion-button",
      text: "Loading frequently asked questions...",
      attrs: {
        type: "button",
        disabled: "true"
      }
    })
  );
  loadingItem.appendChild(loadingHeader);
  host.appendChild(loadingItem);
  setBusy(host, true);

  const result = await getFaqs();

  if (!result.ok) {
    renderFallbackState(host, {
      title: "FAQs unavailable",
      message: "Please contact us directly for immediate assistance.",
      actionText: "Contact Us",
      actionHref: "./contact.html"
    });
    return;
  }

  const data = Array.isArray(result.data) ? result.data : [];
  if (!data.length) {
    renderFallbackState(host, {
      title: "No FAQs found",
      message: "FAQ content will be updated soon."
    });
    return;
  }

  const selected = pickHomeFaqs(data);
  clearChildren(host);
  selected.forEach((faq, index) => {
    host.appendChild(createFaqItem(faq, index));
  });

  setBusy(host, false);
}

function extractTriggerDetail(trigger) {
  const detail = {
    selectedSubject: trigger.dataset.selectedSubject || "",
    selectedPlan: trigger.dataset.selectedPlan || ""
  };

  const href = trigger.getAttribute("href") || "";

  if (href) {
    try {
      const url = new URL(href, window.location.href);
      detail.selectedSubject = detail.selectedSubject || url.searchParams.get("subject") || "";
      detail.selectedPlan = detail.selectedPlan || url.searchParams.get("plan") || "";
    } catch {
      /* ignore */
    }
  }

  return detail;
}

function bindDemoModalTriggers(scope = document) {
  const modalElement = document.getElementById("demoModal");
  if (!modalElement || !window.bootstrap?.Modal) {
    return;
  }

  const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalElement);

  scope.querySelectorAll("[data-open-demo-modal]").forEach((trigger) => {
    if (trigger.dataset.demoTriggerBound === "true") {
      return;
    }

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      modalInstance.show();

      window.dispatchEvent(
        new CustomEvent("bma:demo-triggered", {
          detail: extractTriggerDetail(trigger)
        })
      );
    });

    trigger.dataset.demoTriggerBound = "true";
  });
}

function formatPlanLabel(planValue) {
  const normalized = String(planValue || "")
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, " ");

  if (normalized.includes("starter")) {
    return "Starter Plan";
  }

  if (normalized.includes("growth")) {
    return "Growth Plan";
  }

  if (normalized.includes("elite")) {
    return "Elite Plan";
  }

  return "Not selected";
}

function applyDemoPrefill(detail = {}) {
  const subjectsField = document.getElementById("demoSubjects");
  const planHidden = document.getElementById("demoSelectedPlan");
  const planDisplay = document.querySelector("[data-demo-plan-display]");

  const selectedSubject = String(detail.selectedSubject || "").trim().toLowerCase();
  const selectedPlan = String(detail.selectedPlan || "").trim();

  if (subjectsField instanceof HTMLSelectElement) {
    Array.from(subjectsField.options).forEach((option) => {
      option.selected = selectedSubject ? option.value.trim().toLowerCase() === selectedSubject : false;
    });
  }

  if (planHidden instanceof HTMLInputElement) {
    planHidden.value = selectedPlan;
  }

  if (planDisplay instanceof HTMLInputElement) {
    const currentPlan = planHidden instanceof HTMLInputElement ? planHidden.value : selectedPlan;
    planDisplay.value = formatPlanLabel(currentPlan);
  }
}

function initializeDemoPrefillListener() {
  window.addEventListener("bma:demo-triggered", (event) => {
    applyDemoPrefill(event.detail || {});
  });
}

function initializeSmoothScroll() {
  const links = document.querySelectorAll("a[href*='#']");

  links.forEach((link) => {
    if (link.dataset.smoothScrollBound === "true" || link.hasAttribute("data-open-demo-modal")) {
      return;
    }

    let parsed;

    try {
      parsed = new URL(link.href, window.location.href);
    } catch {
      return;
    }

    if (!parsed.hash || parsed.pathname !== window.location.pathname) {
      return;
    }

    link.addEventListener("click", (event) => {
      const target = document.querySelector(parsed.hash);
      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({
        behavior: isReducedMotion() ? "auto" : "smooth",
        block: "start"
      });

      if (window.history?.replaceState) {
        window.history.replaceState({}, "", parsed.hash);
      }
    });

    link.dataset.smoothScrollBound = "true";
  });
}

function initializeSectionSpy() {
  const navLinks = Array.from(document.querySelectorAll(".bma-navbar [data-home-nav]"));
  if (!navLinks.length) {
    return;
  }

  const linkByHash = new Map();
  navLinks.forEach((link) => {
    const hash = String(link.getAttribute("data-home-nav") || "").trim();
    if (hash) {
      linkByHash.set(hash, link);
    }
  });

  const setActive = (hash) => {
    navLinks.forEach((link) => {
      const isMatch = String(link.getAttribute("data-home-nav") || "") === hash;
      link.classList.toggle("active", isMatch);

      if (isMatch) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if (!("IntersectionObserver" in window)) {
    setActive("#home");
    return;
  }

  const sections = HOME_SECTION_IDS
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const hash = `#${entry.target.id}`;
        if (linkByHash.has(hash)) {
          setActive(hash);
        }
      });
    },
    {
      rootMargin: "-40% 0px -45% 0px",
      threshold: 0.01
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function refreshAnimations() {
  initScrollReveal(".reveal");
  initCounters();
  initProgressAnimations();
}

async function initHomePage() {
  initializeDemoPrefillListener();

  await Promise.all([
    renderStats(),
    renderSteps(),
    renderSubjects(),
    renderPlans(),
    renderResults(),
    renderTestimonials(),
    renderFaqs()
  ]);

  bindDemoModalTriggers(document);
  initializeSmoothScroll();
  initializeSectionSpy();
  refreshAnimations();
}

window.addEventListener("bma:ready", initHomePage, { once: true });
