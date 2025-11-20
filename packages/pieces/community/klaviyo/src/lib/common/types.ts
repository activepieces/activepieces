// Klaviyo API Types

export interface KlaviyoProfile {
  type: 'profile';
  id?: string;
  attributes: {
    email?: string;
    phone_number?: string;
    external_id?: string;
    first_name?: string;
    last_name?: string;
    organization?: string;
    title?: string;
    image?: string;
    location?: {
      address1?: string;
      address2?: string;
      city?: string;
      country?: string;
      region?: string;
      zip?: string;
      timezone?: string;
    };
    properties?: Record<string, any>;
  };
}

export interface KlaviyoList {
  type: 'list';
  id?: string;
  attributes: {
    name: string;
    created?: string;
    updated?: string;
  };
}

export interface KlaviyoSegment {
  type: 'segment';
  id?: string;
  attributes: {
    name: string;
    created?: string;
    updated?: string;
  };
}

export interface KlaviyoTag {
  type: 'tag';
  id?: string;
  attributes: {
    name: string;
  };
}

export interface KlaviyoSubscription {
  type: 'profile-subscription-bulk-create-job';
  attributes: {
    profiles: {
      data: Array<{
        type: 'profile';
        attributes: {
          email?: string;
          phone_number?: string;
          subscriptions?: {
            email?: {
              marketing?: {
                consent: 'SUBSCRIBED' | 'UNSUBSCRIBED';
              };
            };
            sms?: {
              marketing?: {
                consent: 'SUBSCRIBED' | 'UNSUBSCRIBED';
              };
            };
          };
        };
      }>;
    };
  };
  relationships?: {
    list: {
      data: {
        type: 'list';
        id: string;
      };
    };
  };
}

export interface CreateProfileRequest {
  email?: string;
  phone_number?: string;
  external_id?: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  title?: string;
  image?: string;
  location?: {
    address1?: string;
    address2?: string;
    city?: string;
    country?: string;
    region?: string;
    zip?: string;
    timezone?: string;
  };
  properties?: Record<string, any>;
}

export interface UpdateProfileRequest extends CreateProfileRequest {}

export interface CreateListRequest {
  name: string;
}

export interface ProfileListMembershipRequest {
  profiles: string[];
}

export interface KlaviyoApiResponse<T> {
  data: T;
}

export interface KlaviyoApiListResponse<T> {
  data: T[];
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}

export interface KlaviyoErrorResponse {
  errors: Array<{
    id: string;
    status: number;
    code: string;
    title: string;
    detail: string;
    source: {
      pointer: string;
    };
  }>;
}

