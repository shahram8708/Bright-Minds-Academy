function isSafeHref(href) {
  if (!href) {
    return false;
  }

  const value = href.trim().toLowerCase();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("#")
  ) {
    return true;
  }

  return false;
}

export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (typeof options.text === "string") {
    element.textContent = options.text;
  }

  if (options.attrs && typeof options.attrs === "object") {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, String(value));
      }
    });
  }

  if (options.dataset && typeof options.dataset === "object") {
    Object.entries(options.dataset).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        element.dataset[key] = String(value);
      }
    });
  }

  if (Array.isArray(options.children)) {
    options.children.forEach((child) => {
      if (child instanceof Node) {
        element.appendChild(child);
      }
    });
  }

  return element;
}

export function setText(target, value) {
  if (!target) {
    return;
  }

  target.textContent = value == null ? "" : String(value);
}

export function clearChildren(target) {
  if (!target) {
    return;
  }

  while (target.firstChild) {
    target.removeChild(target.firstChild);
  }
}

export function renderStars(rating = 0, max = 5) {
  const wrapper = createElement("div", {
    className: "d-inline-flex align-items-center gap-1",
    attrs: {
      "aria-label": `${rating} out of ${max} stars`
    }
  });

  const roundedRating = Math.max(0, Math.min(max, Math.round(rating)));

  for (let index = 1; index <= max; index += 1) {
    const icon = createElement("i", {
      className: index <= roundedRating ? "bi bi-star-fill text-warning" : "bi bi-star text-secondary",
      attrs: {
        "aria-hidden": "true"
      }
    });

    wrapper.appendChild(icon);
  }

  return wrapper;
}

export function createBadge(text, variant = "gold") {
  const className = variant === "gold" ? "component-badge component-badge-gold" : "component-badge bg-secondary-subtle text-secondary";

  return createElement("span", {
    className,
    text
  });
}

export function createCtaLink({ text, href, variant = "primary", target = "_self" }) {
  const safeHref = isSafeHref(href) ? href : "#";
  const className =
    variant === "outline"
      ? "btn btn-brand-outline"
      : variant === "light"
        ? "btn btn-light"
        : "btn btn-brand-primary";

  const link = createElement("a", {
    className,
    text,
    attrs: {
      href: safeHref,
      target
    }
  });

  if (target === "_blank") {
    link.setAttribute("rel", "noopener noreferrer");
  }

  return link;
}

export function createFeatureList(features = []) {
  const list = createElement("ul", {
    className: "list-unstyled d-grid gap-2 mb-0"
  });

  if (!Array.isArray(features) || features.length === 0) {
    list.appendChild(
      createElement("li", {
        className: "text-muted",
        text: "Feature details will be added shortly."
      })
    );
    return list;
  }

  features.forEach((feature) => {
    const item = createElement("li", {
      className: "d-flex align-items-start gap-2"
    });

    item.appendChild(
      createElement("i", {
        className: "bi bi-check-circle-fill text-success mt-1",
        attrs: {
          "aria-hidden": "true"
        }
      })
    );

    item.appendChild(
      createElement("span", {
        text: String(feature)
      })
    );

    list.appendChild(item);
  });

  return list;
}

export function createEmptyState({ title, message, actionText, actionHref }) {
  const wrapper = createElement("div", {
    className: "state-empty"
  });

  wrapper.appendChild(
    createElement("h3", {
      className: "h5 mb-2",
      text: title || "No data available"
    })
  );

  wrapper.appendChild(
    createElement("p", {
      className: "mb-0",
      text: message || "Please check back soon."
    })
  );

  if (actionText && actionHref) {
    const actionWrap = createElement("div", {
      className: "mt-3"
    });
    actionWrap.appendChild(createCtaLink({ text: actionText, href: actionHref, variant: "outline" }));
    wrapper.appendChild(actionWrap);
  }

  return wrapper;
}
