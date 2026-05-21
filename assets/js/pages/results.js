import { getStats, getSuccessStories, getTestimonials } from "../data-service.js";
import { initCounters, initProgressAnimations, initScrollReveal } from "../animations.js";
import { clearChildren, createElement, createEmptyState, renderStars } from "../render.js";

function setBusy(host, isBusy) {
  if (!host) {
    return;
  }

  host.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function createLoadingCard(cardClass = "placeholder-panel") {
  const card = createElement("div", {
    className: `${cardClass} loading-card p-4 h-100`
  });

  card.appendChild(createElement("span", { className: "placeholder-wave mb-2" }));
  card.appendChild(createElement("span", { className: "placeholder-wave placeholder-sm" }));

  return card;
}

function renderLoadingGrid(host, options = {}) {
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
}

function createStatCard(stat, index) {
  const col = createElement("div", {
    className: "col-12 col-md-6 col-lg-3 reveal"
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

async function renderResultsCounters() {
  const host = document.querySelector("[data-results-counters]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  renderLoadingGrid(host, {
    count: 4,
    colClass: "col-12 col-md-6 col-lg-3",
    cardClass: "stat-counter-card"
  });

  const result = await getStats();

  if (!result.ok || !Array.isArray(result.data)) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "Metrics unavailable",
        message: "Trust metrics are being refreshed.",
        actionText: "View Programs",
        actionHref: "./programs.html"
      })
    );
    setBusy(host, false);
    return;
  }

  const stats = result.data.slice(0, 4);
  clearChildren(host);

  if (!stats.length) {
    host.appendChild(
      createEmptyState({
        title: "No metrics found",
        message: "Check back soon for updated results."
      })
    );
    setBusy(host, false);
    return;
  }

  stats.forEach((stat, index) => {
    host.appendChild(createStatCard(stat, index));
  });

  setBusy(host, false);

  setBusy(host, false);
}

function formatScore(value) {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `${numeric}%`;
  }

  return value ? String(value) : "--";
}

function createScoreChip(label, value, highlight = false) {
  const chip = createElement("div", {
    className: `score-chip ${highlight ? "score-chip--after" : ""}`.trim()
  });

  chip.appendChild(
    createElement("span", {
      className: "score-label",
      text: label
    })
  );

  chip.appendChild(
    createElement("span", {
      className: "score-value",
      text: formatScore(value)
    })
  );

  return chip;
}

function createStoryCard(story, index) {
  const col = createElement("div", {
    className: "col-12 col-md-6 col-lg-4 reveal"
  });
  col.style.transitionDelay = `${index * 70}ms`;

  const card = createElement("article", {
    className: "result-card results-story-card p-4 h-100"
  });

  const header = createElement("div", {
    className: "d-flex align-items-start justify-content-between gap-2 mb-3"
  });

  header.appendChild(
    createElement("div", {
      className: "student-avatar",
      text: story.studentInitial || "BMA"
    })
  );

  const meta = createElement("div", {
    className: "text-end"
  });

  if (story.subject) {
    meta.appendChild(
      createElement("span", {
        className: "component-badge component-badge-gold",
        text: story.subject
      })
    );
  }

  meta.appendChild(
    createElement("div", {
      className: "small text-muted mt-2",
      text: story.grade || ""
    })
  );

  header.appendChild(meta);
  card.appendChild(header);

  const scoreRow = createElement("div", {
    className: "score-row",
    attrs: {
      "aria-label": `Score moved from ${formatScore(story.beforeScore)} to ${formatScore(story.afterScore)}`
    }
  });

  scoreRow.appendChild(createScoreChip("Before", story.beforeScore));
  scoreRow.appendChild(
    createElement("i", {
      className: "bi bi-arrow-right",
      attrs: {
        "aria-hidden": "true"
      }
    })
  );
  scoreRow.appendChild(createScoreChip("After", story.afterScore, true));

  card.appendChild(scoreRow);

  const progressValue = Math.max(0, Math.min(100, Number(story.afterScore || 0)));
  const progress = createElement("div", {
    className: "progress result-progress mb-3",
    attrs: {
      role: "progressbar",
      "aria-label": "Improvement score",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": "0"
    }
  });

  progress.appendChild(
    createElement("div", {
      className: "progress-bar bg-success",
      attrs: {
        "data-progress": progressValue
      }
    })
  );

  card.appendChild(progress);

  const durationText = story.durationWeeks ? `${story.durationWeeks} weeks` : "";
  if (durationText) {
    card.appendChild(
      createElement("p", {
        className: "small text-muted mb-2",
        text: `Duration: ${durationText}`
      })
    );
  }

  if (story.outcome) {
    card.appendChild(
      createElement("p", {
        className: "mb-2",
        text: story.outcome
      })
    );
  }

  if (story.quote) {
    card.appendChild(
      createElement("p", {
        className: "result-quote mb-0",
        text: `"${story.quote}"`
      })
    );
  }

  col.appendChild(card);
  return col;
}

async function renderSuccessStories() {
  const host = document.querySelector("[data-success-stories]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  renderLoadingGrid(host, {
    count: 3,
    colClass: "col-12 col-md-6 col-lg-4",
    cardClass: "result-card"
  });

  const result = await getSuccessStories();

  if (!result.ok || !Array.isArray(result.data)) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "Stories unavailable",
        message: "Student results are being updated.",
        actionText: "Book Free Demo",
        actionHref: "./booking.html"
      })
    );
    setBusy(host, false);
    return;
  }

  const stories = result.data;
  clearChildren(host);

  if (!stories.length) {
    host.appendChild(
      createEmptyState({
        title: "No stories available",
        message: "More student success stories are on the way."
      })
    );
    setBusy(host, false);
    return;
  }

  stories.forEach((story, index) => {
    host.appendChild(createStoryCard(story, index));
  });

  setBusy(host, false);
}

function createTestimonialCard(testimonial, index) {
  const col = createElement("div", {
    className: "col-12 col-md-6 col-lg-4 reveal"
  });
  col.style.transitionDelay = `${index * 70}ms`;

  const card = createElement("article", {
    className: "testimonial-card results-testimonial-card p-4 h-100"
  });

  const header = createElement("div", {
    className: "d-flex align-items-center justify-content-between gap-2 mb-3"
  });

  const identity = createElement("div", {
    className: "d-flex align-items-center gap-3"
  });

  identity.appendChild(
    createElement("div", {
      className: "testimonial-avatar",
      text: testimonial.avatarInitials || "BM"
    })
  );

  const nameWrap = createElement("div");
  nameWrap.appendChild(
    createElement("h3", {
      className: "h6 mb-1",
      text: testimonial.name || ""
    })
  );

  nameWrap.appendChild(
    createElement("p", {
      className: "small text-muted mb-0",
      text: testimonial.role || ""
    })
  );

  if (testimonial.childGrade) {
    nameWrap.appendChild(
      createElement("p", {
        className: "small text-muted mb-0",
        text: testimonial.childGrade
      })
    );
  }

  identity.appendChild(nameWrap);
  header.appendChild(identity);
  header.appendChild(renderStars(Number(testimonial.rating || 0)));

  card.appendChild(header);

  if (testimonial.quote) {
    card.appendChild(
      createElement("p", {
        className: "mb-0",
        text: `"${testimonial.quote}"`
      })
    );
  }

  col.appendChild(card);
  return col;
}

async function renderTestimonials() {
  const host = document.querySelector("[data-testimonials-grid]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  renderLoadingGrid(host, {
    count: 3,
    colClass: "col-12 col-md-6 col-lg-4",
    cardClass: "testimonial-card"
  });

  const result = await getTestimonials();

  if (!result.ok || !Array.isArray(result.data)) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "Testimonials unavailable",
        message: "Feedback from families will be available soon.",
        actionText: "Contact Us",
        actionHref: "./contact.html"
      })
    );
    setBusy(host, false);
    return;
  }

  const testimonials = result.data;
  clearChildren(host);

  if (!testimonials.length) {
    host.appendChild(
      createEmptyState({
        title: "No testimonials yet",
        message: "Parent and student feedback will appear here soon."
      })
    );
    setBusy(host, false);
    return;
  }

  testimonials.forEach((testimonial, index) => {
    host.appendChild(createTestimonialCard(testimonial, index));
  });

  setBusy(host, false);
}

async function initResultsPage() {
  await renderResultsCounters();
  await renderSuccessStories();
  await renderTestimonials();
  initCounters();
  initProgressAnimations();
  initScrollReveal(".reveal");
}

window.addEventListener("bma:ready", initResultsPage, { once: true });
