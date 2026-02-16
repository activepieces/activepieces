export interface KlaviyoProfile {
  type: 'profile';
  id: string;
  attributes: {
    email?: string;
    phone_number?: string;
    external_id?: string;
    first_name?: string;
    last_name?: string;
    organization?: string;
    title?: string;
    image?: string;
    created?: string;
    updated?: string;
    last_event_date?: string;
    location?: {
      address1?: string;
      address2?: string;
      city?: string;
      country?: string;
      region?: string;
      zip?: string;
      timezone?: string;
      latitude?: string;
      longitude?: string;
    };
    properties?: Record<string, unknown>;
    subscriptions?: {
      email?: {
        marketing?: {
          can_receive_email_marketing?: boolean;
          consent?: string;
          consent_timestamp?: string;
        };
      };
      sms?: {
        marketing?: {
          can_receive_sms_marketing?: boolean;
          consent?: string;
          consent_timestamp?: string;
        };
      };
    };
  };
  links?: {
    self?: string;
  };
  relationships?: Record<string, unknown>;
}

export interface KlaviyoList {
  type: 'list';
  id: string;
  attributes: {
    name: string;
    created?: string;
    updated?: string;
    opt_in_process?: string;
  };
  links?: {
    self?: string;
  };
}

export interface KlaviyoTag {
  type: 'tag';
  id: string;
  attributes: {
    name: string;
    created?: string;
    updated?: string;
  };
  links?: {
    self?: string;
  };
}

export interface KlaviyoSegment {
  type: 'segment';
  id: string;
  attributes: {
    name: string;
    created?: string;
    updated?: string;
    definition?: unknown;
  };
  links?: {
    self?: string;
  };
}

export interface KlaviyoApiResponse<T> {
  data: T;
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
}

export interface KlaviyoApiListResponse<T> {
  data: T[];
  links?: {
    self?: string;
    next?: string;
    prev?: string;
  };
}

export interface KlaviyoBulkJobResponse {
  data: {
    type: string;
    id: string;
    attributes: {
      status: string;
      created_at: string;
      total_count?: number;
      completed_count?: number;
      failed_count?: number;
      completed_at?: string;
      expires_at?: string;
      started_at?: string;
    };
  };
}
