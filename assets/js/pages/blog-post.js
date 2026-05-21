import { getBlogPosts } from "../data-service.js";
import { initScrollReveal } from "../animations.js";
import { clearChildren, createElement, createEmptyState } from "../render.js";

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

function readParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    slug: params.get("slug") || "",
    id: params.get("id") || ""
  };
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

function createTagBadge(tag) {
  return createElement("span", {
    className: "component-badge bg-secondary-subtle text-secondary",
    text: String(tag || "").trim()
  });
}

function updateMetaTags(post) {
  if (!post) {
    return;
  }

  const title = post.title ? `${post.title} | Bright Minds Academy` : "Blog Article | Bright Minds Academy";
  const description = post.excerpt || "";

  document.title = title;

  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta && description) {
    descriptionMeta.setAttribute("content", description);
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute("content", title);
  }

  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription && description) {
    ogDescription.setAttribute("content", description);
  }

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && post.image) {
    ogImage.setAttribute("content", post.image);
  }

  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute("content", title);
  }

  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription && description) {
    twitterDescription.setAttribute("content", description);
  }

  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage && post.image) {
    twitterImage.setAttribute("content", post.image);
  }
}

function updateText(target, value) {
  if (!target) {
    return;
  }

  target.textContent = value || "";
}

function renderHeroImage(host, post) {
  if (!host) {
    return;
  }

  clearChildren(host);

  if (!post?.image) {
    return;
  }

  host.appendChild(
    createElement("img", {
      className: "img-fluid rounded",
      attrs: {
        src: post.image,
        alt: post.imageAlt || post.title || "Blog cover",
        loading: "lazy"
      }
    })
  );
}

function renderTags(host, tags) {
  if (!host) {
    return;
  }

  clearChildren(host);

  if (!Array.isArray(tags) || tags.length === 0) {
    return;
  }

  tags.forEach((tag) => {
    if (!tag) {
      return;
    }
    host.appendChild(createTagBadge(tag));
  });
}

function createRelatedCard(post, index) {
  const col = createElement("div", {
    className: "col-md-6"
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
          alt: post.imageAlt || post.title || "Related article",
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
    createElement("h3", {
      className: "h6 mb-2",
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

  card.appendChild(
    createElement("a", {
      className: "btn btn-sm btn-brand-outline",
      text: "Read Article",
      attrs: {
        href: post?.slug
          ? `./blog-post.html?slug=${encodeURIComponent(post.slug)}`
          : post?.id
            ? `./blog-post.html?id=${encodeURIComponent(post.id)}`
            : "./blog-post.html"
      }
    })
  );

  col.appendChild(card);
  return col;
}

function renderRelatedPosts(host, posts, currentPost) {
  if (!host) {
    return;
  }

  setBusy(host, true);
  clearChildren(host);

  if (!currentPost) {
    setBusy(host, false);
    return;
  }

  const relatedIds = Array.isArray(currentPost.relatedPostIds) ? currentPost.relatedPostIds : [];

  const relatedPosts = relatedIds
    .map((id) => posts.find((post) => post.id === id))
    .filter(Boolean);

  if (relatedPosts.length === 0) {
    setBusy(host, false);
    return;
  }

  relatedPosts.forEach((post, index) => {
    host.appendChild(createRelatedCard(post, index));
  });

  setBusy(host, false);
}

function renderPost(post, posts) {
  const titleEl = document.querySelector("[data-blog-title]");
  const metaEl = document.querySelector("[data-blog-meta]");
  const excerptEl = document.querySelector("[data-blog-excerpt]");
  const heroEl = document.querySelector("[data-blog-hero]");
  const summaryEl = document.querySelector("[data-blog-summary]");
  const tagsEl = document.querySelector("[data-blog-tags]");
  const relatedHost = document.querySelector("[data-blog-related]");
  const relatedSection = document.querySelector("[data-blog-related-section]");

  updateText(titleEl, post?.title || "Article not available");
  updateText(metaEl, buildMetaLine(post));
  updateText(excerptEl, post?.excerpt || "");
  renderHeroImage(heroEl, post);
  if (summaryEl) {
    summaryEl.classList.remove("placeholder-panel");
  }
  renderTags(tagsEl, post?.tags || []);

  if (relatedSection) {
    relatedSection.hidden = true;
  }

  if (relatedHost) {
    renderRelatedPosts(relatedHost, posts, post);
    if (relatedSection && relatedHost.childElementCount > 0) {
      relatedSection.hidden = false;
    }
  }

  updateMetaTags(post);
  initScrollReveal(".reveal");
}

async function initBlogPostPage() {
  const article = document.querySelector("[data-blog-article]");
  if (!article) {
    return;
  }

  setBusy(article, true);

  const result = await getBlogPosts();

  if (!result.ok || !Array.isArray(result.data)) {
    clearChildren(article);
    article.appendChild(
      createEmptyState({
        title: "Article unavailable",
        message: "We could not load this article. Please try again later.",
        actionText: "View Blog",
        actionHref: "./blog.html"
      })
    );
    setBusy(article, false);
    return;
  }

  const posts = result.data;
  const params = readParams();

  const post =
    (params.slug ? posts.find((item) => item.slug === params.slug) : null) ||
    (params.id ? posts.find((item) => item.id === params.id) : null) ||
    posts[0] ||
    null;

  if (!post) {
    clearChildren(article);
    article.appendChild(
      createEmptyState({
        title: "Article not found",
        message: "The article you are looking for is not available.",
        actionText: "View Blog",
        actionHref: "./blog.html"
      })
    );
    setBusy(article, false);
    return;
  }

  renderPost(post, posts);
  setBusy(article, false);
}

window.addEventListener("bma:ready", initBlogPostPage, { once: true });
