const root = document.documentElement;
const loader = document.querySelector(".m_page-loader");
const pageContent = [...document.body.children].filter(
  (element) => element !== loader,
);
const loadingState = loader.querySelector(".m_page-loader__loading");
const introState = loader.querySelector(".m_page-loader__intro");
let introFallback;

const hero = document.querySelector(".l_hero");

if (hero) {
  let parallaxFrame = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const updateHeroParallax = () => {
    parallaxFrame = 0;
    const header = document.querySelector(".l_header");
    const distance = Math.max(
      0,
      (header?.getBoundingClientRect().bottom ?? 0) -
        hero.getBoundingClientRect().top,
    );
    const offset = reducedMotion.matches ? 0 : Math.min(distance * 0.2, 180);

    hero.style.setProperty("--hero-parallax-offset", `${offset}px`);
  };

  const scheduleHeroParallax = () => {
    if (!parallaxFrame) {
      parallaxFrame = window.requestAnimationFrame(updateHeroParallax);
    }
  };

  window.addEventListener("scroll", scheduleHeroParallax, { passive: true });
  window.addEventListener("resize", scheduleHeroParallax);
  reducedMotion.addEventListener("change", scheduleHeroParallax);
  updateHeroParallax();
}

pageContent.forEach((element) => {
  element.inert = true;
  element.setAttribute("aria-hidden", "true");
});

const revealPage = () => {
  if (!loader.isConnected) {
    return;
  }

  window.clearTimeout(introFallback);
  pageContent.forEach((element) => {
    element.inert = false;
    element.removeAttribute("aria-hidden");
  });
  root.classList.remove("l_page--preparing");
  loader.remove();
};

const startIntro = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealPage();
    return;
  }

  loadingState.setAttribute("aria-hidden", "true");
  introState.removeAttribute("aria-hidden");
  loader.classList.add("m_page-loader--intro");
  loader.addEventListener("animationend", (event) => {
    if (event.animationName === "m_page-loader-exit") {
      revealPage();
    }
  });
  introFallback = window.setTimeout(revealPage, 3500);
};

const imageReadiness = [...document.images].map((image) => {
  image.loading = "eager";

  return new Promise((resolve) => {
    const finish = () => {
      if (image.naturalWidth === 0) {
        console.error(`Unable to load image: ${image.currentSrc || image.src}`);
      }
      resolve();
    };

    if (image.complete) {
      finish();
      return;
    }

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
  });
});

Promise.all([document.fonts.ready, ...imageReadiness]).then(startIntro);
