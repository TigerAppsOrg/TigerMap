import { ArrowUpRight, ExternalLink, Users } from "lucide-react";
import { useEffect, useState } from "react";
import type { EatingClub } from "../types";
import { getJSON, parseList } from "../utils/api";
import { DetailPanel } from "./DetailPanel";

interface EatingClubDetailProps {
  club: EatingClub;
  onClose: () => void;
  onDirections: () => void;
}

interface FullEvent {
  id: number;
  subject: string;
  author_name: string;
  date: string;
  body_text: string;
  images: string;
  listserv_url: string;
  event_type: string | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** LISTSERV-hosted attachments need the API's login; other hosts load directly. */
function imageSrc(event: FullEvent, url: string, index: number): string {
  return url.includes("lists.princeton.edu") ? `/api/eating-clubs/image/${event.id}/${index}` : url;
}

export function EatingClubDetail({ club, onClose, onDirections }: EatingClubDetailProps) {
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FullEvent | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    getJSON<{ events?: FullEvent[] }>(
      `/api/eating-clubs/${encodeURIComponent(club.name)}/events?limit=20`,
      { signal: controller.signal, cache: retry ? "reload" : "default" },
    )
      .then((data) => {
        setEvents(data.events ?? []);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [club.name, retry]);

  return (
    <DetailPanel
      title={club.name}
      category="Eating club"
      icon={Users}
      onClose={onClose}
      onDirections={onDirections}
      onBack={selectedEvent ? () => setSelectedEvent(null) : undefined}
    >
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to scrollable content */}
      <div tabIndex={0} className="detail-content" key={selectedEvent?.id ?? status}>
        {selectedEvent ? (
          <>
            <h3 className="event-title">{selectedEvent.subject}</h3>
            <div className="event-meta">
              <span>{selectedEvent.event_type || "Club event"}</span>
              <time dateTime={selectedEvent.date}>{formatDate(selectedEvent.date)}</time>
            </div>
            {selectedEvent.body_text && <p className="event-body">{selectedEvent.body_text}</p>}
            {parseList(selectedEvent.images).map((url, i) => (
              <img
                key={url}
                src={imageSrc(selectedEvent, url, i)}
                alt={`Event announcement from ${club.name}`}
                className="event-photo"
                loading="lazy"
              />
            ))}
            <div className="event-source">
              <p>From {selectedEvent.author_name}</p>
              {selectedEvent.listserv_url && (
                <a href={selectedEvent.listserv_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  Original post
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="menu-date">
              <span>Recent events</span>
              <span>{status === "ready" ? events.length : ""}</span>
            </div>
            {status === "loading" && (
              <div className="places-skeleton" aria-label="Loading events">
                <span />
                <span />
                <span />
              </div>
            )}
            {status === "error" && (
              <p className="empty-state">
                Events couldn’t load.{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setRetry((n) => n + 1)}
                >
                  Try again
                </button>
              </p>
            )}
            {status === "ready" && !events.length && (
              <p className="empty-state">No recent events have been posted.</p>
            )}
            {status === "ready" &&
              events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="event-row"
                  onClick={() => setSelectedEvent(event)}
                >
                  <span>
                    <strong>{event.subject}</strong>
                    <span>
                      {formatDate(event.date)}
                      {event.event_type ? ` · ${event.event_type}` : ""}
                    </span>
                  </span>
                  <ArrowUpRight size={17} />
                </button>
              ))}
          </>
        )}
      </div>
    </DetailPanel>
  );
}
