const PAGE = document.body.dataset.page;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeHref(href) {
  if (!href) return "";
  return href.replace(/^\.\//, "").replace(/^\//, "").trim();
}

function currentPageHref() {
  const path = window.location.pathname;
  const file = path.endsWith("/") ? "index.html" : (path.split("/").pop() || "index.html");
  return `${file}${window.location.search}`;
}

async function getJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function renderHeader(site, customPages) {
  const header = document.getElementById("site-header");
  if (!header) return;

  const extraNav = (customPages?.items || [])
    .filter((page) => page.showInNav && page.slug)
    .map((page) => ({
      label: page.navLabel || page.title,
      href: `page.html?slug=${encodeURIComponent(page.slug)}`,
      key: `custom-${page.slug}`
    }));

  const navItems = [...(site.navItems || []), ...extraNav];
  const current = normalizeHref(currentPageHref());

  const nav = navItems
    .map((item) => {
      const href = normalizeHref(item.href);
      const active = PAGE === item.key || href === current ? ' aria-current="page"' : "";
      return `<a href="${escapeHtml(href)}"${active}>${escapeHtml(item.label)}</a>`;
    })
    .join("");

  header.innerHTML = `
    <div class="brand">
      <div class="brand-mark" aria-hidden="true"></div>
      <div class="brand-copy">
        <h1>${escapeHtml(site.siteTitle)}</h1>
        <p>${escapeHtml(site.siteSubtitle)}</p>
      </div>
    </div>
    <div class="nav-wrap">
      <a class="top-cta" href="${escapeHtml(site.headerCtaHref)}">${escapeHtml(site.headerCtaText)}</a>
      <nav class="site-nav" aria-label="Main navigation">${nav}</nav>
    </div>
  `;
}

function renderFooter(site) {
  const footer = document.getElementById("site-footer");
  if (!footer) return;

  footer.innerHTML = `
    <p><strong>${escapeHtml(site.footerTitle)}</strong></p>
    <p>${escapeHtml(site.footerAddress)}</p>
    <p><a href="mailto:${escapeHtml(site.footerEmail)}">${escapeHtml(site.footerEmail)}</a> | <a href="tel:${escapeHtml(site.footerPhoneRaw)}">${escapeHtml(site.footerPhoneDisplay)}</a></p>
    <p>${escapeHtml(site.footerCopyright)}</p>
  `;
}

function formatEventDate(isoDate, timeZone) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Date TBD";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timeZone || "America/Indiana/Indianapolis"
  }).format(date);
}

function splitEvents(events) {
  const now = Date.now();
  const normalized = (events.items || []).map((item) => {
    const startsAt = item.startsAt || item.dateISO || "";
    const endsAt = item.endsAt || startsAt;
    const startTs = new Date(startsAt).getTime();
    const endTs = new Date(endsAt).getTime();

    return {
      ...item,
      startsAt,
      endsAt,
      _startTs: Number.isNaN(startTs) ? Number.MAX_SAFE_INTEGER : startTs,
      _endTs: Number.isNaN(endTs) ? Number.MAX_SAFE_INTEGER : endTs
    };
  });

  const upcoming = normalized.filter((item) => item._endTs >= now).sort((a, b) => a._startTs - b._startTs);
  const archived = normalized.filter((item) => item._endTs < now).sort((a, b) => b._startTs - a._startTs);

  return { upcoming, archived };
}

function renderEventCard(item, site) {
  const dateText = formatEventDate(item.startsAt, site.eventTimeZone);
  return `
    <article class="event-item">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <div class="event-meta">
        <span>${escapeHtml(dateText)}</span>
        <span>${escapeHtml(item.location || "Location TBD")}</span>
      </div>
      ${item.url ? `<p><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Event details</a></p>` : ""}
    </article>
  `;
}

function renderHome(home, initiatives, events, site) {
  const hero = document.getElementById("home-hero");
  if (hero) {
    hero.style.backgroundImage = `url('${home.heroImage}')`;
    hero.innerHTML = `
      <div class="hero-content">
        <h2 class="hero-title">${escapeHtml(home.heroTitle)}</h2>
        <p class="hero-tagline">${escapeHtml(home.heroTagline)}</p>
      </div>
    `;
  }

  setText("home-initiatives-title", home.initiativesHeading);
  setText("home-events-title", home.eventsHeading);

  const initiativeWrap = document.getElementById("home-initiatives");
  if (initiativeWrap) {
    initiativeWrap.innerHTML = (initiatives.items || [])
      .map(
        (item) => `
      <article class="card">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt)}" />
        <div class="card-body">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
        </div>
      </article>
    `
      )
      .join("");
  }

  const eventsWrap = document.getElementById("home-events");
  if (eventsWrap) {
    const upcoming = splitEvents(events).upcoming.slice(0, 3);
    eventsWrap.innerHTML = upcoming.length
      ? upcoming.map((item) => renderEventCard(item, site)).join("")
      : `<p class="empty-state">No upcoming events yet. Check back soon.</p>`;
  }
}

function renderEvents(page, events, site) {
  setText("events-title", page.title);
  setText("events-lead", page.lead);

  const upcomingWrap = document.getElementById("events-upcoming");
  const archivedWrap = document.getElementById("events-archived");
  if (!upcomingWrap || !archivedWrap) return;

  const { upcoming, archived } = splitEvents(events);

  upcomingWrap.innerHTML = upcoming.length
    ? upcoming.map((item) => renderEventCard(item, site)).join("")
    : `<p class="empty-state">No upcoming events yet.</p>`;

  archivedWrap.innerHTML = archived.length
    ? archived.map((item) => renderEventCard(item, site)).join("")
    : `<p class="empty-state">No past events archived yet.</p>`;
}

function renderResources(page, resources) {
  setText("resources-title", page.title);
  setText("resources-lead", page.lead);

  const wrap = document.getElementById("resources-list");
  if (!wrap) return;

  wrap.innerHTML = (resources.items || [])
    .map(
      (item) => `
    <article class="resource-item">
      <h3>${escapeHtml(item.title)}</h3>
      <p><strong>${escapeHtml(item.category)}</strong></p>
      <p>${escapeHtml(item.summary)}</p>
      <p><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">Open resource</a></p>
    </article>
  `
    )
    .join("");
}

function renderGetInvolved(page) {
  setText("involved-title", page.title);
  setText("involved-lead", page.lead);

  const wrap = document.getElementById("involved-options");
  if (!wrap) return;

  wrap.innerHTML = (page.options || [])
    .map(
      (item) => `
    <article class="card">
      <div class="card-body">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <p><a href="${escapeHtml(item.link)}">Learn more</a></p>
      </div>
    </article>
  `
    )
    .join("");
}

function renderAbout(page) {
  setText("about-title", page.title);
  setText("about-lead", page.lead);

  const wrap = document.getElementById("about-body");
  if (!wrap) return;

  wrap.innerHTML = (page.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function renderHistory(page) {
  setText("history-title", page.title);
  setText("history-lead", page.lead);

  const wrap = document.getElementById("history-body");
  if (wrap) {
    wrap.innerHTML = (page.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  }

  const mapLink = document.getElementById("history-map-link");
  if (mapLink) {
    mapLink.textContent = page.mapLinkText;
    mapLink.href = page.mapLinkUrl;
  }
}

function renderBlock(block) {
  if (block.type === "text") {
    const paragraphs = (block.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    return `
      <article class="event-item">
        ${block.heading ? `<h2>${escapeHtml(block.heading)}</h2>` : ""}
        ${paragraphs}
      </article>
    `;
  }

  if (block.type === "cards") {
    const cards = (block.cards || [])
      .map(
        (card) => `
          <article class="card">
            <div class="card-body">
              <h3>${escapeHtml(card.title)}</h3>
              <p>${escapeHtml(card.summary)}</p>
              ${card.link ? `<p><a href="${escapeHtml(card.link)}">Learn more</a></p>` : ""}
            </div>
          </article>
      `
      )
      .join("");

    return `
      <section>
        ${block.heading ? `<h2 class="section-title section-subtitle">${escapeHtml(block.heading)}</h2>` : ""}
        <div class="card-grid">${cards}</div>
      </section>
    `;
  }

  if (block.type === "cta") {
    return `
      <article class="resource-item">
        ${block.heading ? `<h2>${escapeHtml(block.heading)}</h2>` : ""}
        ${block.body ? `<p>${escapeHtml(block.body)}</p>` : ""}
        ${block.buttonLabel && block.buttonLink ? `<p><a href="${escapeHtml(block.buttonLink)}">${escapeHtml(block.buttonLabel)}</a></p>` : ""}
      </article>
    `;
  }

  return "";
}

function renderCustomPage(customPages) {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const page = (customPages.items || []).find((item) => item.slug === slug);

  const titleWrap = document.getElementById("custom-page-title");
  const heroWrap = document.getElementById("custom-page-hero");
  const blocksWrap = document.getElementById("custom-page-blocks");

  if (!titleWrap || !heroWrap || !blocksWrap) return;

  if (!page) {
    titleWrap.innerHTML = `<h1>Page not found</h1><p class="lead">This custom page does not exist yet.</p>`;
    blocksWrap.innerHTML = `<p class="empty-state">Try selecting a valid custom page from navigation.</p>`;
    return;
  }

  titleWrap.innerHTML = `
    <h1>${escapeHtml(page.title)}</h1>
    ${page.lead ? `<p class="lead">${escapeHtml(page.lead)}</p>` : ""}
  `;

  if (page.heroImage) {
    heroWrap.innerHTML = `<div class="hero" style="background-image: url('${escapeHtml(page.heroImage)}')"></div>`;
  }

  blocksWrap.innerHTML = (page.blocks || []).map((block) => renderBlock(block)).join("");
}

async function boot() {
  try {
    const [site, home, about, history, eventsPage, resourcesPage, involvedPage, customPages, initiatives, events, resources] = await Promise.all([
      getJson("content/settings/site.json"),
      getJson("content/pages/home.json"),
      getJson("content/pages/about.json"),
      getJson("content/pages/history.json"),
      getJson("content/pages/events.json"),
      getJson("content/pages/resources.json"),
      getJson("content/pages/get-involved.json"),
      getJson("content/pages/custom-pages.json"),
      getJson("content/collections/initiatives.json"),
      getJson("content/collections/events.json"),
      getJson("content/collections/resources.json")
    ]);

    renderHeader(site, customPages);
    renderFooter(site);

    if (PAGE === "home") renderHome(home, initiatives, events, site);
    if (PAGE === "about") renderAbout(about);
    if (PAGE === "history") renderHistory(history);
    if (PAGE === "events") renderEvents(eventsPage, events, site);
    if (PAGE === "resources") renderResources(resourcesPage, resources);
    if (PAGE === "get-involved") renderGetInvolved(involvedPage);
    if (PAGE === "custom") renderCustomPage(customPages);
  } catch (error) {
    console.error(error);
    document.body.innerHTML = `<main class="page-shell"><h1>Could not load site content.</h1><p>${escapeHtml(error.message)}</p></main>`;
  }
}

boot();
