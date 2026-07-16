import { LINE_MAP } from "./lines";
import type { Lang } from "../store";

/**
 * Wayfinding layer: station exits, optimal transfer passages and
 * walking-transfer directions. Curated for the busiest interchanges;
 * everywhere else falls back to Tokyo's excellent color-coded signage.
 * Guidance is approximate — station layouts change, always follow
 * on-site signs.
 */

export interface Hint {
  en: string;
  ja: string;
}

/** Notable exits per station (bilingual labels, shown as chips). */
export const STATION_EXITS: Record<string, string[]> = {
  shibuya: [
    "Hachiko Exit ハチ公口",
    "Miyamasuzaka Exit 宮益坂口",
    "New South Exit 新南口",
    "Scramble Square B6",
  ],
  shinjuku: [
    "East Exit 東口",
    "West Exit 西口",
    "South Exit 南口",
    "Busta Shinjuku バスタ新宿",
  ],
  tokyo: [
    "Marunouchi Central 丸の内中央口",
    "Yaesu North 八重洲北口",
    "Yaesu South 八重洲南口",
    "Keiyo Street 京葉ストリート",
  ],
  ikebukuro: ["East Exit 東口", "West Exit 西口", "Metropolitan Exit メトロポリタン口"],
  ueno: ["Park Exit 公園口", "Central Exit 中央改札", "Shinobazu Exit 不忍口"],
  akihabara: ["Electric Town 電気街口", "Central Exit 中央改札", "Showa-dori 昭和通り口"],
  ginza: ["A1–A5 (Ginza 4-chome)", "B1–B10 (Chuo-dori)", "C1–C9 (Harumi-dori)"],
  shimbashi: ["Hibiya Exit 日比谷口 (SL Square)", "Karasumori Exit 烏森口", "Shiodome Exit 汐留口"],
  shinagawa: ["Takanawa Exit 高輪口", "Konan Exit 港南口"],
  asakusa: ["Exit 1 (Kaminarimon 雷門)", "Exit 4 (Sumida Park)", "Exit A4 (Tobu/Skytree side)"],
  roppongi: ["Exit 1 (Roppongi Hills)", "Exit 4a (Midtown)", "Exit 7 (Gaien-Higashi)"],
  otemachi: ["A1–A5 (Palace side)", "B1–B10 (Marunouchi)", "C1–C14 (Otemachi Tower)"],
  "kita-senju": ["West Exit 西口", "East Exit 東口 (University side)"],
  oshiage: ["A2/B3 (Skytree Town ソラマチ)", "A1 (Narihirabashi)"],
  toyosu: ["Exit 1 (LaLaport)", "Exit 6 (Toyosu Market side)", "Exit 7 (Yurikamome)"],
  daiba: ["North Exit (Aqua City)", "South Exit (Fuji TV フジテレビ)"],
  kinshicho: ["North Exit 北口 (Olinas)", "South Exit 南口 (Parco)"],
  meguro: ["Central Exit 中央口", "West Exit 西口"],
  ebisu: ["East Exit 東口 (Garden Place skywalk)", "West Exit 西口"],
  harajuku: ["Omotesando Exit 表参道口", "Takeshita Exit 竹下口"],
  "meiji-jingumae": ["Exit 2 (Meiji Shrine 明治神宮)", "Exit 4 (Takeshita-dori)", "Exit 7 (Omotesando)"],
  yurakucho: ["Central Exit 中央口", "Hibiya Exit 日比谷口", "Kyobashi Exit 京橋口"],
  hibiya: ["A1–A14 (Hibiya Park / Midtown)", "B1–B7 (Imperial Hotel side)"],
  kasumigaseki: ["A1–A13 (Ministries 官庁街)", "C1–C4 (Hibiya Park)"],
  iidabashi: ["West Exit 西口 (JR)", "B1–B5 (Kagurazaka 神楽坂)", "A1–A5 (Canal side)"],
  takadanobaba: ["Waseda Exit 早稲田口", "BIGBOX Exit"],
  nakano: ["North Exit 北口 (Sun Mall/Broadway)", "South Exit 南口"],
  kichijoji: ["Park Exit 公園口 (Inokashira)", "Central Exit 中央口 (Sun Road)"],
  mitaka: ["South Exit 南口 (Ghibli bus)", "North Exit 北口"],
  hikarigaoka: ["A2 (Hikarigaoka Park)", "A5 (IMA shopping)"],
  tsukiji: ["Exit 1 (Honganji 本願寺)", "Exit A1 (Outer Market 場外市場)"],
  tsukishima: ["Exit 7 (Monja Street もんじゃ通り)", "Exit 10 (Oedo Line)"],
  akabane: ["East Exit 東口", "West Exit 西口"],
  kamata: ["East Exit 東口", "West Exit 西口"],
  nippori: ["East Exit 東口", "West Exit 西口 (Yanaka 谷中)"],
  "tokyo-big-sight": ["Main Exit (Big Sight 東京ビッグサイト)"],
  "shinjuku-sanchome": ["A1–A5 (Isetan 伊勢丹)", "E1–E10 (Marui side)"],
  kudanshita: ["Exit 1/2 (Budokan 武道館)", "Exit 4 (Yasukuni-dori)"],
  jimbocho: ["A1–A7 (Bookstore district 古書店街)"],
  "azabu-juban": ["Exit 1 (Juban shopping street)", "Exit 6 (Roppongi Hills side)"],
  "monzen-nakacho": ["Exit 1 (Tomioka Hachiman 富岡八幡宮)", "Exit 6 (Fukagawa Fudo)"],
};

/**
 * How to reach a given line inside a station — keyed `station|toLineId`.
 * Written to be direction-agnostic ("to reach line X, do Y").
 */
export const TRANSFER_HINTS: Record<string, Hint> = {
  // ---- cross-platform gems ----
  "omotesando|ginza": {
    en: "Cross-platform with the Hanzomon Line — the orange G train stops directly opposite",
    ja: "半蔵門線と同一ホーム — 向かい側が銀座線です",
  },
  "omotesando|hanzomon": {
    en: "Cross-platform with the Ginza Line — the purple Z train stops directly opposite",
    ja: "銀座線と同一ホーム — 向かい側が半蔵門線です",
  },
  "omotesando|chiyoda": {
    en: "One level down from the G/Z island — follow the green C signs",
    ja: "銀座線・半蔵門線ホームの一つ下 — 緑のCサインへ",
  },
  "akasaka-mitsuke|ginza": {
    en: "Same platform as the Marunouchi Line — cross the island",
    ja: "丸ノ内線と同一ホーム — 島式ホームの反対側へ",
  },
  "akasaka-mitsuke|marunouchi": {
    en: "Same platform as the Ginza Line — cross the island",
    ja: "銀座線と同一ホーム — 島式ホームの反対側へ",
  },
  "kotake-mukaihara|yurakucho-line": {
    en: "Cross-platform transfer — the Y train is directly opposite",
    ja: "同一ホームで乗換 — 向かい側が有楽町線です",
  },
  "kotake-mukaihara|fukutoshin": {
    en: "Cross-platform transfer — the F train is directly opposite",
    ja: "同一ホームで乗換 — 向かい側が副都心線です",
  },
  "meguro|namboku": {
    en: "Namboku and Mita Line trains share the same platforms",
    ja: "南北線と三田線は同じホームです",
  },
  "meguro|mita-line": {
    en: "Mita and Namboku Line trains share the same platforms",
    ja: "三田線と南北線は同じホームです",
  },
  "shirokane-takanawa|namboku": {
    en: "Shared platforms with the Mita Line — check the destination board",
    ja: "三田線と共用ホーム — 行先表示をご確認ください",
  },
  "shirokane-takanawa|mita-line": {
    en: "Shared platforms with the Namboku Line — check the destination board",
    ja: "南北線と共用ホーム — 行先表示をご確認ください",
  },
  "shirokanedai|namboku": {
    en: "Shared platforms with the Mita Line",
    ja: "三田線と共用ホームです",
  },
  "shirokanedai|mita-line": {
    en: "Shared platforms with the Namboku Line",
    ja: "南北線と共用ホームです",
  },
  "oshiage|asakusa-line": {
    en: "Same platform — Asakusa Line trains continue from the Hanzomon tracks",
    ja: "同一ホーム — 浅草線は半蔵門線と直結しています",
  },
  "oshiage|hanzomon": {
    en: "Same platform — Hanzomon trains continue from the Asakusa Line tracks",
    ja: "同一ホーム — 半蔵門線は浅草線と直結しています",
  },
  "nakano-sakaue|marunouchi": {
    en: "Main-line trains use the island platform — branch trains stop alongside",
    ja: "本線は島式ホーム — 支線は同ホーム発着です",
  },
  "nakano-sakaue|marunouchi-branch": {
    en: "Honancho branch trains leave from the same platform, No. 3 track",
    ja: "方南町支線は同ホーム3番線から発車します",
  },
  "tochomae|oedo": {
    en: "Loop-bound trains: cross to the opposite platform",
    ja: "環状部方面へは向かい側ホームへ",
  },
  "tochomae|oedo-branch": {
    en: "Hikarigaoka trains: cross to the opposite platform",
    ja: "光が丘方面へは向かい側ホームへ",
  },

  // ---- big hubs: which exit/passage to aim for ----
  "shibuya|ginza": {
    en: "Take the Exit B6 escalators up to Level 3 of Scramble Square — orange G signs",
    ja: "B6方面のエスカレーターでスクランブルスクエア3階へ — 橙のGサイン",
  },
  "shibuya|fukutoshin": {
    en: "Head down to B5 via the central concourse — brown F signs",
    ja: "中央改札からB5階へ — 茶色のFサイン",
  },
  "shibuya|hanzomon": {
    en: "B3 level, shared with Tokyu lines — purple Z signs from the Hachiko gate",
    ja: "B3階（東急線と共用）— ハチ公改札から紫のZサインへ",
  },
  "shibuya|yamanote": {
    en: "Up to the JR gates by the Hachiko Exit — green JY signs",
    ja: "ハチ公口のJR改札へ — 緑のJYサイン",
  },
  "shibuya|saikyo": {
    en: "JR South gates — the Saikyo platforms are on the New South side",
    ja: "JR南改札へ — 埼京線ホームは新南口寄りです",
  },
  "shinjuku|oedo": {
    en: "Use the Southern Terrace end — magenta E signs, the platform is 7 floors down",
    ja: "サザンテラス寄りへ — 桃色のEサイン、ホームは地下7階です",
  },
  "shinjuku|shinjuku-line": {
    en: "Toward the East Exit basement (Lumine side) — leaf-green S signs",
    ja: "東口地下（ルミネ側）へ — 黄緑のSサイン",
  },
  "shinjuku|marunouchi": {
    en: "Via the West Exit underground plaza — red M signs by the Odakyu gates",
    ja: "西口地下広場経由 — 小田急改札そばの赤いMサイン",
  },
  "shinjuku|yamanote": {
    en: "JR Central East or West gates — platforms 14/15",
    ja: "JR中央東口・西口改札 — 14・15番線",
  },
  "shinjuku|chuo-rapid": {
    en: "JR gates, platforms 7/8 — orange JC signs",
    ja: "JR改札、7・8番線 — 橙のJCサイン",
  },
  "shinjuku|chuo-sobu": {
    en: "JR gates, platforms 12/13 — yellow JB signs",
    ja: "JR改札、12・13番線 — 黄色のJBサイン",
  },
  "shinjuku|saikyo": {
    en: "JR gates, platforms 1–4 on the south side",
    ja: "JR改札、南寄りの1〜4番線",
  },
  "tokyo|marunouchi": {
    en: "Follow red M signs to the Marunouchi North underground gates",
    ja: "赤いMサインに従い丸の内北口地下改札へ",
  },
  "tokyo|yamanote": {
    en: "JR Marunouchi or Yaesu gates — platforms 4/5",
    ja: "JR丸の内・八重洲改札 — 4・5番線",
  },
  "tokyo|chuo-rapid": {
    en: "JR gates — Chuo platforms 1/2 are one level up",
    ja: "JR改札 — 中央線1・2番線は高架上です",
  },
  "tokyo|keihin-tohoku": {
    en: "JR gates — platforms 3/6",
    ja: "JR改札 — 3・6番線",
  },
  "ikebukuro|marunouchi": {
    en: "Red M signs under the East Exit — gates by Seibu department store",
    ja: "東口地下の赤いMサイン — 西武百貨店側改札",
  },
  "ikebukuro|yurakucho-line": {
    en: "Gold Y signs — platforms under the West Exit (Tobu side)",
    ja: "金色のYサイン — 西口（東武側）地下ホーム",
  },
  "ikebukuro|fukutoshin": {
    en: "Brown F signs — the deepest platforms, below the Yurakucho Line",
    ja: "茶色のFサイン — 有楽町線の下、最深部ホーム",
  },
  "ginza|ginza": {
    en: "Orange G signs — platforms under Ginza 4-chome crossing (A-exits side)",
    ja: "橙のGサイン — 銀座四丁目交差点直下（A出口側）",
  },
  "ginza|marunouchi": {
    en: "Red M signs — platforms on the C-exits (Harumi-dori) side",
    ja: "赤いMサイン — C出口（晴海通り）側ホーム",
  },
  "ginza|hibiya": {
    en: "Silver H signs — platforms on the B-exits (Chuo-dori) side",
    ja: "銀色のHサイン — B出口（中央通り）側ホーム",
  },
  "otemachi|tozai": {
    en: "Light-blue T signs — T platforms sit under Otemachi Tower (C-exits)",
    ja: "水色のTサイン — 大手町タワー（C出口）直下",
  },
  "otemachi|marunouchi": {
    en: "Red M signs — western end of the complex, toward Tokyo Station",
    ja: "赤いMサイン — 東京駅寄りの西側エリア",
  },
  "otemachi|chiyoda": {
    en: "Green C signs — central spine of the complex",
    ja: "緑のCサイン — 駅中央部",
  },
  "otemachi|hanzomon": {
    en: "Purple Z signs — northern end, allow ~5 min through the passages",
    ja: "紫のZサイン — 北側エリア、通路移動約5分",
  },
  "otemachi|mita-line": {
    en: "Blue I signs — eastern end near A-exits, allow ~5 min",
    ja: "青のIサイン — A出口寄り東側、移動約5分",
  },
  "ueno|ginza": {
    en: "Orange G signs from the JR Central gate basement",
    ja: "JR中央改札地下から橙のGサインへ",
  },
  "ueno|hibiya": {
    en: "Silver H signs — Showa-dori side, near Exit 9",
    ja: "銀色のHサイン — 昭和通り側、9番出口付近",
  },
  "kita-senju|hibiya": {
    en: "H trains leave from the ground-level JR-side platforms",
    ja: "日比谷線は地上のJR併設ホームから発車します",
  },
  "kita-senju|chiyoda": {
    en: "Green C signs — underground platforms below the West Exit",
    ja: "緑のCサイン — 西口地下ホーム",
  },
  "iidabashi|tozai": {
    en: "Light-blue T signs — closest to the JR West Exit",
    ja: "水色のTサイン — JR西口に最も近いホーム",
  },
  "iidabashi|oedo": {
    en: "Magenta E signs — deep C-exit side, allow ~5 min",
    ja: "桃色のEサイン — C出口側の深部、移動約5分",
  },
  "iidabashi|yurakucho-line": {
    en: "Gold Y signs — B-exit (Kagurazaka) side",
    ja: "金色のYサイン — B出口（神楽坂）側",
  },
  "iidabashi|namboku": {
    en: "Teal N signs — shared concourse with the Yurakucho Line",
    ja: "青緑のNサイン — 有楽町線と共通コンコース",
  },
  "yotsuya|marunouchi": {
    en: "The Marunouchi platform is above ground — up the stairs by the Akasaka gate",
    ja: "丸ノ内線ホームは地上です — 赤坂口側の階段を上へ",
  },
  "yotsuya|namboku": {
    en: "Teal N signs — deep below the JR platforms",
    ja: "青緑のNサイン — JRホームの深部下",
  },
  "kudanshita|hanzomon": {
    en: "Z platforms adjoin the Tozai concourse — purple signs",
    ja: "紫のZサイン — 東西線コンコース隣接",
  },
  "kudanshita|shinjuku-line": {
    en: "Leaf-green S signs — one level below the Metro lines",
    ja: "黄緑のSサイン — メトロ各線の一つ下",
  },
  "kuramae|oedo": {
    en: "Street transfer: exit A4, walk ~2 min south along Edo-dori to the Oedo entrance",
    ja: "地上乗換：A4出口から江戸通りを南へ徒歩約2分で大江戸線入口",
  },
  "kuramae|asakusa-line": {
    en: "Street transfer: surface via A6, walk ~2 min north along Edo-dori",
    ja: "地上乗換：A6出口から江戸通りを北へ徒歩約2分",
  },
  "ryogoku|oedo": {
    en: "Leave the JR West Exit and walk ~4 min west — the E station is by the Edo-Tokyo Museum",
    ja: "JR西口から西へ徒歩約4分 — 江戸東京博物館前が大江戸線駅です",
  },
  "ryogoku|chuo-sobu": {
    en: "From the Oedo platforms, exit A4 leads to the JR West Exit (~4 min)",
    ja: "大江戸線A4出口からJR西口へ徒歩約4分",
  },
  "shimbashi|yurikamome": {
    en: "Head for the Shiodome (East) Exit — the U terminal is on the elevated deck",
    ja: "汐留口（東側）へ — ゆりかもめ乗り場は高架デッキ上",
  },
  "shimbashi|ginza": {
    en: "Orange G signs under the Hibiya Exit",
    ja: "日比谷口地下の橙のGサイン",
  },
  "shimbashi|asakusa-line": {
    en: "Rose A signs — Karasumori Exit side",
    ja: "薔薇色のAサイン — 烏森口側",
  },
  "shinjuku-sanchome|marunouchi": {
    en: "Red M signs — platforms under Isetan (A-exits)",
    ja: "赤いMサイン — 伊勢丹（A出口）直下",
  },
  "shinjuku-sanchome|fukutoshin": {
    en: "Brown F signs — deep platforms on the Marui (E-exits) side",
    ja: "茶色のFサイン — マルイ（E出口）側の深部",
  },
  "shinjuku-sanchome|shinjuku-line": {
    en: "Leaf-green S signs — eastern end of the concourse",
    ja: "黄緑のSサイン — コンコース東端",
  },
  "ochanomizu|marunouchi": {
    en: "Leave the JR Ochanomizubashi gate and cross to the Metro entrance by the river (~2 min)",
    ja: "JR御茶ノ水橋口から神田川沿いのメトロ入口へ徒歩約2分",
  },
  "ochanomizu|chuo-sobu": {
    en: "From the M platforms, surface and cross to the JR Ochanomizubashi gate (~2 min)",
    ja: "丸ノ内線から地上経由でJR御茶ノ水橋口へ徒歩約2分",
  },
  "ebisu|hibiya": {
    en: "Silver H signs — gates below the JR West Exit rotary",
    ja: "銀色のHサイン — JR西口ロータリー地下",
  },
  "nihombashi|tozai": {
    en: "Light-blue T signs — B-exits side of the concourse",
    ja: "水色のTサイン — B出口側コンコース",
  },
  "nihombashi|ginza": {
    en: "Orange G signs — under the Takashimaya (A-exits) side",
    ja: "橙のGサイン — 高島屋（A出口）側",
  },
  "nihombashi|asakusa-line": {
    en: "Rose A signs — eastern end, D-exits",
    ja: "薔薇色のAサイン — 東側D出口方面",
  },
  "kasumigaseki|chiyoda": {
    en: "Green C signs — platforms under the A-exits (ministries side)",
    ja: "緑のCサイン — A出口（官庁側）直下",
  },
  "kasumigaseki|marunouchi": {
    en: "Red M signs — central concourse",
    ja: "赤いMサイン — 中央コンコース",
  },
  "kasumigaseki|hibiya": {
    en: "Silver H signs — B-exits end",
    ja: "銀色のHサイン — B出口側",
  },
};

/**
 * Walking transfers between separate stations — keyed with both ids
 * sorted, text written symmetrically.
 */
const walkKey = (a: string, b: string) => [a, b].sort().join("+");

export const WALK_HINTS: Record<string, Hint> = {
  [walkKey("yurakucho", "hibiya")]: {
    en: "Connected underground — follow the D-exit passage between the stations",
    ja: "地下直結 — D出口方面の連絡通路をご利用ください",
  },
  [walkKey("hibiya", "ginza")]: {
    en: "Walk the Hibiya–Ginza underground corridor along Harumi-dori (exits C1→C9)",
    ja: "晴海通り沿いの地下通路（C1→C9出口方面）を直進",
  },
  [walkKey("ginza", "ginza-itchome")]: {
    en: "Surface at Exit C8 and walk 250 m north on Chuo-dori to the Y-line entrances",
    ja: "C8出口から中央通りを北へ250m、有楽町線入口へ",
  },
  [walkKey("otemachi", "tokyo")]: {
    en: "Use the Marunouchi underground walkway — B2c side, about 6 min",
    ja: "丸の内地下通路（B2c方面）経由で約6分",
  },
  [walkKey("shimbashi", "shiodome")]: {
    en: "Take the Shiodome Exit — the underground deck leads straight to E/U gates",
    ja: "汐留口から地下デッキで直結しています",
  },
  [walkKey("meiji-jingumae", "harajuku")]: {
    en: "Exit 2 surfaces directly opposite the JR Omotesando gate",
    ja: "2番出口を出るとJR表参道改札の目の前です",
  },
  [walkKey("shinjuku", "shinjuku-nishiguchi")]: {
    en: "Through the West Exit underground plaza — follow E signs past the Odakyu gates",
    ja: "西口地下広場を経由し、小田急改札前からEサインへ",
  },
  [walkKey("shinjuku", "tochomae")]: {
    en: "Underground corridor toward the Metropolitan Government buildings (~6 min)",
    ja: "都庁方面の地下通路を約6分直進",
  },
  [walkKey("ueno-hirokoji", "okachimachi")]: {
    en: "Exit A1 comes up beside the JR Okachimachi North gate",
    ja: "A1出口がJR御徒町北口のすぐ横です",
  },
  [walkKey("naka-okachimachi", "okachimachi")]: {
    en: "Exit A1 → one block west under the JR tracks",
    ja: "A1出口からJR高架沿いに西へ1ブロック",
  },
  [walkKey("ueno-okachimachi", "okachimachi")]: {
    en: "Exit A8 surfaces by the JR South gate",
    ja: "A8出口がJR南口前に出ます",
  },
  [walkKey("ueno-hirokoji", "ueno-okachimachi")]: {
    en: "Directly linked inside the same underground concourse",
    ja: "同一地下コンコース内で直結しています",
  },
  [walkKey("akihabara", "iwamotocho")]: {
    en: "JR Showa-dori gate → 3 min south along Showa-dori to exits A2/A4",
    ja: "JR昭和通り口から昭和通りを南へ3分、A2・A4出口へ",
  },
  [walkKey("ogawamachi", "awajicho")]: {
    en: "Same underground concourse — just follow the passage",
    ja: "同一地下コンコースで直結しています",
  },
  [walkKey("ogawamachi", "shin-ochanomizu")]: {
    en: "Linked passage below Yasukuni-dori — B-exits end",
    ja: "靖国通り下の連絡通路（B出口側）",
  },
  [walkKey("awajicho", "shin-ochanomizu")]: {
    en: "Connected through the Ogawamachi concourse",
    ja: "小川町コンコース経由で直結",
  },
  [walkKey("kasuga", "korakuen")]: {
    en: "Shared station complex — escalators link the M/N and E/I concourses",
    ja: "同一駅舎 — エスカレーターで各線コンコースが直結",
  },
  [walkKey("kokuritsu-kyogijo", "sendagaya")]: {
    en: "Exit A4 faces the JR Sendagaya gate across the stadium plaza",
    ja: "A4出口から競技場前広場を渡るとJR千駄ケ谷駅です",
  },
  [walkKey("bakuroyokoyama", "higashi-nihombashi")]: {
    en: "Direct B1 passage — follow the A/S transfer signs",
    ja: "地下1階の連絡通路で直結（乗換サイン順路）",
  },
  [walkKey("hamamatsucho", "daimon")]: {
    en: "JR North gate → exits B1/B2 are just across Daimon-dori",
    ja: "JR北口改札から大門通りを渡ってB1・B2出口へ",
  },
  [walkKey("takanawa-gateway", "sengakuji")]: {
    en: "Surface and walk one block north on Daiichi-Keihin to exit A2",
    ja: "第一京浜を北へ1ブロック、A2出口へ",
  },
  [walkKey("mita", "tamachi")]: {
    en: "Exits A2/A4 surface right by the JR Mita gate",
    ja: "A2・A4出口がJR三田改札のすぐそばです",
  },
  [walkKey("nagatacho", "akasaka-mitsuke")]: {
    en: "One continuous underground complex — follow the G/M transfer corridor (~3 min)",
    ja: "地下で一体の駅 — G・M乗換通路を約3分",
  },
  [walkKey("tameike-sanno", "kokkai-gijidomae")]: {
    en: "Linked concourse — the G/N and M/C platforms share passageways",
    ja: "連絡コンコースで直結 — 通路サインに従ってください",
  },
  [walkKey("toranomon", "toranomon-hills")]: {
    en: "Underground pedestrian deck toward Toranomon Hills tower (~4 min)",
    ja: "虎ノ門ヒルズ方面の地下歩行者デッキで約4分",
  },
  [walkKey("kokusai-tenjijo", "tokyo-big-sight")]: {
    en: "Surface and cross the promenade toward Big Sight (~4 min)",
    ja: "地上のプロムナードをビッグサイト方面へ約4分",
  },
  [walkKey("kyobashi", "takaracho")]: {
    en: "Exit 5 → two blocks east along Yaesu-dori to exits A5/A6",
    ja: "5番出口から八重洲通りを東へ2ブロック、A5・A6出口へ",
  },
  [walkKey("hatchobori", "kayabacho")]: {
    en: "Walk Eitai-dori west — exits A4/A5 to Kayabacho exits 1/2 (~5 min)",
    ja: "永代通りを西へ — A4・A5出口から茅場町1・2番出口へ約5分",
  },
  [walkKey("suidobashi", "kasuga")]: {
    en: "JR East gate → 5 min along Hakusan-dori to exit A2 (Tokyo Dome side)",
    ja: "JR東口から白山通りを5分、A2出口（東京ドーム側）へ",
  },
};

/** Fallback template when no curated hint exists. */
export function getTransferHint(
  stationId: string,
  toLineId: string,
  lang: Lang,
): string {
  const hit = TRANSFER_HINTS[`${stationId}|${toLineId}`];
  if (hit) return hit[lang];
  const line = LINE_MAP[toLineId];
  if (!line) return "";
  return lang === "ja"
    ? `${line.nameJa}（${line.shortName}）の乗換サインに従ってください`
    : `Follow the ${line.shortName} · ${line.name} transfer signs`;
}

export function getWalkHint(a: string, b: string, lang: Lang): string | null {
  const hit = WALK_HINTS[walkKey(a, b)];
  return hit ? hit[lang] : null;
}
