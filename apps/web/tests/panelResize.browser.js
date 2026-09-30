// Run with agent-browser eval --stdin after opening a place detail panel
(async () => {
  const panel = document.querySelector(".detail-panel");
  const content = panel?.querySelector(".detail-content");
  if (!panel || !content) throw new Error("Open a place detail panel first");
  const originalMaxHeight = content.style.maxHeight;
  const before = panel.getBoundingClientRect().height;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    content.style.maxHeight = "24px";
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const resize = panel
      .getAnimations()
      .find((animation) => animation.effect.getKeyframes().some((frame) => frame.height));
    if (reduced && resize) throw new Error("Panel resize ignores reduced motion");
    if (!reduced && !resize) throw new Error("Panel content resized without a transition");
    if (resize) await resize.finished;
    const after = panel.getBoundingClientRect().height;
    if (after >= before) throw new Error("Panel did not adapt to the shorter content");
    return { passed: true, reducedMotion: reduced, before, after };
  } finally {
    content.style.maxHeight = originalMaxHeight;
  }
})();
