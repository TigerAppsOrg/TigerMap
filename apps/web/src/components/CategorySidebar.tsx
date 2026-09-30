import { Check, X } from "lucide-react";
import { getCategoryIcon, getCategoryLabel } from "../utils/categories";

interface CategorySidebarProps {
  categories: { name: string; count: number }[];
  activeCategories: Set<string>;
  onToggle: (name: string) => void;
  onClear: () => void;
  onSelectAll: () => void;
  onClose: () => void;
}

export function CategorySidebar({
  categories,
  activeCategories,
  onToggle,
  onClear,
  onSelectAll,
  onClose,
}: CategorySidebarProps) {
  const allSelected = categories.every((category) => activeCategories.has(category.name));
  return (
    <section className="category-panel" aria-label="Map filters">
      <div className="section-heading">
        <h2>Map filters</h2>
        <button type="button" className="icon-button" aria-label="Close filters" onClick={onClose}>
          <X size={19} />
        </button>
      </div>
      <div className="category-list">
        {categories.map(({ name, count }) => {
          const active = activeCategories.has(name);
          const Icon = getCategoryIcon(name);
          return (
            <button
              key={name}
              type="button"
              className={`category-row ${active ? "is-active" : ""}`}
              aria-pressed={active}
              onClick={() => onToggle(name)}
            >
              <Icon size={18} />
              <span>{getCategoryLabel(name)}</span>
              <span className="category-count">{count}</span>
              <span className="category-check">{active && <Check size={13} />}</span>
            </button>
          );
        })}
      </div>
      <div className="category-footer">
        <span>{activeCategories.size} selected</span>
        <div className="category-actions">
          <button
            type="button"
            className="text-button"
            disabled={allSelected}
            onClick={onSelectAll}
          >
            Select all
          </button>
          <button
            type="button"
            className="text-button"
            disabled={!activeCategories.size}
            onClick={onClear}
          >
            Clear all
          </button>
        </div>
      </div>
    </section>
  );
}
