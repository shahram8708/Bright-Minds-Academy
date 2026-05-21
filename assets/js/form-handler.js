const LEAD_STORAGE_KEY = "bma_leads_v1";
const STORAGE_CONSENT_KEY = "bma_storage_consent_v1";
const SUBMIT_LOG_KEY = "bma_submit_log_v1";
const DEFAULT_COOLDOWN_MS = 45000;

const SAFE_LEAD_FIELDS = new Set([
  "fullName",
  "name",
  "parentName",
  "studentName",
  "email",
  "phone",
  "grade",
  "subject",
  "subjects",
  "preferredTime",
  "message",
  "plan"
]);

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function trimValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function generateLeadId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `lead-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function dispatchToast(type, message) {
  window.dispatchEvent(
    new CustomEvent("bma:toast", {
      detail: {
        type,
        message
      }
    })
  );
}

function parseBoolean(value, fallback = false) {
  if (value === true || value === false) {
    return value;
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }

  return fallback;
}

function parseDedupeFields(value) {
  if (!value) {
    return ["leadType", "email"];
  }

  if (Array.isArray(value)) {
    return value.map((item) => trimValue(String(item))).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((item) => trimValue(item))
    .filter(Boolean);
}

export function validateRequired(value) {
  return trimValue(value).length > 0;
}

export function validateEmail(value) {
  const email = trimValue(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(value) {
  const phone = trimValue(value).replace(/[\s()-]/g, "");
  return /^\+?[0-9]{8,15}$/.test(phone);
}

export function validateMinLength(value, minLength = 2) {
  return trimValue(value).length >= minLength;
}

function getFeedbackElement(field) {
  const describedById = field.getAttribute("aria-describedby");

  if (describedById) {
    const existing = document.getElementById(describedById);
    if (existing) {
      return existing;
    }
  }

  const feedback = document.createElement("div");
  const feedbackId = `${field.name || field.id || "field"}-error`;
  feedback.id = feedbackId;
  feedback.className = "invalid-feedback";
  field.setAttribute("aria-describedby", feedbackId);

  const wrapper = field.closest(".mb-3, .form-group") || field.parentElement;
  wrapper?.appendChild(feedback);

  return feedback;
}

export function showFieldError(field, message) {
  if (!field) {
    return;
  }

  field.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");

  const feedback = getFeedbackElement(field);
  feedback.textContent = message;
}

export function clearFieldError(field) {
  if (!field) {
    return;
  }

  field.classList.remove("is-invalid");
  field.removeAttribute("aria-invalid");

  const describedById = field.getAttribute("aria-describedby");
  if (describedById) {
    const feedback = document.getElementById(describedById);
    if (feedback && feedback.classList.contains("invalid-feedback")) {
      feedback.textContent = "";
    }
  }
}

export function clearFormErrors(form) {
  if (!form) {
    return;
  }

  form.querySelectorAll(".is-invalid").forEach((field) => {
    clearFieldError(field);
  });
}

export function hasStorageConsent() {
  try {
    return localStorage.getItem(STORAGE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function setStorageConsent(value) {
  try {
    localStorage.setItem(STORAGE_CONSENT_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function getStoredLeads() {
  try {
    const raw = localStorage.getItem(LEAD_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = safeParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredLeads(leads) {
  try {
    localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(leads));
    return true;
  } catch {
    return false;
  }
}

export function saveLead(lead) {
  if (!hasStorageConsent()) {
    return {
      ok: false,
      error: "Storage consent is required before saving lead details locally."
    };
  }

  const leads = getStoredLeads();
  leads.push(lead);

  const saved = saveStoredLeads(leads);

  if (!saved) {
    return {
      ok: false,
      error: "Unable to save lead locally at the moment."
    };
  }

  return {
    ok: true,
    error: null
  };
}

function getSubmitLog() {
  try {
    const raw = localStorage.getItem(SUBMIT_LOG_KEY);
    const parsed = safeParse(raw, {});
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveSubmitLog(log) {
  try {
    localStorage.setItem(SUBMIT_LOG_KEY, JSON.stringify(log));
    return true;
  } catch {
    return false;
  }
}

function isOnCooldown(formId, cooldownMs) {
  const log = getSubmitLog();
  const lastSubmittedAt = Number(log[formId] || 0);

  if (!lastSubmittedAt) {
    return false;
  }

  return Date.now() - lastSubmittedAt < cooldownMs;
}

function markSubmission(formId) {
  const log = getSubmitLog();
  log[formId] = Date.now();
  saveSubmitLog(log);
}

function getFieldNodes(form, name) {
  return Array.from(form.querySelectorAll(`[name="${name}"]`));
}

function readNodeValue(node) {
  if (node instanceof HTMLSelectElement) {
    if (node.multiple) {
      return Array.from(node.selectedOptions)
        .map((option) => trimValue(option.value))
        .filter(Boolean);
    }

    return trimValue(node.value);
  }

  if (node instanceof HTMLInputElement) {
    if (node.type === "checkbox") {
      return node.checked ? trimValue(node.value || "true") : "";
    }

    if (node.type === "radio") {
      return node.checked ? trimValue(node.value) : "";
    }

    return trimValue(node.value);
  }

  if (node instanceof HTMLTextAreaElement) {
    return trimValue(node.value);
  }

  return "";
}

function getValue(form, name) {
  const nodes = getFieldNodes(form, name).filter((node) => node instanceof HTMLElement);

  if (!nodes.length) {
    return "";
  }

  if (nodes.length === 1) {
    return readNodeValue(nodes[0]);
  }

  const firstNode = nodes[0];

  if (firstNode instanceof HTMLInputElement && (firstNode.type === "checkbox" || firstNode.type === "radio")) {
    const selectedValues = nodes
      .map((node) => readNodeValue(node))
      .flat()
      .filter((value) => Boolean(value));

    return selectedValues;
  }

  const values = nodes
    .map((node) => readNodeValue(node))
    .flat()
    .filter((value) => Boolean(value));

  return values;
}

function checkHoneypot(form, honeypotFieldName) {
  const trap = getValue(form, honeypotFieldName);

  if (Array.isArray(trap)) {
    return trap.length === 0;
  }

  return trimValue(trap).length === 0;
}

function normalizeComparable(value) {
  if (Array.isArray(value)) {
    return value.map((item) => trimValue(String(item)).toLowerCase()).sort().join("|");
  }

  return trimValue(String(value || "")).toLowerCase();
}

function isDuplicateLead(payload, dedupeFields) {
  const leads = getStoredLeads();

  if (!leads.length) {
    return false;
  }

  return leads.some((lead) => {
    return dedupeFields.every((field) => {
      const incoming = payload[field];
      const existing = lead[field];

      if (incoming == null || normalizeComparable(incoming) === "") {
        return false;
      }

      return normalizeComparable(existing) === normalizeComparable(incoming);
    });
  });
}

export function validateForm(form) {
  const errors = [];
  const processedGroups = new Set();

  if (!form) {
    return {
      isValid: false,
      errors: ["Form not found."]
    };
  }

  clearFormErrors(form);

  const fields = Array.from(form.querySelectorAll("input, select, textarea"));

  fields.forEach((field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) {
      return;
    }

    if (field.type === "hidden" || field.disabled) {
      return;
    }

    const isSelectMultiple = field instanceof HTMLSelectElement && field.multiple;
    const isCheckbox = field instanceof HTMLInputElement && field.type === "checkbox";
    const isRadio = field instanceof HTMLInputElement && field.type === "radio";
    const groupKey = field.name || field.id || "field";

    if ((isCheckbox || isRadio) && field.required) {
      if (processedGroups.has(groupKey)) {
        return;
      }

      processedGroups.add(groupKey);
      const groupNodes = getFieldNodes(form, groupKey).filter((node) => node instanceof HTMLInputElement);
      const hasChecked = groupNodes.some((node) => node.checked);

      if (!hasChecked) {
        showFieldError(field, "Please select at least one option.");
        errors.push(`${groupKey}: required`);
      }
      return;
    }

    const value = isSelectMultiple
      ? Array.from(field.selectedOptions)
          .map((option) => trimValue(option.value))
          .filter(Boolean)
      : trimValue(field.value);

    if (field.required) {
      if (isSelectMultiple && value.length === 0) {
        showFieldError(field, "Please select at least one option.");
        errors.push(`${field.name || field.id}: required`);
        return;
      }

      if (!isSelectMultiple && !validateRequired(value)) {
        showFieldError(field, "This field is required.");
        errors.push(`${field.name || field.id}: required`);
        return;
      }
    }

    if ((Array.isArray(value) && value.length === 0) || (!Array.isArray(value) && value.length === 0)) {
      return;
    }

    if (field.type === "email" || field.dataset.validateEmail === "true") {
      if (!validateEmail(value)) {
        showFieldError(field, "Please enter a valid email address.");
        errors.push(`${field.name || field.id}: invalid email`);
        return;
      }
    }

    if (field.type === "tel" || field.dataset.validatePhone === "true") {
      if (!validatePhone(value)) {
        showFieldError(field, "Please enter a valid phone number.");
        errors.push(`${field.name || field.id}: invalid phone`);
        return;
      }
    }

    const minLength = Number(field.dataset.minlength || field.getAttribute("minlength") || 0);

    if (minLength > 0 && !validateMinLength(value, minLength)) {
      showFieldError(field, `Please enter at least ${minLength} characters.`);
      errors.push(`${field.name || field.id}: too short`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

function setFormMessage(form, type, message) {
  const statusNode = form.querySelector("[data-form-status]");
  if (!statusNode) {
    dispatchToast(type, message);
    return;
  }

  statusNode.className = `alert ${type === "success" ? "alert-success" : "alert-danger"} mt-3`;
  statusNode.textContent = message;
  statusNode.hidden = false;
}

function collectSafeLeadFields(form, honeypotFieldName) {
  const payload = {};

  SAFE_LEAD_FIELDS.forEach((fieldName) => {
    if (fieldName === honeypotFieldName) {
      return;
    }

    const value = getValue(form, fieldName);

    if (Array.isArray(value) && value.length > 0) {
      payload[fieldName] = value;
      return;
    }

    if (!Array.isArray(value) && trimValue(String(value || "")).length > 0) {
      payload[fieldName] = value;
    }
  });

  return payload;
}

function buildLeadPayload(form, options = {}) {
  const leadType = trimValue(options.leadType || form.dataset.leadType || "general_inquiry");
  const honeypotFieldName = trimValue(options.honeypotFieldName || form.dataset.honeypotFieldName || "website");
  const leadSource = trimValue(options.leadSource || form.dataset.leadSource || "");
  const safeFields = collectSafeLeadFields(form, honeypotFieldName);
  const timestamp = new Date().toISOString();

  return {
    version: 2,
    id: generateLeadId(),
    type: leadType || "general_inquiry",
    leadType: leadType || "general_inquiry",
    status: "new",
    source: leadSource || "unknown",
    sourcePage: window.location.pathname,
    timestamp,
    submittedAt: timestamp,
    ...safeFields
  };
}

function resolveSubmitButtons(form) {
  return Array.from(form.querySelectorAll('button[type="submit"], input[type="submit"]'));
}

function setSubmittingState(buttons, isSubmitting) {
  buttons.forEach((button) => {
    if (!(button instanceof HTMLButtonElement || button instanceof HTMLInputElement)) {
      return;
    }

    button.disabled = isSubmitting;

    if (!button.dataset.defaultSubmitText) {
      button.dataset.defaultSubmitText = button instanceof HTMLInputElement ? button.value : button.textContent || "Submit";
    }

    const loadingText = button.getAttribute("data-submit-loading") || "Submitting...";

    if (button instanceof HTMLInputElement) {
      button.value = isSubmitting ? loadingText : button.dataset.defaultSubmitText;
      return;
    }

    button.textContent = isSubmitting ? loadingText : button.dataset.defaultSubmitText;
  });
}

function readFormOptions(form, options = {}) {
  return {
    formId: options.formId || form.dataset.formId || form.id || `form-${Math.random().toString(36).slice(2, 8)}`,
    honeypotFieldName: options.honeypotFieldName || form.dataset.honeypotFieldName || "website",
    cooldownMs: Number(options.cooldownMs || form.dataset.cooldownMs || DEFAULT_COOLDOWN_MS),
    leadType: options.leadType || form.dataset.leadType || "general_inquiry",
    leadSource: options.leadSource || form.dataset.leadSource || "",
    successMessage:
      options.successMessage ||
      form.dataset.successMessage ||
      "Thank you. Your request has been received.",
    cooldownMessage:
      options.cooldownMessage ||
      form.dataset.cooldownMessage ||
      "Please wait before submitting again.",
    errorMessage:
      options.errorMessage ||
      form.dataset.errorMessage ||
      "Unable to submit right now.",
    validationMessage:
      options.validationMessage ||
      form.dataset.validationMessage ||
      "Please review and fix the highlighted fields.",
    honeypotMessage:
      options.honeypotMessage ||
      form.dataset.honeypotMessage ||
      "Submission blocked. Please try again.",
    preventDuplicates: parseBoolean(options.preventDuplicates ?? form.dataset.preventDuplicates, false),
    dedupeFields: parseDedupeFields(options.dedupeFields || form.dataset.dedupeFields)
  };
}

export function handleLeadForm(form, options = {}) {
  if (!form || form.dataset.formBound === "true") {
    return;
  }

  const resolvedOptions = readFormOptions(form, options);
  const submitButtons = resolveSubmitButtons(form);
  let isSubmitting = false;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    isSubmitting = true;
    setSubmittingState(submitButtons, true);

    if (!checkHoneypot(form, resolvedOptions.honeypotFieldName)) {
      setFormMessage(form, "error", resolvedOptions.honeypotMessage);
      setSubmittingState(submitButtons, false);
      isSubmitting = false;
      return;
    }

    if (isOnCooldown(resolvedOptions.formId, resolvedOptions.cooldownMs)) {
      setFormMessage(form, "error", resolvedOptions.cooldownMessage);
      setSubmittingState(submitButtons, false);
      isSubmitting = false;
      return;
    }

    const validation = validateForm(form);

    if (!validation.isValid) {
      setFormMessage(form, "error", resolvedOptions.validationMessage);
      setSubmittingState(submitButtons, false);
      isSubmitting = false;
      return;
    }

    const payload = buildLeadPayload(form, resolvedOptions);

    if (resolvedOptions.preventDuplicates && isDuplicateLead(payload, resolvedOptions.dedupeFields)) {
      setFormMessage(form, "error", "This request has already been submitted.");
      setSubmittingState(submitButtons, false);
      isSubmitting = false;
      return;
    }

    const saveResult = saveLead(payload);

    if (!saveResult.ok) {
      setFormMessage(form, "error", saveResult.error || resolvedOptions.errorMessage);
      form.dispatchEvent(
        new CustomEvent("bma:form-error", {
          detail: {
            formId: resolvedOptions.formId,
            error: saveResult.error || resolvedOptions.errorMessage
          }
        })
      );
      setSubmittingState(submitButtons, false);
      isSubmitting = false;
      return;
    }

    markSubmission(resolvedOptions.formId);
    setFormMessage(form, "success", resolvedOptions.successMessage);
    dispatchToast("success", "Lead captured successfully.");
    form.reset();
    form.dispatchEvent(
      new CustomEvent("bma:form-success", {
        detail: {
          formId: resolvedOptions.formId,
          payload
        }
      })
    );
    window.dispatchEvent(
      new CustomEvent("bma:form-success", {
        detail: {
          formId: resolvedOptions.formId,
          payload
        }
      })
    );
    setSubmittingState(submitButtons, false);
    isSubmitting = false;
  });

  form.dataset.formBound = "true";
}

export function initializeLeadForms(selector = "[data-lead-form]") {
  document.querySelectorAll(selector).forEach((form) => {
    handleLeadForm(form);
  });
}

export { LEAD_STORAGE_KEY, STORAGE_CONSENT_KEY, SUBMIT_LOG_KEY };
