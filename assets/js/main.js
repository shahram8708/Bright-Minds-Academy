import { mountComponents } from "./components.js";
import { dataService } from "./data-service.js";
import { initAnimations } from "./animations.js";
import { hasStorageConsent, initializeLeadForms, setStorageConsent } from "./form-handler.js";

const DEFAULT_WHATSAPP_MESSAGE = "Hi, I\u2019m interested in Bright Minds Academy. I would like to know more about your tutoring programs.";

function getCurrentPageKey() {
  if (document.body.dataset.page) {
    return document.body.dataset.page;
  }

  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  return currentFile.replace(".html", "");
}

function initializeAuthFoundation() {
  const role = document.body.dataset.userRole || "guest";

  if (role !== "guest") {
    document.body.classList.add("is-authenticated");
  }
}

function initializeNavbarVariant() {
  const navbar = document.querySelector(".bma-navbar");
  if (!navbar) {
    return;
  }

  const variant = document.body.dataset.navbarVariant || "solid";
  navbar.classList.toggle("bma-navbar--transparent", variant === "transparent");
  navbar.classList.toggle("bma-navbar--solid", variant !== "transparent");
}

function initializeNavbarScrollBehavior() {
  const navbar = document.querySelector(".bma-navbar");
  if (!navbar) {
    return;
  }

  const transparentMode = navbar.classList.contains("bma-navbar--transparent");

  const updateState = () => {
    if (!transparentMode) {
      navbar.classList.add("is-scrolled");
      return;
    }

    navbar.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  updateState();
  window.addEventListener("scroll", updateState, { passive: true });
}

function initializeActiveNavStates() {
  const page = getCurrentPageKey();
  const links = document.querySelectorAll("[data-nav-link]");

  links.forEach((link) => {
    const isActive = link.getAttribute("data-nav-link") === page;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function initializeOffcanvasLinkClose() {
  const offcanvasEl = document.getElementById("siteNavOffcanvas");

  if (!offcanvasEl || !window.bootstrap?.Offcanvas) {
    return;
  }

  const offcanvas = window.bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);

  offcanvasEl.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => {
      offcanvas.hide();
    });
  });
}

function initializeDemoModalTriggers() {
  const modalElement = document.getElementById("demoModal");

  if (!modalElement || !window.bootstrap?.Modal) {
    return;
  }

  const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalElement);
  const triggers = document.querySelectorAll("[data-open-demo-modal]");

  const readDetailFromTrigger = (trigger) => {
    const detail = {
      selectedSubject: trigger.dataset.selectedSubject || "",
      selectedPlan: trigger.dataset.selectedPlan || "",
      source: trigger.dataset.leadSource || "cta"
    };

    const href = trigger.getAttribute("href") || "";

    if (href) {
      try {
        const hrefUrl = new URL(href, window.location.href);
        detail.selectedSubject = detail.selectedSubject || hrefUrl.searchParams.get("subject") || "";
        detail.selectedPlan = detail.selectedPlan || hrefUrl.searchParams.get("plan") || "";
      } catch {
        /* ignore URL parse issues for non-URL href values */
      }
    }

    return detail;
  };

  triggers.forEach((trigger) => {
    if (trigger.dataset.demoTriggerBound === "true") {
      return;
    }

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      modalInstance.show();

      window.dispatchEvent(
        new CustomEvent("bma:demo-triggered", {
          detail: readDetailFromTrigger(trigger)
        })
      );
    });

    trigger.dataset.demoTriggerBound = "true";
  });
}

function normalizePlanValue(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized.includes("starter")) {
    return "starter";
  }

  if (normalized.includes("growth")) {
    return "growth";
  }

  if (normalized.includes("elite")) {
    return "elite";
  }

  return "";
}

function formatPlanLabel(value) {
  const normalized = normalizePlanValue(value);

  if (normalized === "starter") {
    return "Starter Plan";
  }

  if (normalized === "growth") {
    return "Growth Plan";
  }

  if (normalized === "elite") {
    return "Elite Plan";
  }

  return "Not selected";
}

function normalizeSubjectValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, " ");
}

function applyDemoPrefill(detail = {}) {
  const subjectsField = document.getElementById("demoSubjects");
  const planHidden = document.getElementById("demoSelectedPlan");
  const planDisplay = document.querySelector("[data-demo-plan-display]");

  const selectedSubject = normalizeSubjectValue(detail.selectedSubject || "");
  const selectedPlan = normalizePlanValue(detail.selectedPlan || "");

  if (subjectsField instanceof HTMLSelectElement) {
    Array.from(subjectsField.options).forEach((option) => {
      const normalizedOption = normalizeSubjectValue(option.value);
      option.selected = selectedSubject ? normalizedOption === selectedSubject : false;
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

function initializeToastSystem() {
  const toastEl = document.querySelector("[data-global-toast]");

  if (!toastEl) {
    return;
  }

  const toastBody = toastEl.querySelector("[data-toast-message]");
  const toastTitle = toastEl.querySelector("[data-toast-title]");
  const toastInstance = window.bootstrap?.Toast ? window.bootstrap.Toast.getOrCreateInstance(toastEl) : null;

  const styleMap = {
    success: {
      title: "Success",
      className: "text-bg-success"
    },
    error: {
      title: "Error",
      className: "text-bg-danger"
    },
    info: {
      title: "Info",
      className: "text-bg-primary"
    }
  };

  window.addEventListener("bma:toast", (event) => {
    const detail = event.detail || {};
    const type = detail.type || "info";
    const selectedStyle = styleMap[type] || styleMap.info;

    toastEl.classList.remove("text-bg-success", "text-bg-danger", "text-bg-primary");
    toastEl.classList.add(selectedStyle.className);

    if (toastBody) {
      toastBody.textContent = detail.message || "Notification";
    }

    if (toastTitle) {
      toastTitle.textContent = selectedStyle.title;
    }

    if (toastInstance) {
      toastInstance.show();
    } else {
      toastEl.classList.add("show");
    }
  });
}

function createConsentBarText() {
  return "We use storage to save demo and inquiry form submissions.";
}

function initializeConsentBar() {
  const existing = document.getElementById("cookieConsentBar");

  if (existing) {
    return;
  }

  const consentAccepted = hasStorageConsent();

  const bar = document.createElement("section");
  bar.id = "cookieConsentBar";
  bar.className = "cookie-consent";
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-live", "polite");
  bar.setAttribute("aria-label", "Storage consent");
  bar.innerHTML = `
    <div class="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
      <p class="mb-0 pe-lg-3">${createConsentBarText()}</p>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-sm btn-light" data-consent-action="accept">Allow Storage</button>
        <button type="button" class="btn btn-sm btn-outline-light" data-consent-action="decline">Decline</button>
      </div>
    </div>
  `;

  document.body.appendChild(bar);

  if (consentAccepted) {
    bar.classList.add("hidden");
  }

  bar.querySelectorAll("[data-consent-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-consent-action");
      if (action === "accept") {
        setStorageConsent("accepted");
        window.dispatchEvent(new CustomEvent("bma:toast", { detail: { type: "success", message: "Storage consent enabled." } }));
      } else {
        setStorageConsent("declined");
        window.dispatchEvent(new CustomEvent("bma:toast", { detail: { type: "info", message: "Storage disabled for lead saving." } }));
      }

      bar.classList.add("hidden");
    });
  });
}

function toWhatsAppDigits(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function initializeWhatsAppLinks(meta) {
  const phone = toWhatsAppDigits(meta?.contact?.whatsapp || "+91 72592 65766");
  const message = meta?.whatsappDefaultMessage || DEFAULT_WHATSAPP_MESSAGE;
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
    link.setAttribute("href", href);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}

async function initializeGlobalFeatures() {
  initializeAuthFoundation();
  initializeNavbarVariant();
  initializeNavbarScrollBehavior();
  initializeActiveNavStates();
  initializeOffcanvasLinkClose();
  initializeDemoModalTriggers();
  initializeDemoPrefillListener();
  initializeToastSystem();

  const metaResult = await dataService.getMeta();
  if (metaResult.ok) {
    initializeWhatsAppLinks(metaResult.data);
  }

  initializeConsentBar();
  initializeLeadForms('[data-lead-form]:not([data-lead-autobind="false"])');
  initAnimations();

  window.dispatchEvent(
    new CustomEvent("bma:ready", {
      detail: {
        metaLoaded: metaResult.ok
      }
    })
  );
}

async function bootstrap() {
  await mountComponents();
  await initializeGlobalFeatures();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
