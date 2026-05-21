import { getMeta } from "../data-service.js";
import { initScrollReveal } from "../animations.js";
import { clearChildren, createElement } from "../render.js";

function buildMapFrame(embedMarkup) {
  if (!embedMarkup) {
    return null;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(embedMarkup, "text/html");
  const iframe = doc.querySelector("iframe");

  if (!iframe) {
    return null;
  }

  const src = iframe.getAttribute("src") || "";

  if (!src) {
    return null;
  }

  return createElement("iframe", {
    attrs: {
      src,
      title: "Bright Minds Academy location map",
      loading: "lazy",
      referrerpolicy: "no-referrer-when-downgrade",
      allowfullscreen: "",
      style: "border:0;"
    }
  });
}

async function renderContactMap() {
  const host = document.querySelector("[data-contact-map]");
  if (!host) {
    return;
  }

  const result = await getMeta();

  if (!result.ok || !result.data?.mapEmbed) {
    clearChildren(host);
    host.appendChild(
      createElement("div", {
        className: "d-flex align-items-center justify-content-center h-100 text-muted",
        text: "Map details will be available soon."
      })
    );
    return;
  }

  const iframe = buildMapFrame(result.data.mapEmbed);

  if (!iframe) {
    clearChildren(host);
    host.appendChild(
      createElement("div", {
        className: "d-flex align-items-center justify-content-center h-100 text-muted",
        text: "Map details will be available soon."
      })
    );
    return;
  }

  clearChildren(host);
  host.appendChild(iframe);
}

function initContactPage() {
  renderContactMap();
  initScrollReveal(".reveal");
}

window.addEventListener("bma:ready", initContactPage, { once: true });
