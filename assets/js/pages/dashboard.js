import { getStoredLeads } from "../form-handler.js";

function setDashboardMetric(selector, value) {
  const node = document.querySelector(selector);
  if (!node) {
    return;
  }

  node.textContent = value;
}

function renderLeadMetrics() {
  const leads = getStoredLeads();
  setDashboardMetric("[data-dashboard-lead-count]", String(leads.length));

  if (leads.length > 0) {
    const lastLead = leads[leads.length - 1];
    setDashboardMetric("[data-dashboard-last-lead]", lastLead.submittedAt || "Recently submitted");
  } else {
    setDashboardMetric("[data-dashboard-last-lead]", "No leads stored yet");
  }
}

function initDashboardPage() {
  renderLeadMetrics();
}

window.addEventListener("bma:ready", initDashboardPage, { once: true });
