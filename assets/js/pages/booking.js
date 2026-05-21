import { getPlans, getSubjects } from "../data-service.js";
import { initScrollReveal } from "../animations.js";
import { clearChildren, createElement } from "../render.js";

const PLAN_PARAM_ALIASES = new Map([
  ["starter", "starter"],
  ["starter-plan", "starter"],
  ["growth", "growth"],
  ["growth-plan", "growth"],
  ["elite", "elite"],
  ["elite-plan", "elite"]
]);

const FALLBACK_PLAN_NAMES = {
  starter: "Starter Plan",
  growth: "Growth Plan",
  elite: "Elite Plan"
};

function normalizePlanParam(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return PLAN_PARAM_ALIASES.get(normalized) || "";
}

function normalizeSubjectParam(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function getStoredSubject() {
  try {
    return sessionStorage.getItem("bma_selected_subject") || "";
  } catch {
    return "";
  }
}

function clearStoredSubject() {
  try {
    sessionStorage.removeItem("bma_selected_subject");
  } catch {
    /* ignore */
  }
}

function updatePlanHelper(planId, planName) {
  const helper = document.querySelector("[data-plan-helper]");
  const heading = document.querySelector("[data-booking-title]");

  if (helper) {
    helper.textContent = planId && planName ? `Selected plan: ${planName}` : "Selected plan: Free demo";
  }

  if (heading) {
    heading.textContent = planId && planName ? `Book a ${planName} demo class.` : "Schedule a free demo class in minutes.";
  }
}

function buildPlanOptions(select, plans) {
  if (!select) {
    return;
  }

  clearChildren(select);
  select.appendChild(
    createElement("option", {
      text: "Free demo (no plan selected)",
      attrs: {
        value: ""
      }
    })
  );

  plans.forEach((plan) => {
    select.appendChild(
      createElement("option", {
        text: plan.name || "",
        attrs: {
          value: plan.id || ""
        }
      })
    );
  });
}

function buildSubjectOptions(select, subjects) {
  if (!select) {
    return;
  }

  clearChildren(select);
  subjects.forEach((subject) => {
    select.appendChild(
      createElement("option", {
        text: subject.name || "",
        attrs: {
          value: subject.name || ""
        }
      })
    );
  });
}

function applyPlanSelection(select, plansById, paramValue) {
  if (!select) {
    return;
  }

  const normalized = normalizePlanParam(paramValue);
  const planName = plansById.get(normalized) || FALLBACK_PLAN_NAMES[normalized] || "";
  select.value = normalized;
  updatePlanHelper(normalized, planName);
}

function applySubjectSelection(select, subjects, paramValue) {
  if (!select) {
    return;
  }

  const normalizedParam = normalizeSubjectParam(paramValue);
  if (!normalizedParam) {
    return;
  }

  const match = subjects.find((subject) => {
    const subjectId = normalizeSubjectParam(subject.id || subject.name);
    return subjectId === normalizedParam;
  });

  if (!match) {
    return;
  }

  Array.from(select.options).forEach((option) => {
    option.selected = option.value === match.name;
  });
}

function bindBookingSuccess() {
  const form = document.getElementById("booking-form");
  const successPanel = document.querySelector("[data-booking-success]");

  if (!form || !successPanel) {
    return;
  }

  form.addEventListener("bma:form-success", (event) => {
    if (event.detail?.formId !== "booking-demo-form") {
      return;
    }

    form.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function initializeFormOptions() {
  const planSelect = document.querySelector("[data-plan-select]");
  const subjectSelect = document.querySelector("[data-subjects-select]");

  const [planResult, subjectResult] = await Promise.all([getPlans(), getSubjects()]);

  const plans = planResult.ok && Array.isArray(planResult.data) ? planResult.data : [];
  const subjects = subjectResult.ok && Array.isArray(subjectResult.data) ? subjectResult.data : [];

  const planParam = new URLSearchParams(window.location.search).get("plan") || "";

  if (planSelect instanceof HTMLSelectElement && plans.length) {
    const plansById = new Map(plans.map((plan) => [plan.id, plan.name]));
    buildPlanOptions(planSelect, plans);
    applyPlanSelection(planSelect, plansById, planParam);
  } else if (planSelect instanceof HTMLSelectElement) {
    const normalized = normalizePlanParam(planParam);
    planSelect.value = normalized;
    updatePlanHelper(normalized, FALLBACK_PLAN_NAMES[normalized] || "");
  }

  if (subjectSelect instanceof HTMLSelectElement && subjects.length) {
    buildSubjectOptions(subjectSelect, subjects);

    const params = new URLSearchParams(window.location.search);
    const subjectParam = params.get("subject") || getStoredSubject();

    applySubjectSelection(subjectSelect, subjects, subjectParam);
    clearStoredSubject();
  }
}

function initBookingPage() {
  updatePlanHelper("", "");
  initializeFormOptions();
  bindBookingSuccess();
  initScrollReveal(".reveal");
}

window.addEventListener("bma:ready", initBookingPage, { once: true });
