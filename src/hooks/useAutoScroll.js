import { useEffect, useRef, useState } from "react";

/**
 * Auto-scrolls a container to the bottom whenever `dependency` changes,
 * but only if the user was already near the bottom — so scrolling up to
 * re-read history doesn't get yanked back down by a new message.
 */
export function useAutoScroll(dependency) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsNearBottom(distanceFromBottom < 120);
  };

  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependency]);

  return { containerRef, bottomRef, handleScroll, isNearBottom };
}
