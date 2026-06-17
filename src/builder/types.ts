import type { LayoutKind } from "../layoutCatalog";

export type FormSegment = {
  accent: string;
  durationSeconds: string;
  itemsText: string;
  layout: LayoutKind;
  metric: string;
  subtitle: string;
  title: string;
  valuesText: string;
  videoShown: boolean;
};
