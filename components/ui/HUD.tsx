"use client";

import { useEffect, useState } from "react";
import { STATION_LIST } from "@/lib/data/stations";
import { LINES } from "@/lib/data/lines";
import { useMapStore } from "@/lib/store";
import StationInput from "./StationInput";
import RoutePanel from "./RoutePanel";
import StationCard from "./StationCard";
import Legend from "./Legend";

function TokyoClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="clock panel">
      <span className="time">{time}</span>
      <span className="label">TOKYO JST</span>
    </div>
  );
}

function Locate() {
  const select = useMapStore((s) => s.select);
  const selected = useMapStore((s) => s.selected);
  return (
    <div className="panel route-box">
      <div className="section-title">Locate</div>
      <StationInput
        value={selected}
        onSelect={(id) => select(id)}
        placeholder="Search station · 駅名検索…"
        icon="⌖"
      />
    </div>
  );
}

export default function HUD() {
  return (
    <div className="hud">
      <header className="brand panel">
        <h1>
          NEO TOKYO <span className="accent">TRANSIT</span>
        </h1>
        <div className="sub">
          <span>Rail Network Navigator</span>
          <span className="jp">東京交通網</span>
        </div>
        <div className="statusline">
          <span className="live">ONLINE</span>
          <span>
            <b>{LINES.length}</b> LINES
          </span>
          <span>
            <b>{STATION_LIST.length}</b> STATIONS
          </span>
        </div>
      </header>

      <div className="left-stack">
        <Locate />
        <RoutePanel />
      </div>

      <StationCard />
      <Legend />

      <div className="bottom-left">
        <div className="hints panel">
          <span>
            <b>DRAG</b> ORBIT
          </span>
          <span>
            <b>SCROLL</b> ZOOM
          </span>
          <span>
            <b>CLICK</b> STATION
          </span>
        </div>
        <TokyoClock />
      </div>
    </div>
  );
}
