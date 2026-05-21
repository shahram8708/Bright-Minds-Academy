import { getBlogPosts } from "../data-service.js";
import { initScrollReveal } from "../animations.js";
import { clearChildren, createElement, createEmptyState } from "../render.js";

const MAX_TAGS = 3;

function setBusy(host, isBusy) {
  if (!host) {
    return;
  }

  host.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const parsed = parseDate(value);
  if (!parsed) {
    return value ? String(value) : "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(parsed);
}

function buildPostUrl(post) {
  if (post?.slug) {
    return `./blog-post.html?slug=${encodeURIComponent(post.slug)}`;
  }

  if (post?.id) {
    return `./blog-post.html?id=${encodeURIComponent(post.id)}`;
  }

  return "./blog-post.html";
}

function createTagBadge(tag) {
  return createElement("span", {
    className: "component-badge bg-secondary-subtle text-secondary",
    text: String(tag || "").trim()
  });
}

function createTagList(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return null;
  }

  const wrapper = createElement("div", {
    className: "d-flex flex-wrap gap-2 mb-3"
  });

  tags.slice(0, MAX_TAGS).forEach((tag) => {
    if (!tag) {
      return;
    }
    wrapper.appendChild(createTagBadge(tag));
  });

  return wrapper.childElementCount ? wrapper : null;
}

function buildMetaLine(post) {
  const parts = [];
  const dateText = formatDate(post?.date);

  if (dateText) {
    parts.push(dateText);
  }

  if (post?.category) {
    parts.push(post.category);
  }

  if (post?.readTime) {
    parts.push(post.readTime);
  }

  if (post?.author) {
    parts.push(`By ${post.author}`);
  }

  return parts.join(" | ");
}

function createLoadingCard() {
  const card = createElement("article", {
    className: "testimonial-card p-4 h-100 loading-card"
  });

  card.appendChild(createElement("div", { className: "placeholder-wave mb-2" }));
  card.appendChild(createElement("div", { className: "placeholder-wave mb-2" }));
  card.appendChild(createElement("div", { className: "placeholder-wave placeholder-sm" }));

  return card;
}

function renderLoading(host, count = 3) {
  clearChildren(host);

  for (let index = 0; index < count; index += 1) {
    const col = createElement("div", {
      className: "col-md-6 col-lg-4"
    });

    col.appendChild(createLoadingCard());
    host.appendChild(col);
  }
}

function createPostCard(post, index) {
  const col = createElement("div", {
    className: "col-md-6 col-lg-4"
  });

  const card = createElement("article", {
    className: "testimonial-card p-4 h-100 reveal"
  });
  card.style.transitionDelay = `${index * 70}ms`;

  if (post?.image) {
    card.appendChild(
      createElement("img", {
        className: "img-fluid rounded mb-3",
        attrs: {
          src: post.image,
          alt: post.imageAlt || post.title || "Blog cover",
          loading: "lazy"
        }
      })
    );
  }

  card.appendChild(
    createElement("p", {
      className: "section-kicker mb-2",
      text: post?.category || "Article"
    })
  );

  card.appendChild(
    createElement("h2", {
      className: "h5 mb-2",
      text: post?.title || "Untitled article"
    })
  );

  const metaLine = buildMetaLine(post);
  if (metaLine) {
    card.appendChild(
      createElement("p", {
        className: "small text-muted mb-2",
        text: metaLine
      })
    );
  }

  if (post?.excerpt) {
    card.appendChild(
      createElement("p", {
        className: "mb-3",
        text: post.excerpt
      })
    );
  }

  const tags = createTagList(post?.tags);
  if (tags) {
    card.appendChild(tags);
  }

  card.appendChild(
    createElement("a", {
      className: "btn btn-sm btn-brand-outline",
      text: "Read Article",
      attrs: {
        href: buildPostUrl(post),
        "aria-label": post?.title ? `Read ${post.title}` : "Read article"
      }
    })
  );

  col.appendChild(card);
  return col;
}

function sortPosts(posts) {
  return [...posts].sort((left, right) => {
    const leftDate = parseDate(left?.date)?.getTime() || 0;
    const rightDate = parseDate(right?.date)?.getTime() || 0;
    return rightDate - leftDate;
  });
}

async function renderBlogGrid() {
  const host = document.querySelector("[data-blog-grid]");
  if (!host) {
    return;
  }

  setBusy(host, true);
  renderLoading(host, 6);

  const result = await getBlogPosts();

  if (!result.ok || !Array.isArray(result.data)) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "Blog unavailable",
        message: "We are preparing fresh learning insights.",
        actionText: "Contact Us",
        actionHref: "./contact.html"
      })
    );
    setBusy(host, false);
    return;
  }

  const posts = sortPosts(result.data);

  if (!posts.length) {
    clearChildren(host);
    host.appendChild(
      createEmptyState({
        title: "No articles available",
        message: "New posts will be published soon."
      })
    );
    setBusy(host, false);
    return;
  }

  clearChildren(host);
  posts.forEach((post, index) => {
    host.appendChild(createPostCard(post, index));
  });

  setBusy(host, false);
  initScrollReveal(".reveal");
}

function initBlogPage() {
  renderBlogGrid();
}

window.addEventListener("bma:ready", initBlogPage, { once: true });
