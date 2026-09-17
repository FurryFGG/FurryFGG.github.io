const root = document.documentElement;
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const pageIntro = document.querySelector("[data-page-intro]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";

const scrollToPageTop = (behavior = "auto") => {
  window.scrollTo({ top: 0, left: 0, behavior });
};

const scrollToGalleryTabs = (behavior = "auto") => {
  const galleryTabList = document.querySelector(".gallery-tabs");
  if (galleryTabList) {
    galleryTabList.scrollIntoView({ behavior, block: "start" });
    return;
  }
  scrollToPageTop(behavior);
};

const normalizeGalleryEntryHash = () => {
  if (!location.hash.startsWith("#album-")) return;
  const activePanel = document.querySelector("[data-gallery-panel]:not([hidden])");
  const activeName = activePanel?.dataset.galleryPanel;
  if (activeName) history.replaceState(null, "", `#${activeName}`);
};

const resetPageEntryScroll = () => {
  normalizeGalleryEntryHash();
  scrollToPageTop("auto");
  window.requestAnimationFrame(() => {
    scrollToPageTop("auto");
    window.requestAnimationFrame(() => scrollToPageTop("auto"));
  });
};

let isHistoryNavigation = false;
let isIntentionalHashNavigation = false;

document.addEventListener(
  "click",
  (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;
    isIntentionalHashNavigation = true;
    window.setTimeout(() => {
      isIntentionalHashNavigation = false;
    }, 0);
  },
  { capture: true },
);

window.addEventListener("pageshow", resetPageEntryScroll);

window.addEventListener("popstate", () => {
  if (isIntentionalHashNavigation) {
    isIntentionalHashNavigation = false;
    return;
  }
  isHistoryNavigation = true;
  window.requestAnimationFrame(() => {
    resetPageEntryScroll();
    window.requestAnimationFrame(() => {
      isHistoryNavigation = false;
    });
  });
});

const galleryPhotoData = window.galleryPhotoData ?? {};
const photoGrids = [...document.querySelectorAll("[data-photo-grid]")];
const photoLightbox = document.querySelector("[data-photo-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxName = document.querySelector("[data-lightbox-name]");
const lightboxMedia = document.querySelector("[data-lightbox-media]");
const lightboxPrevious = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const lightboxClose = document.querySelector("[data-lightbox-close]");
const lightboxCounter = document.querySelector("[data-lightbox-counter]");
const lightboxFilename = document.querySelector("[data-lightbox-filename]");
const lightboxTime = document.querySelector("[data-lightbox-time]");
let lightboxItems = [];
let lightboxIndex = 0;
let lightboxTrigger = null;
let lightboxTransitionToken = 0;

const formatPhotoTakenAt = (value) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]} ${match[4]}:${match[5]}` : "";
};

const applyLightboxPhoto = (card, index) => {
  const name = card.dataset.photoName;
  const takenAt = card.dataset.photoTakenAt;
  lightboxImage.src = card.dataset.photoSrc;
  lightboxImage.alt = name;
  lightboxImage.width = Number(card.dataset.photoWidth);
  lightboxImage.height = Number(card.dataset.photoHeight);
  lightboxFilename.textContent = name;
  if (lightboxTime) {
    lightboxTime.textContent = formatPhotoTakenAt(takenAt);
    lightboxTime.dateTime = takenAt || "";
    lightboxTime.hidden = !takenAt;
  }
  if (lightboxCounter) {
    lightboxCounter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(lightboxItems.length).padStart(2, "0")}`;
  }
};

const showLightboxPhoto = async (index, direction = 0) => {
  if (!lightboxItems.length || !lightboxImage || !lightboxName || !lightboxFilename) return;
  const nextIndex = (index + lightboxItems.length) % lightboxItems.length;
  if (direction && nextIndex === lightboxIndex) return;

  lightboxIndex = nextIndex;
  const card = lightboxItems[nextIndex];
  const token = ++lightboxTransitionToken;
  lightboxImage.getAnimations().forEach((animation) => animation.cancel());
  lightboxName.getAnimations().forEach((animation) => animation.cancel());
  lightboxCounter?.getAnimations().forEach((animation) => animation.cancel());

  if (!direction || reducedMotion || typeof lightboxImage.animate !== "function") {
    applyLightboxPhoto(card, nextIndex);
    return;
  }

  lightboxMedia?.classList.add("is-switching");
  const preloader = new Image();
  const imageReady = new Promise((resolve) => {
    preloader.addEventListener("load", resolve, { once: true });
    preloader.addEventListener("error", resolve, { once: true });
    preloader.src = card.dataset.photoSrc;
    if (preloader.complete) resolve();
  });

  const outgoing = lightboxImage.animate(
    [
      { opacity: 1, filter: "blur(0)", transform: "translateX(0) scale(1)" },
      {
        opacity: 0,
        filter: "blur(4px)",
        transform: `translateX(${-direction * 24}px) scale(0.985)`,
      },
    ],
    { duration: 180, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
  );
  lightboxName.animate(
    [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(7px)" }],
    { duration: 150, easing: "ease-in", fill: "forwards" },
  );

  await Promise.all([imageReady, outgoing.finished.catch(() => undefined)]);
  if (token !== lightboxTransitionToken) return;

  lightboxImage.getAnimations().forEach((animation) => animation.cancel());
  lightboxName.getAnimations().forEach((animation) => animation.cancel());
  applyLightboxPhoto(card, nextIndex);

  const incoming = lightboxImage.animate(
    [
      {
        opacity: 0,
        filter: "blur(5px)",
        transform: `translateX(${direction * 28}px) scale(0.985)`,
      },
      { opacity: 1, filter: "blur(0)", transform: "translateX(0) scale(1)" },
    ],
    { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  );
  lightboxName.animate(
    [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
    { duration: 340, delay: 70, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" },
  );
  lightboxCounter?.animate([{ opacity: 0.35 }, { opacity: 1 }], {
    duration: 260,
    easing: "ease-out",
  });

  await incoming.finished.catch(() => undefined);
  if (token === lightboxTransitionToken) lightboxMedia?.classList.remove("is-switching");
};

const openPhotoLightbox = (trigger) => {
  if (!photoLightbox) return;
  const panel = trigger.closest("[data-gallery-panel]");
  lightboxItems = [...(panel?.querySelectorAll(".gallery-photo") ?? [])];
  lightboxIndex = lightboxItems.indexOf(trigger);
  lightboxTrigger = trigger;
  showLightboxPhoto(lightboxIndex);
  document.body.classList.add("lightbox-open");
  photoLightbox.showModal();
};

const closePhotoLightbox = () => {
  lightboxTransitionToken += 1;
  lightboxMedia?.classList.remove("is-switching");
  lightboxImage?.getAnimations().forEach((animation) => animation.cancel());
  if (photoLightbox?.open) photoLightbox.close();
};

photoGrids.forEach((grid) => {
  const photos = galleryPhotoData[grid.dataset.photoGrid] ?? [];
  const fragment = document.createDocumentFragment();

  photos.forEach((photo) => {
    const card = document.createElement("button");
    card.className = "gallery-photo reveal";
    card.type = "button";
    card.dataset.photoSrc = photo.src;
    card.dataset.photoName = photo.name;
    card.dataset.photoWidth = String(photo.width);
    card.dataset.photoHeight = String(photo.height);
    card.dataset.photoTakenAt = photo.takenAt ?? "";
    card.style.aspectRatio = `${photo.width} / ${photo.height}`;
    const aspectRatio = photo.width / photo.height;
    card.classList.add(aspectRatio >= 1 ? "is-landscape" : "is-portrait");
    if (aspectRatio >= 2.4) card.classList.add("is-panorama");
    card.setAttribute("aria-label", `全屏查看照片 ${photo.name}`);
    card.addEventListener("click", () => openPhotoLightbox(card));

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = "";
    image.width = photo.width;
    image.height = photo.height;
    image.loading = "lazy";
    image.decoding = "async";
    image.draggable = false;

    const caption = document.createElement("span");
    caption.className = "gallery-photo-caption";
    const captionName = document.createElement("span");
    captionName.textContent = photo.name;
    caption.append(captionName);

    if (photo.takenAt) {
      const captionTime = document.createElement("time");
      captionTime.dateTime = photo.takenAt;
      captionTime.textContent = formatPhotoTakenAt(photo.takenAt);
      caption.append(captionTime);
    }

    card.append(image, caption);
    fragment.append(card);
  });

  grid.append(fragment);
});

const galleryRowGap = 14;
let galleryLayoutFrame = 0;
let galleryResizeObserver = null;

const getCardRatio = (card) => Number(card.dataset.photoWidth) / Number(card.dataset.photoHeight);

const layoutGalleryGrid = (grid) => {
  const width = Math.floor(grid.getBoundingClientRect().width);
  const targetHeight = window.matchMedia("(max-width: 760px)").matches ? 190 : 280;
  const layoutKey = `${width}:${targetHeight}`;
  if (width <= 0 || grid.dataset.layoutKey === layoutKey) return;

  const cards = [...grid.querySelectorAll(".gallery-photo")];
  if (!cards.length) {
    grid.classList.add("is-layout-ready");
    return;
  }

  const rows = [];
  let currentCards = [];
  let currentRatio = 0;

  cards.forEach((card) => {
    const ratio = getCardRatio(card);
    if (!currentCards.length) {
      currentCards = [card];
      currentRatio = ratio;
      return;
    }

    const heightBefore =
      (width - galleryRowGap * (currentCards.length - 1)) / currentRatio;
    const heightWithCard =
      (width - galleryRowGap * currentCards.length) / (currentRatio + ratio);

    if (heightWithCard > targetHeight) {
      currentCards.push(card);
      currentRatio += ratio;
      return;
    }

    if (Math.abs(heightBefore - targetHeight) <= Math.abs(heightWithCard - targetHeight)) {
      rows.push({ cards: currentCards, fill: true });
      currentCards = [card];
      currentRatio = ratio;
      return;
    }

    currentCards.push(card);
    rows.push({ cards: currentCards, fill: true });
    currentCards = [];
    currentRatio = 0;
  });

  if (currentCards.length) rows.push({ cards: currentCards, fill: false });

  const fragment = document.createDocumentFragment();
  rows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "gallery-row";
    row.cards.forEach((card) => {
      const ratio = getCardRatio(card);
      card.style.flex = row.fill
        ? `${ratio.toFixed(6)} 1 0px`
        : `0 1 ${(ratio * targetHeight).toFixed(2)}px`;
      rowElement.append(card);
    });
    fragment.append(rowElement);
  });

  grid.replaceChildren(fragment);
  grid.dataset.layoutKey = layoutKey;
  grid.classList.add("is-layout-ready");
};

const scheduleGalleryLayouts = (scope = document) => {
  if (galleryLayoutFrame) return;
  galleryLayoutFrame = window.requestAnimationFrame(() => {
    const grids = scope === document ? photoGrids : [...scope.querySelectorAll("[data-photo-grid]")];
    grids.forEach(layoutGalleryGrid);
    galleryLayoutFrame = 0;
  });
};

if (photoGrids.length) {
  scheduleGalleryLayouts();
  window.addEventListener("resize", () => scheduleGalleryLayouts(), { passive: true });
  if ("ResizeObserver" in window) {
    galleryResizeObserver = new ResizeObserver(() => scheduleGalleryLayouts());
    photoGrids.forEach((grid) => galleryResizeObserver.observe(grid));
  }
}

lightboxMedia?.addEventListener("click", closePhotoLightbox);
lightboxClose?.addEventListener("click", closePhotoLightbox);
lightboxPrevious?.addEventListener("click", () => void showLightboxPhoto(lightboxIndex - 1, -1));
lightboxNext?.addEventListener("click", () => void showLightboxPhoto(lightboxIndex + 1, 1));

photoLightbox?.addEventListener("close", () => {
  document.body.classList.remove("lightbox-open");
  lightboxTrigger?.focus({ preventScroll: true });
  lightboxTrigger = null;
});

photoLightbox?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    void showLightboxPhoto(lightboxIndex - 1, -1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    void showLightboxPhoto(lightboxIndex + 1, 1);
  }
});

document.addEventListener("contextmenu", (event) => {
  if (event.target.closest?.(".gallery-photo, [data-photo-lightbox]")) event.preventDefault();
});

document.addEventListener("dragstart", (event) => {
  if (event.target.closest?.(".gallery-photo, [data-photo-lightbox]")) event.preventDefault();
});

document.querySelectorAll("[data-photo-count]").forEach((counter) => {
  const keys = counter.dataset.photoCount.split(",");
  const count = keys.reduce((total, key) => total + (galleryPhotoData[key]?.length ?? 0), 0);
  counter.textContent = String(count);
});

pageIntro?.addEventListener("animationend", (event) => {
  if (event.target === pageIntro && event.animationName === "intro-screen") {
    pageIntro.remove();
  }
});

const closeMenu = () => {
  nav?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  menuToggle?.setAttribute("aria-label", "打开导航");
  document.body.classList.remove("nav-open");
};

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  nav?.classList.toggle("is-open", !isOpen);
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "打开导航" : "关闭导航");
  document.body.classList.toggle("nav-open", !isOpen);
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

let viewportFrame = 0;

const updateViewportMotion = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 16);
  const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
  root.style.setProperty("--scroll-progress", String(progress));

  if (!reducedMotion && window.scrollY < window.innerHeight * 1.4) {
    root.style.setProperty("--hero-grid-y", `${window.scrollY * 0.08}px`);
  }

  viewportFrame = 0;
};

const scheduleViewportMotion = () => {
  if (viewportFrame) return;
  viewportFrame = window.requestAnimationFrame(updateViewportMotion);
};

updateViewportMotion();
window.addEventListener("scroll", scheduleViewportMotion, { passive: true });
window.addEventListener("resize", scheduleViewportMotion);

const revealElements = [...document.querySelectorAll(".reveal")];
const revealGroups = new Map();

revealElements.forEach((element) => {
  const parent = element.parentElement;
  const groupIndex = revealGroups.get(parent) ?? 0;
  element.style.setProperty("--reveal-delay", `${Math.min(groupIndex * 110, 330)}ms`);
  revealGroups.set(parent, groupIndex + 1);
});

const revealObserver = reducedMotion
  ? null
  : new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );

revealElements.forEach((element) => {
  if (revealObserver) {
    revealObserver.observe(element);
  } else {
    element.classList.add("is-visible");
  }
});

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...(nav?.querySelectorAll("a[href^='#']") ?? [])];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.hash === `#${visible.target.id}`);
    });
  },
  { rootMargin: "-25% 0px -58%", threshold: [0.05, 0.25, 0.5] },
);

sections.forEach((section) => sectionObserver.observe(section));

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());

const galleryTabs = [...document.querySelectorAll("[data-gallery-tab]")];
const galleryPanels = [...document.querySelectorAll("[data-gallery-panel]")];
const galleryLinks = [...document.querySelectorAll("[data-gallery-link]")];
const galleryFloatingIndex = document.querySelector("[data-gallery-floating-index]");
const galleryFloatingPanels = [...document.querySelectorAll("[data-floating-index-panel]")];
const galleryBackToTop = document.querySelector("[data-gallery-back-to-top]");
const gallerySection = document.querySelector(".gallery-section");
let galleryFloatingFrame = 0;

galleryBackToTop?.addEventListener("click", (event) => {
  event.preventDefault();
  const activePanel = galleryPanels.find((panel) => !panel.hidden);
  const activeName = activePanel?.dataset.galleryPanel;
  if (activeName) history.replaceState(null, "", `#${activeName}`);
  scrollToPageTop(reducedMotion ? "auto" : "smooth");
});

const galleryTabFromHash = () => {
  if (location.hash === "#aircraft" || location.hash.startsWith("#album-aircraft")) {
    return "aircraft";
  }
  if (location.hash === "#furry" || location.hash.startsWith("#album-luoqian") || location.hash.startsWith("#album-shouxingji")) {
    return "furry";
  }
  return "landscape";
};

const updateGalleryFloatingControls = () => {
  if (!galleryTabs.length) return;
  const activePanel = galleryPanels.find((panel) => !panel.hidden);
  const activeName = activePanel?.dataset.galleryPanel;
  const albumIndex = activePanel?.querySelector(".gallery-album-index");
  const headerBottom = header?.getBoundingClientRect().bottom ?? 72;
  const sectionRect = gallerySection?.getBoundingClientRect();
  const shouldShowIndex = Boolean(
    albumIndex &&
      sectionRect &&
      albumIndex.getBoundingClientRect().bottom < headerBottom + 12 &&
      sectionRect.bottom > headerBottom + 180,
  );

  galleryFloatingIndex?.classList.toggle("is-visible", shouldShowIndex);
  galleryFloatingPanels.forEach((panel) => {
    panel.hidden = panel.dataset.floatingIndexPanel !== activeName;
  });
};

const scheduleGalleryFloatingControls = () => {
  if (galleryFloatingFrame) return;
  galleryFloatingFrame = window.requestAnimationFrame(() => {
    updateGalleryFloatingControls();
    galleryFloatingFrame = 0;
  });
};

const activateGalleryTab = (
  name,
  { focus = false, updateHash = false, scrollToTop = false } = {},
) => {
  if (!galleryTabs.some((tab) => tab.dataset.galleryTab === name)) return;

  galleryTabs.forEach((tab) => {
    const isActive = tab.dataset.galleryTab === name;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    if (isActive && focus) tab.focus();
  });

  galleryPanels.forEach((panel) => {
    const isActive = panel.dataset.galleryPanel === name;
    panel.hidden = !isActive;

    if (isActive && !reducedMotion) {
      panel.classList.remove("is-entering");
      window.requestAnimationFrame(() => panel.classList.add("is-entering"));
    }
    if (isActive) scheduleGalleryLayouts(panel);
  });

  galleryLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.galleryLink === name);
  });

  if (updateHash) history.replaceState(null, "", `#${name}`);
  if (scrollToTop) {
    window.requestAnimationFrame(() => {
      scrollToGalleryTabs(reducedMotion ? "auto" : "smooth");
    });
  }
  scheduleGalleryFloatingControls();
};

galleryTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    activateGalleryTab(tab.dataset.galleryTab, { updateHash: true, scrollToTop: true });
  });

  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + step + galleryTabs.length) % galleryTabs.length;
    activateGalleryTab(galleryTabs[nextIndex].dataset.galleryTab, {
      focus: true,
      updateHash: true,
      scrollToTop: true,
    });
  });
});

galleryLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    activateGalleryTab(link.dataset.galleryLink, { updateHash: true, scrollToTop: true });
  });
});

if (galleryTabs.length) {
  const initialTab = galleryTabFromHash();
  activateGalleryTab(initialTab);
  normalizeGalleryEntryHash();
  window.requestAnimationFrame(() => scrollToPageTop("auto"));

  window.addEventListener("hashchange", () => {
    const isAlbumLink = location.hash.startsWith("#album-");
    activateGalleryTab(galleryTabFromHash(), {
      scrollToTop: !isAlbumLink && !isHistoryNavigation,
    });
    if (isHistoryNavigation) return;
    if (isAlbumLink) {
      window.requestAnimationFrame(() => {
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      });
    }
  });
  window.addEventListener("scroll", scheduleGalleryFloatingControls, { passive: true });
  window.addEventListener("resize", scheduleGalleryFloatingControls, { passive: true });
  updateGalleryFloatingControls();
}
