import { ArrowLeft, type LucideIcon, Navigation, X } from "lucide-react";
import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const isMobile = () => window.matchMedia("(max-width: 699px)").matches;
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function DetailPanel({
  title,
  category,
  icon: Icon,
  onClose,
  onBack,
  onDirections,
  children,
  className = "",
  expanded: controlledExpanded,
  onExpandedChange,
}: {
  title: string;
  category: string;
  icon: LucideIcon;
  onClose: () => void;
  onBack?: () => void;
  onDirections?: () => void;
  children: ReactNode;
  className?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const [localExpanded, setLocalExpanded] = useState(false);
  const [offset, setOffset] = useState(0);
  const [entering, setEntering] = useState(true);
  const expanded = controlledExpanded ?? localExpanded;
  const drag = useRef<{
    y: number;
    delta: number;
    origin: number;
    target: Element;
    id: number;
  } | null>(null);
  const skipHandleClick = useRef(false);
  const closing = useRef<Animation | null>(null);
  const setExpanded = (value: boolean) => {
    setLocalExpanded(value);
    onExpandedChange?.(value);
  };
  const close = () => {
    const panel = panelRef.current;
    if (!panel || closing.current) return;
    if (reducedMotion()) {
      onClose();
      return;
    }
    closing.current = panel.animate(
      [
        { transform: getComputedStyle(panel).transform, opacity: 1 },
        isMobile()
          ? { transform: "translateY(100%)", opacity: 1 }
          : { transform: "translateY(16px)", opacity: 0 },
      ],
      { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    );
    closing.current.finished.then(onClose, () => {});
  };
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMobile() || !event.isPrimary || event.button !== 0 || drag.current || closing.current)
      return;
    const target = event.target as Element;
    const button = target.closest("button, a");
    if (button && !button.matches(".sheet-handle-button")) return;
    const capture = button ?? event.currentTarget;
    capture.setPointerCapture(event.pointerId);
    skipHandleClick.current = false;
    const transform = getComputedStyle(panelRef.current as HTMLElement).transform;
    const origin = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42;
    setEntering(false);
    setOffset(origin);
    drag.current = { y: event.clientY, delta: 0, origin, target: capture, id: event.pointerId };
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    drag.current.delta = event.clientY - drag.current.y;
    setOffset(
      drag.current.origin +
        (drag.current.delta > 0 ? drag.current.delta : drag.current.delta * 0.2),
    );
  };
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    drag.current = null;
    if (gesture.target.hasPointerCapture(gesture.id))
      gesture.target.releasePointerCapture(gesture.id);
    skipHandleClick.current = Math.abs(gesture.delta) > 4;
    if (!cancelled && gesture.delta > 56) {
      if (expanded && gesture.delta < (panelRef.current?.offsetHeight ?? 0) * 0.35)
        setExpanded(false);
      else close();
    } else if (!cancelled && gesture.delta < -40) setExpanded(true);
    setOffset(0);
  };
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.focus({ preventScroll: true });
    let height = panel.getBoundingClientRect().height;
    let resize: Animation | undefined;
    const observer = new ResizeObserver(() => {
      if (resize?.playState === "running") return;
      const nextHeight = panel.getBoundingClientRect().height;
      if (Math.abs(nextHeight - height) < 1) return;
      if (!reducedMotion()) {
        resize = panel.animate(
          {
            height: [`${height}px`, `${nextHeight}px`],
            maxHeight: [`${height}px`, `${nextHeight}px`],
          },
          { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }
      height = nextHeight;
    });
    observer.observe(panel);
    return () => {
      observer.disconnect();
      closing.current?.cancel();
      resize?.cancel();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      className={`detail-panel ${className} ${expanded ? "is-expanded" : ""} ${offset ? "is-dragging" : ""} ${entering ? "is-entering" : ""}`}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setEntering(false);
      }}
      aria-label={title}
      style={offset ? { transform: `translateY(${offset}px)` } : undefined}
    >
      <div
        className="sheet-drag-area"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={(event) => endDrag(event, true)}
        onLostPointerCapture={(event) => endDrag(event, true)}
      >
        <button
          type="button"
          className="sheet-handle-button"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${title}`}
          aria-expanded={expanded}
          onClick={(event) => {
            if (!skipHandleClick.current || event.detail === 0) setExpanded(!expanded);
          }}
        >
          <span className="sheet-handle" />
        </button>
        <header className="detail-header">
          {onBack ? (
            <button
              type="button"
              className="icon-button"
              onClick={onBack}
              aria-label="Back to events"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <span className="detail-category-icon">
              <Icon size={22} />
            </span>
          )}
          <div className="detail-heading">
            <span className="eyebrow">{category}</span>
            <h2 title={title}>{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={close} aria-label="Close details">
            <X size={20} />
          </button>
        </header>
      </div>
      {children}
      {onDirections && (
        <footer className="detail-actions">
          <button type="button" className="primary-button" onClick={onDirections}>
            <Navigation size={17} />
            Directions
          </button>
        </footer>
      )}
    </section>
  );
}
