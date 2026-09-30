import { ExternalLink, MapPin, Pizza } from "lucide-react";
import type { FreefoodPost } from "../types";
import { parseList } from "../utils/api";
import { DetailPanel } from "./DetailPanel";

interface FreefoodDetailProps {
  post: FreefoodPost;
  onClose: () => void;
  onDirections: () => void;
}

function timeAgo(dateStr: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs} hr ago` : `${Math.floor(hrs / 24)} days ago`;
}

export function FreefoodDetail({ post, onClose, onDirections }: FreefoodDetailProps) {
  return (
    <DetailPanel
      title={post.subject}
      category="Free food"
      icon={Pizza}
      onClose={onClose}
      onDirections={onDirections}
    >
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to scrollable content */}
      <div tabIndex={0} className="detail-content">
        <div className="event-meta">
          <span>
            <MapPin size={14} />
            {post.location_name}
          </span>
          <time dateTime={post.date}>{timeAgo(post.date)}</time>
        </div>
        {post.body_text && <p className="event-body">{post.body_text.split("-----")[0].trim()}</p>}
        {parseList(post.images).map((_, i) => (
          <img
            key={`${post.id}-${i}`}
            src={`/api/freefood/image/${post.id}/${i}`}
            alt={`Food announcement from ${post.author_name}`}
            className="event-photo"
            loading="lazy"
          />
        ))}
        <div className="event-source">
          <p>From {post.author_name}</p>
          {post.listserv_url && (
            <a href={post.listserv_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} />
              Original post
            </a>
          )}
        </div>
      </div>
    </DetailPanel>
  );
}
