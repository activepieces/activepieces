export type ApiField = {
  name: string;
  required: boolean;
  type: string;
  description?: string;
  format?: string;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  default?: unknown;
  readOnly?: boolean;
  writeOnly?: boolean;
  items?: Omit<ApiField, 'name' | 'required'>;
  in?: string;
  style?: string;
  explode?: boolean;
};

export type ApiOperation = {
  id: string;
  method: string;
  path: string;
  summary: string;
  description: string;
  tag: string;
  parameters: ApiField[];
  body?: { required: boolean; description?: string; fields?: ApiField[] };
  binary?: boolean;
};
