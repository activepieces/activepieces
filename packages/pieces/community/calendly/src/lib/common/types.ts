export interface CalendlyEventType {
  uri: string;
  name: string;
  active: boolean;
  slug: string;
  scheduling_url: string;
  duration: number;
  kind: string;
  type: string;
}

export interface CalendlyEventTypeList {
  collection: CalendlyEventType[];
}
