// Data integrity + routing smoke test. Run with: node scripts/check-data.mjs
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Compile the TS data modules to a temp dir and exercise them.
const dir = mkdtempSync(join(tmpdir(), "tokyomap-check-"));
try {
  execSync(
    `npx tsc lib/graph.ts --outDir "${dir}" --module nodenext --moduleResolution nodenext --target es2020 --skipLibCheck`,
    { stdio: "inherit" },
  );
  writeFileSync(join(dir, "package.json"), JSON.stringify({ type: "commonjs" }));
  const run = `
    const { validateData, findRoute, getStationLines } = require(${JSON.stringify(
      join(dir, "graph.js"),
    )});
    const problems = validateData();
    if (problems.length) { console.error(problems.join("\\n")); process.exit(1); }
    console.log("data OK — stations:", getStationLines().size);
    const cases = [
      ["shibuya", "asakusa"],
      ["shinjuku", "toyosu"],
      ["daiba", "ikebukuro"],
      ["kichijoji", "kita-senju"],
      ["kamata", "oshiage"],
      ["mitaka", "kasai"],
    ];
    for (const [a, b] of cases) {
      const r = findRoute(a, b);
      if (!r) { console.error("no route", a, b); process.exit(1); }
      console.log(
        a, "->", b, ":", r.totalMinutes + "min,", r.transfers, "transfers,",
        r.legs.filter(l=>l.kind==="ride").map(l=>l.lineId).join(" > ")
      );
    }
  `;
  writeFileSync(join(dir, "run.js"), run);
  execSync(`node "${join(dir, "run.js")}"`, { stdio: "inherit" });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
