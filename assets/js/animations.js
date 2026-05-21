function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animateCounter(targetNode) {
  const target = Number(targetNode.dataset.counterTarget || targetNode.textContent.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(target)) {
    return;
  }

  const duration = Number(targetNode.dataset.counterDuration || 1400);
  const suffix = targetNode.dataset.counterSuffix || "";
  const prefix = targetNode.dataset.counterPrefix || "";
  const decimals = Number(targetNode.dataset.counterDecimals || 0);

  if (prefersReducedMotion()) {
    targetNode.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
    return;
  }

  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;

    targetNode.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;

    if (progress < 1) {
      window.requestAnimationFrame(tick);
    }
  }

  window.requestAnimationFrame(tick);
}

export function initScrollReveal(selector = ".reveal") {
  const items = Array.from(document.querySelectorAll(selector));

  if (!items.length) {
    return;
  }

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  items.forEach((item) => observer.observe(item));
}

export function initCounters(selector = "[data-counter]") {
  const counters = Array.from(document.querySelectorAll(selector));

  if (!counters.length) {
    return;
  }

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    counters.forEach((counter) => animateCounter(counter));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        io.unobserve(entry.target);
      });
    },
    {
      threshold: 0.4
    }
  );

  counters.forEach((counter) => observer.observe(counter));
}

export function initProgressAnimations(selector = "[data-progress]") {
  const bars = Array.from(document.querySelectorAll(selector));

  if (!bars.length) {
    return;
  }

  const setProgress = (node) => {
    const value = Math.max(0, Math.min(100, Number(node.dataset.progress || 0)));
    node.style.width = `${value}%`;
    node.setAttribute("aria-valuenow", `${value}`);

    const progressHost = node.closest("[role=\"progressbar\"]");
    if (progressHost && progressHost !== node) {
      progressHost.setAttribute("aria-valuenow", `${value}`);
    }
  };

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    bars.forEach((bar) => setProgress(bar));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        setProgress(entry.target);
        io.unobserve(entry.target);
      });
    },
    {
      threshold: 0.2
    }
  );

  bars.forEach((bar) => observer.observe(bar));
}

export function initAnimations() {
  initScrollReveal();
  initCounters();
  initProgressAnimations();
}
