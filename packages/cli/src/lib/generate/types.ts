export type ExtractedAuth =
  | { kind: 'apiKey'; location: 'header' | 'query' | 'cookie'; headerName: string }
  | { kind: 'bearer' }
  | { kind: 'basic' }
  | { kind: 'oauth2'; authUrl: string; tokenUrl: string; scopes: string[] }
  | { kind: 'none' };

export type MappedPropertyKind =
  | 'SHORT_TEXT' | 'LONG_TEXT' | 'NUMBER' | 'CHECKBOX'
  | 'STATIC_DROPDOWN' | 'STATIC_MULTI_SELECT' | 'OBJECT'
  | 'JSON' | 'ARRAY' | 'FILE' | 'DATE_TIME';

export type EnumOption = { label: string; value: string | number };

export type MappedProperty = {
  propertyKind: MappedPropertyKind;
  displayName: string;
  description: string;
  required: boolean;
  defaultValue?: unknown;
  enumOptions?: EnumOption[];
};

export type NormalizedParam = {
  name: string;
  safeName: string;
  displayName: string;
  description: string;
  required: boolean;
  mappedProperty: MappedProperty;
};

export type NormalizedOperation = {
  operationId: string;
  actionName: string;
  fileName: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  displayName: string;
  description: string;
  pathParams: NormalizedParam[];
  queryParams: NormalizedParam[];
  bodyParams: NormalizedParam[];
  hasComplexBody: boolean;
  mediaType: 'json' | 'form-data' | null;
  deprecated: boolean;
  pagination: PaginationHint | null;
};

export type PaginationHint = {
  strategy: 'offset' | 'cursor' | 'page';
  limitParam: string;
  cursorParam: string;
};

export type ParsedSpec = {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  auth: ExtractedAuth;
  operations: NormalizedOperation[];
};

export type DynamicDropdownConfig = {
  endpoint: string;       // e.g. '/boards' — GET this to populate options
  labelField: string;     // e.g. 'name' — response item field used as label
  valueField: string;     // e.g. 'id' — response item field used as value
  refreshers?: string[];  // prop names that trigger a refresh, e.g. ['workspaceId']
  itemsPath?: string;     // dot-path into response body, e.g. 'data' or 'result.items'
};

export type GeneratorContext = {
  spec: ParsedSpec;
  pieceName: string;
  packageName: string;
  displayName: string;
  outputDir: string;
  pieceType: string;
  // keyed by the OpenAPI field name (e.g. 'boardId')
  dynamicDropdowns?: Record<string, DynamicDropdownConfig>;
};

export type OpenAPISchema = {
  type?: string;
  format?: string;
  enum?: unknown[];
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  required?: string[];
  description?: string;
  default?: unknown;
  allOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  maxLength?: number;
  nullable?: boolean;
};

export type OpenAPIParameter = {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: OpenAPISchema;
  deprecated?: boolean;
};

export type OpenAPISecurityScheme = {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  in?: 'header' | 'query' | 'cookie';
  name?: string;
  scheme?: string;
  flows?: {
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      scopes: Record<string, string>;
    };
    clientCredentials?: {
      tokenUrl: string;
      scopes: Record<string, string>;
    };
    implicit?: {
      authorizationUrl: string;
      scopes: Record<string, string>;
    };
  };
};

export type OpenAPIOperation = {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: OpenAPISchema }>;
  };
  security?: Record<string, string[]>[];
  tags?: string[];
  deprecated?: boolean;
};

export type OpenAPISpec = {
  info: { title: string; description?: string; version: string };
  servers?: Array<{ url: string }>;
  security?: Record<string, string[]>[];
  components?: {
    securitySchemes?: Record<string, OpenAPISecurityScheme>;
    schemas?: Record<string, OpenAPISchema>;
  };
  paths?: Record<string, Record<string, OpenAPIOperation>>;
};
