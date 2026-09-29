export function scrollToMessage(id) {
  const el = document.getElementById(`msg-${id}`);
  if (!el) return;
  // Scroll only the message list, never the page itself.
  const container = el.closest(".overflow-y-auto");
  if (container) {
    const top =
      el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top, behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  el.classList.add("ring-2", "ring-primary/60", "rounded-2xl");
  setTimeout(() => el.classList.remove("ring-2", "ring-primary/60", "rounded-2xl"), 1200);
}