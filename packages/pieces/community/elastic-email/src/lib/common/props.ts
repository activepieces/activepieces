import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from './client';
import { DEFAULT_LIMIT } from './constants';

interface ElasticEmailContact {
  Email?: string;
  FirstName?: string;
  LastName?: string;
}

interface ElasticEmailCampaign {
  Name?: string;
}

interface ElasticEmailSegment {
  Name?: string;
}

interface ElasticEmailList {
  ListName?: string;
}

interface ElasticEmailTemplate {
  Name?: string;
}

export const contactEmailProp = Property.Dropdown({
  displayName: 'Contact Email',
  description: 'Select an existing contact by email address.',
  required: true,
  refreshers: [],
  auth: elasticEmailAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Elastic Email account first.',
        options: [],
      };
    }
    const contacts = await elasticEmailRequest<ElasticEmailContact[]>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/contacts',
      queryParams: { limit: String(DEFAULT_LIMIT) },
    });
    return {
      disabled: false,
      options: (contacts ?? [])
        .filter((c) => c.Email)
        .map((c) => ({
          label: c.Email!,
          value: c.Email!,
        })),
    };
  },
});

export const campaignNameProp = Property.Dropdown({
  displayName: 'Campaign',
  description: 'Select an existing campaign by name.',
  required: true,
  refreshers: [],
  auth: elasticEmailAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Elastic Email account first.',
        options: [],
      };
    }
    const campaigns = await elasticEmailRequest<ElasticEmailCampaign[]>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/campaigns',
      queryParams: { limit: String(DEFAULT_LIMIT) },
    });
    return {
      disabled: false,
      options: (campaigns ?? [])
        .filter((c) => c.Name)
        .map((c) => ({
          label: c.Name!,
          value: c.Name!,
        })),
    };
  },
});

export const listNamesProp = Property.MultiSelectDropdown({
  displayName: 'Mailing Lists',
  description: 'Select mailing lists.',
  required: false,
  refreshers: [],
  auth: elasticEmailAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Elastic Email account first.',
        options: [],
      };
    }
    const lists = await elasticEmailRequest<ElasticEmailList[]>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/lists',
      queryParams: { limit: String(DEFAULT_LIMIT) },
    });
    return {
      disabled: false,
      options: (lists ?? [])
        .filter((l) => l.ListName)
        .map((l) => ({
          label: l.ListName!,
          value: l.ListName!,
        })),
    };
  },
});

export const segmentNamesProp = Property.MultiSelectDropdown({
  displayName: 'Segments',
  description: 'Select segments.',
  required: false,
  refreshers: [],
  auth: elasticEmailAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Elastic Email account first.',
        options: [],
      };
    }
    const segments = await elasticEmailRequest<ElasticEmailSegment[]>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/segments',
      queryParams: { limit: String(DEFAULT_LIMIT) },
    });
    return {
      disabled: false,
      options: (segments ?? [])
        .filter((s) => s.Name)
        .map((s) => ({
          label: s.Name!,
          value: s.Name!,
        })),
    };
  },
});

export const templateNameProp = Property.Dropdown({
  displayName: 'Template',
  description: 'Select an email template.',
  required: false,
  refreshers: [],
  auth: elasticEmailAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Elastic Email account first.',
        options: [],
      };
    }
    const templates = await elasticEmailRequest<ElasticEmailTemplate[]>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/templates',
      queryParams: { limit: String(DEFAULT_LIMIT), scopeType: 'Personal' },
    });
    return {
      disabled: false,
      options: (templates ?? [])
        .filter((t) => t.Name)
        .map((t) => ({
          label: t.Name!,
          value: t.Name!,
        })),
    };
  },
});
