import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { CopperApiService } from './requests';

export const BASE_URL = 'https://api.copper.com/developer_api';

export const CopperAuth = PieceAuth.CustomAuth({
  description: '',
  required: true,
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email Address of the Token Owner',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your API Key in settings > integrations',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await CopperApiService.fetchCurrentUser(auth)
      return {
        valid: true,
      };
    } catch (err) {
      return {
        valid: false,
        error: "Invalid API Credentials, please check your credentials and try again"
      };
    }
  },
});

export const API_ENDPOINTS = {
  USERS: '/users',
  WEBHOOKS: '/webhooks',
  PEOPLE: '/people',
  LEADS: '/leads',
  COMPANIES: '/companies',
  OPPORTUNITIES: '/opportunities',
  TASKS: '/tasks',
  PIPELINES: '/pipelines',
  PROJECTS: '/projects',
};

export type CopperAuthType = {
  email: string;
  apiKey: string;
};

export const isNonEmptyStr = (v: any) => typeof v === 'string' && v.trim().length > 0;

export const toUnix = (iso?: string | null) =>
  iso ? Math.floor(new Date(iso).getTime() / 1000) : undefined;

export type CopperActivity = {
  id: number;
  name?: string;
  details?: string;
  assignee_id?: number;
  custom_activity_type_id?: number;
  parent?: { type: 'person'|'company'|'lead'|'opportunity'|'project'; id: number };
  activity_date?: number;  // unix seconds
  date_created: number;    // unix seconds
  date_modified?: number;  // unix seconds
  tags?: string[];
};