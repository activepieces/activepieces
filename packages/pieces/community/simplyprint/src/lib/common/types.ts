export interface PrinterModelInfo {
  id?: number;
  name?: string;
  brand?: string;
  [key: string]: unknown;
}

export interface Printer {
  id: number;
  sort_order?: number;
  printer?: {
    name?: string;
    state?: string;
    group?: number;
    online?: boolean;
    tags?: number[];
    model?: PrinterModelInfo;
    [key: string]: unknown;
  };
  filament?: unknown;
  job?: unknown;
}

export interface QueueItem {
  id: number;
  filename?: string | null;
  // Legacy alias retained because older webhook samples used `file_name`.
  file_name?: string | null;
  group?: number | null;
  sort_order?: number | null;
  left?: number | null;
  printed?: number | null;
  filesystem_id?: string | null;
  user_id?: number | null;
  added?: string | null;
}

export interface QueueGroup {
  id: number;
  name: string;
}

export interface PrintFile {
  id: number;
  name: string;
  folder_id?: number | null;
  size?: number | null;
  file_type?: string | null;
}

export interface Filament {
  id: number;
  uid?: string | null;
  brand?: string | null;
  type?: { id?: number; name?: string } | string | null;
  colorName?: string | null;
  colorHex?: string | null;
  colorGroup?: string | null;
  left?: number | null;
  total?: number | null;
  printer?: number | null;
  extruder?: number | null;
  nozzle?: number | null;
  isNearEmpty?: boolean;
  emptiedAt?: string | null;
}

export interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

export interface CustomField {
  id: number;
  // Stable string UUID — the value the submission endpoints expect under
  // `customFieldId`. The numeric `id` is for admin CRUD only.
  fieldId?: string;
  name: string;
  field_type: string;
  entity: string;
}

export interface WebhookPayload<T = Record<string, unknown>> {
  webhook_id: number;
  event: string;
  timestamp: number;
  data: T;
}
