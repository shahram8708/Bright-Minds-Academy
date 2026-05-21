import { getSubjects } from "../data-service.js";
import { initScrollReveal } from "../animations.js";
import { clearChildren, createElement, createEmptyState } from "../render.js";

const SUBJECT_ORDER = [
  "mathematics",
  "science",
  "english",
  "physics",
  "chemistry",
  "biology",
  "commerce",
  "history",
  "computer-science"
];

function normalizeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function sortSubjects(data = []) {
  const byId = new Map(data.map((subject) => [normalizeId(subject.id || subject.name), subject]));
  const ordered = SUBJECT_ORDER.map((id) => byId.get(id)).filter(Boolean);

  if (ordered.length >= SUBJECT_ORDER.length) {
    return ordered;
  }

  const remainder = data.filter((subject) => !ordered.includes(subject));
  return [...ordered, ...remainder].slice(0, SUBJECT_ORDER.length);
}

function setBusy(host, isBusy) {
  if (!host) {
    return;
  }

  host.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function createLoadingCard() {
  const card = createElement("div", {
    className: "subject-card p-4 h-100 loading-card"
  });

  card.appendChild(createElement("span", { className: "placeholder-wave mb-2" }));
  card.appendChild(createElement("span", { className: "placeholder-wave placeholder-sm" }));

  return card;
}

function renderLoadingGrid(host, count = 6) {
  clearChildren(host);
  for (let index = 0; index < count; index += 1) {
    const col = createElement("div", {
      className: "col-12 col-md-6 col-lg-4"
    });

    col.appendChild(createLoadingCard());
    host.appendChild(col);
  }
}

function createSubjectCard(subject, index) {
  const subjectId = normalizeId(subject.id || subject.name);
  const col = createElement("div", {
    className: "col-12 col-md-6 col-lg-4 reveal",
    attrs: {
      id: subjectId
    }
  });
  col.style.transitionDelay = `${index * 70}ms`;

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
      className: "mb-2",
      text: subject.shortDescription || ""
    })
  );
  card.appendChild(
    createElement("p", {
      className: "small text-muted mb-3",
      text: subject.longDescription || ""
    })
  );

  const actionGroup = createElement("div", {
    className: "d-grid gap-2"
  });

  actionGroup.appendChild(
    createElement("a", {
      className: "btn btn-brand-primary",
      text: "Inquire for this Subject",
      attrs: {
        href: `./booking.html?subject=${subjectId}`,
        "aria-label": `Inquire for ${subject.name || "this subject"}`,
        "data-subject-inquiry": "true",
        "data-subject-id": subjectId
      }
    })
  );

  actionGroup.appendChild(
    createElement("a", {
      className: "btn btn-brand-outline",
      text: "Book Demo",
      attrs: {
        href: "./booking.html",
        "data-open-demo-modal": "true",
        "data-selected-subject": subject.name || "",
        "data-lead-source": "subjects_page"
      }
    })
  );

  card.appendChild(actionGroup);
  col.appendChild(card);

  return col;
}

function bindSubjectInquiryTracking(scope = document) {
  scope.querySelectorAll("[data-subject-inquiry]").forEach((link) => {
    if (link.dataset.subjectBound === "true") {
      return;
    }

    link.addEventListener("click", () => {
      const subjectId = link.dataset.subjectId || "";
      if (!subjectId) {
        return;
      }

      try {
        sessionStorage.setItem("bma_selected_subject", subjectId);
      } catch {
        /* ignore storage issues */
      }
    });

    link.dataset.subjectBound = "true";
  });
}

async function renderSubjectsGrid() {
  const host = document.querySelector("[data-subjects-grid]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  renderLoadingGrid(host);

  const result = await getSubjects();
  clearChildren(host);

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    host.appendChild(
      createEmptyState({
        title: "Subjects unavailable",
        message: "Subject offerings will appear here shortly.",
        actionText: "Contact Us",
        actionHref: "./contact.html"
      })
    );
    setBusy(host, false);
    return;
  }

  const subjects = sortSubjects(result.data);
  subjects.forEach((subject, index) => {
    host.appendChild(createSubjectCard(subject, index));
  });

  bindSubjectInquiryTracking(host);
  setBusy(host, false);
}

function initSubjectsPage() {
  renderSubjectsGrid();
  initScrollReveal(".reveal");
}

window.addEventListener("bma:ready", initSubjectsPage, { once: true });
