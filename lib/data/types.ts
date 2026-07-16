export type Operator = "jr" | "metro" | "toei" | "waterfront";

export const OPERATOR_LABELS: Record<Operator, string> = {
  jr: "JR East",
  metro: "Tokyo Metro",
  toei: "Toei",
  waterfront: "Waterfront",
};

export interface StationDef {
  id: string;
  /** Romaji name */
  name: string;
  /** Japanese name */
  nameJa: string;
  lat: number;
  lng: number;
  /** Major hub — always labelled, larger node */
  major?: boolean;
}

export interface LineDef {
  id: string;
  name: string;
  nameJa: string;
  /** Line symbol used on signage, e.g. JY, G, M */
  shortName: string;
  color: string;
  operator: Operator;
  /** Scene Y elevation. Positive = elevated, negative = underground. */
  elevation: number;
  /** Closed loop line (last station connects back to first) */
  loop?: boolean;
  /** Ordered station ids */
  stations: string[];
}

/** Out-of-station walking transfer between two distinct station nodes */
export interface TransferDef {
  a: string;
  b: string;
  /** Walking time in minutes */
  minutes: number;
}
