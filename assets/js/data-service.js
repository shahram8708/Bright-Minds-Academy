const DEFAULT_TIMEOUT_MS = 10000;

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

function toErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected data service error.";
}

async function fetchWithTimeout(resource, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(resource, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export class DataService {
  constructor(options = {}) {
    const rootPath = options.rootPath ?? detectRootPath();
    this.rootPath = normalizeRootPath(rootPath);
    this.dataPath = options.dataPath ?? `${this.rootPath}data/`;
    this.cache = new Map();
    this.inFlight = new Map();
  }

  async getJson(fileName, options = {}) {
    const forceRefresh = options.forceRefresh === true;

    if (!forceRefresh && this.cache.has(fileName)) {
      return {
        ok: true,
        data: this.cache.get(fileName),
        error: null,
        source: "cache"
      };
    }

    if (!forceRefresh && this.inFlight.has(fileName)) {
      return this.inFlight.get(fileName);
    }

    const request = this.fetchJson(fileName)
      .then((result) => {
        if (result.ok) {
          this.cache.set(fileName, result.data);
        }

        return result;
      })
      .finally(() => {
        this.inFlight.delete(fileName);
      });

    this.inFlight.set(fileName, request);
    return request;
  }

  async fetchJson(fileName) {
    const resource = `${this.dataPath}${fileName}`;

    try {
      const response = await fetchWithTimeout(resource);

      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}. Status: ${response.status}`);
      }

      const data = await response.json();

      return {
        ok: true,
        data,
        error: null,
        source: "network"
      };
    } catch (error) {
      return {
        ok: false,
        data: null,
        error: toErrorMessage(error),
        source: "network"
      };
    }
  }

  clearCache(fileName) {
    if (fileName) {
      this.cache.delete(fileName);
      return;
    }

    this.cache.clear();
  }

  getMeta(options) {
    return this.getJson("meta.json", options);
  }

  getPlans(options) {
    return this.getJson("plans.json", options);
  }

  getSubjects(options) {
    return this.getJson("subjects.json", options);
  }

  getFaqs(options) {
    return this.getJson("faqs.json", options);
  }

  getTestimonials(options) {
    return this.getJson("testimonials.json", options);
  }

  getSuccessStories(options) {
    return this.getJson("success_stories.json", options);
  }

  getSteps(options) {
    return this.getJson("steps.json", options);
  }

  getStats(options) {
    return this.getJson("stats.json", options);
  }

  getBlogPosts(options) {
    return this.getJson("blog_posts.json", options);
  }
}

export const dataService = new DataService();

export const getMeta = (options) => dataService.getMeta(options);
export const getPlans = (options) => dataService.getPlans(options);
export const getSubjects = (options) => dataService.getSubjects(options);
export const getFaqs = (options) => dataService.getFaqs(options);
export const getTestimonials = (options) => dataService.getTestimonials(options);
export const getSuccessStories = (options) => dataService.getSuccessStories(options);
export const getSteps = (options) => dataService.getSteps(options);
export const getStats = (options) => dataService.getStats(options);
export const getBlogPosts = (options) => dataService.getBlogPosts(options);
