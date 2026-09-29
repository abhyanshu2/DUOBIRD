import { useEffect } from "react";

/**
 * Keeps the chat screen glued to the *visible* area of the phone.
 *
 * Why this exists: on iOS Safari (and some Android browsers) opening the
 * keyboard does NOT shrink the layout viewport. Instead the browser scrolls
 * the whole page up so the focused input is visible, which pushes the header
 * off the top of the screen. `100dvh` doesn't help because it ignores the
 * keyboard.
 *
 * Fix: while the chat is mounted we
 *   1. lock the document so the page itself can never scroll, and
 *   2. publish the real visible height/offset (window.visualViewport) as CSS
 *      variables (--app-h / --app-top) that the chat root uses.
 */
export function useViewportLock() {
  useEffect(() => {
    const root = document.documentElement;
    const vv = window.visualViewport;

    const update = () => {
      const h = vv ? vv.height : window.innerHeight;
      const top = vv ? vv.offsetTop : 0;
      root.style.setProperty("--app-h", `${Math.round(h)}px`);
      root.style.setProperty("--app-top", `${Math.round(top)}px`);
      // iOS may still nudge the page; snap it back.
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    root.classList.add("chat-locked");
    update();

    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      root.classList.remove("chat-locked");
      root.style.removeProperty("--app-h");
      root.style.removeProperty("--app-top");
    };
  }, []);
}
