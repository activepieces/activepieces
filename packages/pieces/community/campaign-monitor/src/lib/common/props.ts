import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { campaignMonitorAuth } from '../auth';

export const clientId = Property.Dropdown({
  displayName: 'Client Account',
  refreshers: [],
  required: true,
  auth: campaignMonitorAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account.',
        options: [],
      };
    }

    const response = await makeRequest<{ ClientID: string; Name: string }[]>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: '/clients.json',
    });
    const clients = response.body;

    return {
      disabled: false,
      options: clients.map((client) => {
        return {
          label: client.Name,
          value: client.ClientID,
        };
      }),
    };
  },
});

export const listId = Property.Dropdown({
  auth: campaignMonitorAuth,
  displayName: 'List ID',
  refreshers: ['clientId'],
  required: true,
  options: async ({ auth, clientId }) => {
    if (!auth || !clientId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account.',
        options: [],
      };
    }

    const response = await makeRequest<{ ListID: string; Name: string }[]>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/clients/${clientId}/lists.json`,
    });
    const lists = response.body;

    return {
      disabled: false,
      options: lists.map((list) => {
        return {
          label: list.Name,
          value: list.ListID,
        };
      }),
    };
  },
});

export const customFields = Property.DynamicProperties({
  auth: campaignMonitorAuth,
  displayName: 'Custom Fields',
  refreshers: ['listId'],
  required: true,
  props: async ({ auth, listId }) => {
    if (!auth || !listId) return {};

    const fields: DynamicPropsValue = {};

    const response = await makeRequest<
      Array<{
        FieldName: string;
        Key: string;
        DataType: string;
        FieldOptions: string[];
      }>
    >({
      auth: {
        apiKey: auth.secret_text,
      },
      method: HttpMethod.GET,
      path: `/lists/${listId}/customfields.json`,
    });

    const listFields = response.body;

    for (const field of listFields) {
      switch (field.DataType) {
        case 'Text':
          fields[field.Key] = Property.ShortText({
            displayName: field.FieldName,
            required: false,
          });
          break;
        case 'Number':
          fields[field.Key] = Property.Number({
            displayName: field.FieldName,
            required: false,
          });
          break;
        case 'Date':
          fields[field.Key] = Property.DateTime({
            displayName: field.FieldName,
            required: false,
          });
          break;
        case 'MultiSelectOne':
          fields[field.Key] = Property.StaticDropdown({
            displayName: field.FieldName,
            required: false,
            options: {
              disabled: false,
              options: field.FieldOptions.map((option) => ({
                label: option,
                value: option,
              })),
            },
          });
          break;
        case 'MultiSelectMany':
          fields[field.Key] = Property.StaticMultiSelectDropdown({
            displayName: field.FieldName,
            required: false,
            options: {
              disabled: false,
              options: field.FieldOptions.map((option) => ({
                label: option,
                value: option,
              })),
            },
          });
          break;
      }
    }
    return fields;
  },
});

export const sentCampaignId = Property.Dropdown({
  auth: campaignMonitorAuth,
  displayName: 'Campaign',
  description: 'A sent campaign of the selected client, newest first.',
  refreshers: ['clientId'],
  required: true,
  options: async ({ auth, clientId }) => {
    if (!auth || !clientId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select a client.',
        options: [],
      };
    }
    const options: { label: string; value: string }[] = [];
    let page = 1;
    let numberOfPages = 1;
    do {
      const response = await makeRequest<{
        Results: { CampaignID: string; Name: string; SentDate: string }[];
        NumberOfPages: number;
      }>({
        auth: { apiKey: auth.secret_text },
        method: HttpMethod.GET,
        path: `/clients/${clientId}/campaigns.json?page=${page}&pagesize=1000&orderdirection=desc`,
      });
      const body = response.body;
      for (const campaign of body.Results ?? []) {
        options.push({
          label: `${campaign.Name} (${campaign.SentDate})`,
          value: campaign.CampaignID,
        });
      }
      numberOfPages = body.NumberOfPages ?? 1;
      page++;
    } while (page <= numberOfPages && page <= 10);

    return {
      disabled: false,
      placeholder:
        options.length === 0 ? 'No sent campaigns found.' : undefined,
      options,
    };
  },
});

export const smartEmailId = Property.Dropdown({
  auth: campaignMonitorAuth,
  displayName: 'Smart Email',
  description: 'An active smart transactional email of the selected client.',
  refreshers: ['clientId'],
  required: true,
  options: async ({ auth, clientId }) => {
    if (!auth || !clientId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select a client.',
        options: [],
      };
    }
    const response = await makeRequest<{ ID: string; Name: string }[]>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/transactional/smartEmail?status=active&clientID=${encodeURIComponent(
        String(clientId)
      )}`,
    });
    const emails = response.body;
    return {
      disabled: false,
      placeholder:
        emails.length === 0 ? 'No active smart emails found.' : undefined,
      options: emails.map((email) => ({ label: email.Name, value: email.ID })),
    };
  },
});

export const draftCampaignId = Property.Dropdown({
  auth: campaignMonitorAuth,
  displayName: 'Draft Campaign',
  description: 'A draft campaign of the selected client.',
  refreshers: ['clientId'],
  required: true,
  options: async ({ auth, clientId }) => {
    if (!auth || !clientId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select a client.',
        options: [],
      };
    }
    const response = await makeRequest<
      { CampaignID: string; Name: string; Subject: string }[]
    >({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/clients/${clientId}/drafts.json`,
    });
    const drafts = response.body;
    return {
      disabled: false,
      placeholder:
        drafts.length === 0 ? 'No draft campaigns found.' : undefined,
      options: drafts.map((draft) => ({
        label: `${draft.Name} (${draft.Subject})`,
        value: draft.CampaignID,
      })),
    };
  },
});

export const listIds = Property.MultiSelectDropdown({
  auth: campaignMonitorAuth,
  displayName: 'Lists',
  description: 'Lists the campaign is sent to.',
  refreshers: ['clientId'],
  required: false,
  options: async ({ auth, clientId }) => {
    if (!auth || !clientId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select a client.',
        options: [],
      };
    }
    const response = await makeRequest<{ ListID: string; Name: string }[]>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/clients/${clientId}/lists.json`,
    });
    return {
      disabled: false,
      options: response.body.map((list) => ({
        label: list.Name,
        value: list.ListID,
      })),
    };
  },
});

export const segmentIds = Property.MultiSelectDropdown({
  auth: campaignMonitorAuth,
  displayName: 'Segments',
  description: 'Segments the campaign is sent to.',
  refreshers: ['clientId'],
  required: false,
  options: async ({ auth, clientId }) => {
    if (!auth || !clientId) {
      return {
        disabled: true,
        placeholder: 'Please connect your account and select a client.',
        options: [],
      };
    }
    const response = await makeRequest<{ SegmentID: string; Title: string }[]>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/clients/${clientId}/segments.json`,
    });
    return {
      disabled: false,
      placeholder:
        response.body.length === 0 ? 'No segments found.' : undefined,
      options: response.body.map((segment) => ({
        label: segment.Title,
        value: segment.SegmentID,
      })),
    };
  },
});
