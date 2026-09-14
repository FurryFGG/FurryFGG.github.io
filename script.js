const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");

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

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 16);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.14 },
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
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

const activateGalleryTab = (name, { focus = false, updateHash = false } = {}) => {
  if (!galleryTabs.some((tab) => tab.dataset.galleryTab === name)) return;

  galleryTabs.forEach((tab) => {
    const isActive = tab.dataset.galleryTab === name;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    if (isActive && focus) tab.focus();
  });

  galleryPanels.forEach((panel) => {
    panel.hidden = panel.dataset.galleryPanel !== name;
  });

  galleryLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.galleryLink === name);
  });

  if (updateHash) history.replaceState(null, "", `#${name}`);
};

galleryTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    activateGalleryTab(tab.dataset.galleryTab, { updateHash: true });
  });

  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + step + galleryTabs.length) % galleryTabs.length;
    activateGalleryTab(galleryTabs[nextIndex].dataset.galleryTab, {
      focus: true,
      updateHash: true,
    });
  });
});

galleryLinks.forEach((link) => {
  link.addEventListener("click", () => {
    activateGalleryTab(link.dataset.galleryLink, { updateHash: true });
  });
});

if (galleryTabs.length) {
  const initialTab = location.hash === "#furry" ? "furry" : "landscape";
  activateGalleryTab(initialTab);
}
