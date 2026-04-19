export type NinjaPipeAuth = { base_url: string; api_key: string };

export interface ResourceConfig {
  label: string;
  path: string;
  guided: boolean;
}

export interface TypedEntry {
  field: string;
  type: string;
  value: string;
}

export interface PollState {
  lastTimestamp: number;
  lastIdsAtTimestamp: string[];
  initialized: boolean;
}

export interface FieldMetadata {
  name: string;
  type: string;
  sampleValue: unknown;
}

export interface DiscoverFieldsOutput {
  resource: string;
  endpoint: string;
  recordCountSampled: number;
  topLevelFields: FieldMetadata[];
  customFieldKeys: string[];
  sampleRecord: Record<string, unknown>;
}
