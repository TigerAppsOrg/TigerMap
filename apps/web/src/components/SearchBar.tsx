import { ArrowUpRight, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { POI } from "../types";
import { getCategoryIcon } from "../utils/categories";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  results: POI[];
  onPick: (poi: POI) => void;
}

export function SearchBar({ value, onChange, results, onPick }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const pick = (poi: POI) => {
    setOpen(false);
    onPick(poi);
  };
  const showDropdown = open && value.trim().length >= 2;

  return (
    <div className="search-bar">
      <div className="search-field">
        <Search size={19} aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Where to?"
          aria-label="Search campus"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
            if (!showDropdown || !results.length) return;
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) =>
                Math.max(0, Math.min(i + (e.key === "ArrowDown" ? 1 : -1), results.length - 1)),
              );
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(results[activeIdx] ?? results[0]);
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="search-results"
          aria-activedescendant={
            showDropdown && results.length ? `search-option-${results[activeIdx]?.id}` : undefined
          }
        />
        {value ? (
          <button
            type="button"
            className="icon-button"
            aria-label="Clear search"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
          >
            <X size={17} />
          </button>
        ) : (
          <kbd>⌘ K</kbd>
        )}
      </div>
      {showDropdown && (
        <div className="search-dropdown">
          <span className="eyebrow">Places on campus</span>
          {/* biome-ignore lint/a11y/useSemanticElements: custom combobox uses aria-activedescendant */}
          <div id="search-results" role="listbox" tabIndex={-1} aria-label="Search results">
            {results.map((poi, i) => {
              const Icon = getCategoryIcon(poi.cat);
              return (
                <button
                  key={poi.id}
                  id={`search-option-${poi.id}`}
                  // biome-ignore lint/a11y/useSemanticElements: selectable result in a custom combobox
                  role="option"
                  aria-selected={i === activeIdx}
                  type="button"
                  tabIndex={-1}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => pick(poi)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`place-row ${i === activeIdx ? "is-highlighted" : ""}`}
                >
                  <span className="place-icon">
                    <Icon size={18} />
                  </span>
                  <span className="place-row-copy">
                    <strong>{poi.name}</strong>
                    <span>{poi.cat}</span>
                  </span>
                  <ArrowUpRight size={16} className="row-arrow" />
                </button>
              );
            })}
          </div>
          {!results.length && (
            <p className="empty-state">
              No places match “{value.trim()}”. Try a building or library name.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
