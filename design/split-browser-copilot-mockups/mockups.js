const tabs = Array.from(document.querySelectorAll("[data-screen]"));
const artboards = Array.from(document.querySelectorAll("[data-artboard]"));

function activateScreen(screen, updateHash = true) {
  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.screen === screen);
  });

  artboards.forEach((artboard) => {
    artboard.classList.toggle("is-active", artboard.dataset.artboard === screen);
  });

  if (updateHash && window.location.hash.slice(1) !== screen) {
    window.location.hash = screen;
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateScreen(tab.dataset.screen));
});

window.addEventListener("hashchange", () => {
  const screen = window.location.hash.slice(1);
  if (tabs.some((tab) => tab.dataset.screen === screen)) {
    activateScreen(screen, false);
  }
});

const initialScreen = window.location.hash.slice(1);
if (tabs.some((tab) => tab.dataset.screen === initialScreen)) {
  activateScreen(initialScreen, false);
}
