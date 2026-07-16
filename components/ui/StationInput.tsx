"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { STATIONS } from "@/lib/data/stations";
import { LINE_MAP } from "@/lib/data/lines";
import { searchStations } from "@/lib/search";
import { getStationLines } from "@/lib/graph";
import { useT, stationName, stationNameAlt } from "@/lib/i18n";

export default function StationInput({
  value,
  onSelect,
  placeholder,
  icon = "◎",
  variant = "",
}: {
  value: string | null;
  onSelect: (id: string | null) => void;
  placeholder: string;
  icon?: string;
  variant?: "from" | "to" | "";
}) {
  const { lang } = useT();
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Reflect external value (and re-render it on language change)
  useEffect(() => {
    if (value && STATIONS[value]) setText(stationName(STATIONS[value], lang));
    else if (!value) setText("");
  }, [value, lang]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const results = open ? searchStations(text) : [];

  const choose = (id: string) => {
    onSelect(id);
    setText(stationName(STATIONS[id], lang));
    setOpen(false);
    // Selection is complete — release focus so the next click/typing
    // goes where the user aims it
    inputRef.current?.blur();
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[Math.min(active, results.length - 1)].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={`field ${variant}`} ref={wrapRef}>
      <span className="icon">{icon}</span>
      <input
        ref={inputRef}
        value={text}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listId}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(0);
          if (e.target.value === "") onSelect(null);
        }}
        onFocus={(e) => {
          e.target.select();
          if (text) setOpen(true);
        }}
        onBlur={() => {
          // Delay lets a suggestion pointerdown land first
          window.setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={onKey}
      />
      {open && results.length > 0 && (
        <div className="suggest" id={listId} role="listbox">
          {results.map((st, i) => {
            const lineIds = getStationLines().get(st.id) ?? [];
            return (
              <button
                key={st.id}
                role="option"
                aria-selected={i === active}
                className={i === active ? "active" : ""}
                onPointerEnter={() => setActive(i)}
                onPointerDown={(e) => {
                  // Choose before the input blurs; keep focus where it is
                  e.preventDefault();
                  choose(st.id);
                }}
              >
                <span className="line-dots">
                  {lineIds.slice(0, 5).map((l) => (
                    <span
                      key={l}
                      className="line-dot"
                      style={{ background: LINE_MAP[l].color, color: LINE_MAP[l].color }}
                    />
                  ))}
                </span>
                <span>{stationName(st, lang)}</span>
                <span className="jp-name">{stationNameAlt(st, lang)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
