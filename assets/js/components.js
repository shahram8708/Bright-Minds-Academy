const COMPONENT_FILES = {
  navbar: "navbar.html",
  footer: "footer.html",
  "whatsapp-float": "whatsapp-float.html",
  "alert-toast": "alert-toast.html",
  "demo-modal": "demo-modal.html",
  "cta-strip": "cta-strip.html"
};

const componentCache = new Map();

function normalizeRootPath(rootPath) {
  if (!rootPath) {
    return "./";
  }

  return rootPath.endsWith("/") ? rootPath : `${rootPath}/`;
}

function detectRootPath() {
  const configured = document.documentElement?.dataset?.rootPath;

  if (configured) {
    return normalizeRootPath(configured);
  }

  const currentPath = window.location.pathname.replace(/\\/g, "/");
  return currentPath.includes("/pages/") ? "../" : "./";
}

async function fetchComponentMarkup(componentName) {
  if (componentCache.has(componentName)) {
    return {
      ok: true,
      html: componentCache.get(componentName),
      error: null
    };
  }

  const fileName = COMPONENT_FILES[componentName];

  if (!fileName) {
    return {
      ok: false,
      html: "",
      error: `Component mapping not found for ${componentName}.`
    };
  }

  const rootPath = detectRootPath();
  const resource = `${rootPath}components/${fileName}`;

  try {
    const response = await fetch(resource, {
      headers: {
        Accept: "text/html"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load component ${componentName}. Status: ${response.status}`);
    }

    const html = await response.text();
    componentCache.set(componentName, html);

    return {
      ok: true,
      html,
      error: null
    };
  } catch (error) {
    return {
      ok: false,
      html: "",
      error: error instanceof Error ? error.message : "Component fetch error."
    };
  }
}

function mountMarkup(target, html) {
  if (!target) {
    return;
  }

  target.innerHTML = html;
  target.setAttribute("data-component-loaded", "true");
}

export async function mountComponents(scope = document) {
  const targets = Array.from(scope.querySelectorAll("[data-component]"));

  if (!targets.length) {
    window.dispatchEvent(
      new CustomEvent("bma:components-loaded", {
        detail: {
          mounted: [],
          failed: []
        }
      })
    );

    return {
      mounted: [],
      failed: []
    };
  }

  const mounted = [];
  const failed = [];

  await Promise.all(
    targets.map(async (target) => {
      const componentName = target.getAttribute("data-component")?.trim();

      if (!componentName) {
        failed.push({
          component: "unknown",
          reason: "Missing data-component value"
        });
        return;
      }

      const result = await fetchComponentMarkup(componentName);

      if (result.ok) {
        mountMarkup(target, result.html);
        mounted.push(componentName);
      } else {
        target.setAttribute("data-component-error", result.error || "unknown");
        failed.push({
          component: componentName,
          reason: result.error || "Unknown component error"
        });
      }
    })
  );

  window.dispatchEvent(
    new CustomEvent("bma:components-loaded", {
      detail: {
        mounted,
        failed
      }
    })
  );

  return {
    mounted,
    failed
  };
}

export function clearComponentCache(componentName) {
  if (componentName) {
    componentCache.delete(componentName);
    return;
  }

  componentCache.clear();
}
