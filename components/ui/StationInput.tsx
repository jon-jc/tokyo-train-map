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
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Reflect external value
  useEffect(() => {
    if (value && STATIONS[value]) setText(STATIONS[value].name);
    else if (!value) setText("");
  }, [value]);

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
    setText(STATIONS[id].name);
    setOpen(false);
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
        onFocus={() => text && setOpen(true)}
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
                onClick={() => choose(st.id)}
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
                <span>{st.name}</span>
                <span className="jp-name">{st.nameJa}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
