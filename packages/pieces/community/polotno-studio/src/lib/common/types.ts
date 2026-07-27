export type RenderKind = 'images' | 'videos';

export type RenderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';

/** Only the fields this piece reads. Renders are returned to the user verbatim. */
export interface RenderLike {
  id: string;
  object: 'image' | 'video';
  status: RenderStatus;
  [k: string]: unknown;
}

export interface TemplateSummary {
  id: string;
  name: string;
  [k: string]: unknown;
}

export interface FieldDef {
  key: string;
  label: string;
  type: 'string' | 'url' | 'integer' | 'color' | 'boolean';
  required: boolean;
  help_text?: string;
  default?: string | number | boolean;
}

/**
 * `data` and `data.object` are typed optional even though the API always sends both:
 * this shape is cast onto unauthenticated webhook input and untrusted resume payloads,
 * which callers must treat as possibly malformed until they have checked it.
 */
export interface EventEnvelope {
  id: string;
  type: string;
  created_at: string;
  api_version: string;
  data?: { object?: RenderLike };
}

export interface WebhookSubscription {
  id: string;
  /** Returned only at creation — persist it or it is lost. */
  secret: string;
}

export interface MeResponse {
  object: 'me';
  project_id: string;
  project_name: string;
  mode: 'live' | 'test';
  account_email: string;
}
