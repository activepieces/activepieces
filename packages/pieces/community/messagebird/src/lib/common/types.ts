export type Schema = Record<string, unknown>;
export interface FormShape {
  name: string;
  label: string;
  help?: string;
  kind: string;
  required?: boolean;
  enum?: unknown[];
  children?: FormShape[];
  item?: FormItem;
}
export type FormItem = Omit<FormShape, "name" | "label"> & {
  name?: string;
  label?: string;
};
export interface Field {
  key: string;
  wireName: string;
  label: string;
  help?: string;
  required: boolean;
  location: string;
  encoding: string;
  presentation: string;
  resolvedSchema?: Schema;
  form: FormShape;
  joined?: boolean;
}
export interface WireOperation {
  method: string;
  path: string;
  fields: Field[];
  contentModes?: { value: string; label: string; fields: string[] }[];
  requestSchema?: Schema;
}
export interface Operation extends WireOperation {
  name: string;
  operationId: string;
  label: string;
  description: string;
  summary: string;
  contentModes: { value: string; label: string; fields: string[] }[];
  method: string;
  path: string;
  fields: Field[];
  components: { schemas: Record<string, Schema | undefined> };
  requestSchema?: Schema;
  responseSchema?: Schema;
  outputSchema: import("@activepieces/pieces-framework").OutputSchema;
}

export interface BirdHttpRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  followRedirects: boolean;
  retries: number;
  timeout: number;
  body?: unknown;
}

export interface BirdHttpResponse {
  status: number;
  headers?: Record<string, string | string[] | undefined>;
  body: unknown;
}

export interface BirdHttpClient {
  sendRequest(request: BirdHttpRequest): Promise<BirdHttpResponse>;
}
