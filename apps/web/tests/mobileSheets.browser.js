// Run with agent-browser eval --stdin in an open mobile detail or directions sheet
(async () => {
  const panel = document.querySelector(".detail-panel");
  const handle = panel?.querySelector(".sheet-handle-button");
  if (!panel || !handle || !matchMedia("(width < 768px)").matches)
    throw new Error("Open a sheet at a mobile viewport first");
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const offset = () => {
    const transform = getComputedStyle(panel).transform;
    return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
  };
  const expanded = () => handle.getAttribute("aria-expanded") === "true";
  const pointer = (type, y) =>
    handle.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 12,
        pointerType: "touch",
        isPrimary: true,
        button: 0,
        clientY: y,
      }),
    );
  // Synthetic pointers cannot acquire native capture
  const capture = ["setPointerCapture", "hasPointerCapture", "releasePointerCapture"];
  const original = capture.map((name) => Element.prototype[name]);
  for (const name of capture) Element.prototype[name] = () => false;
  const swipe = async (delta, cancel = false) => {
    pointer("pointerdown", 400);
    pointer("pointermove", 400 + delta);
    await frame();
    assert(
      Math.abs(offset() - (delta > 0 ? delta : delta * 0.2)) < 2,
      "Sheet must follow the finger",
    );
    pointer(cancel ? "pointercancel" : "pointerup", 400 + delta);
    handle.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await frame();
  };
  try {
    await wait(400);
    if (expanded()) {
      handle.click();
      await wait(320);
    }
    const collapsedHeight = panel.getBoundingClientRect().height;
    await swipe(-80, true);
    assert(!expanded(), "Cancelled gesture must preserve expansion");
    await wait(320);
    assert(Math.abs(offset()) < 1, "Cancelled gesture must return to rest");
    await swipe(-80);
    assert(expanded(), "Swipe up must expand without a duplicate click");
    await wait(320);
    assert(
      panel.getBoundingClientRect().height >= collapsedHeight - 1,
      "Expansion must not shrink the sheet",
    );
    if (panel.matches(".directions-sheet") && panel.querySelector(".steps-wrap"))
      assert(
        panel.querySelector(".steps-wrap.steps-open"),
        "Directions expansion must reveal route steps",
      );
    await swipe(80);
    assert(
      !expanded() && panel.isConnected,
      "Short downward swipe must collapse an expanded sheet",
    );
    await wait(320);
    handle.click();
    await frame();
    assert(expanded(), "Handle must support keyboard activation");
    handle.click();
    await wait(320);
    await swipe(24);
    assert(!expanded() && panel.isConnected, "Short drag must not dismiss or toggle the sheet");
    await wait(320);
    assert(Math.abs(offset()) < 1, "Short drag must snap back without replaying entrance");
    await swipe(80);
    await wait(280);
    assert(!panel.isConnected, "Downward swipe must dismiss a collapsed sheet");
    return { passed: true, directions: panel.matches(".directions-sheet") };
  } finally {
    capture.forEach((name, index) => {
      Element.prototype[name] = original[index];
    });
  }
})();
