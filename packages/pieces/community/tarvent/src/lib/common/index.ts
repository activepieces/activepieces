import { DropdownOption, DropdownState, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventClient } from './client';
import { TarventCredentials, tarventTransport } from './transport';

export const tarventCommon = {
  customEventId: (required = false, description = '') =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Custom event',
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth: auth?.props,
          load: async (credentials) => {
            const result = await tarventClient.listAll<{ key: string; name: string }>({
              auth: credentials,
              operation: 'GetCustomEvents',
              field: 'customApiEvents',
              selection: 'id key name',
            });
            return { ...result, options: result.items.map((e) => ({ label: e.name, value: e.key })) };
          },
        }),
    }),
  campaignId: (required = false, description = '', ignoreStatus = false, isEvent = false) =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Campaign',
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth: auth?.props,
          load: async (credentials) => {
            const result = await tarventClient.listAll<{ id: string; name: string }>({
              auth: credentials,
              operation: 'GetCampaigns',
              field: 'campaigns',
              selection: 'id name',
              argDefs: ', $where: CampaignInfoFilterInput, $order: [CampaignInfoSortInput!]',
              args: ', where: $where, order: $order',
              variables: { where: tarventClient.dropdownCampaignWhere({ ignoreStatus, isEvent }), order: [{ modifiedUtc: 'DESC' }] },
            });
            return { ...result, options: result.items.map((c) => ({ label: c.name, value: c.id })) };
          },
        }),
    }),
  campaignLinkId: (required = false) =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Campaign link',
      description: 'Only used if campaign type is set to "Specific". If specified, the trigger will only fire if a contact clicks the selected link.',
      required,
      refreshers: ['campaignId'],
      options: async ({ auth, campaignId }) => {
        if (!campaignId) {
          return { disabled: true, placeholder: 'Select a campaign first', options: [] };
        }
        return loadOptions({
          auth: auth?.props,
          load: async (credentials) => {
            const links = await tarventTransport.field<{ id: string; url: string }[]>({
              auth: credentials,
              query: 'query GetCampaignLinks($id: String!) { campaignLinks(id: $id) { id url } }',
              variables: { id: campaignId },
              name: 'campaignLinks',
            });
            return { truncated: false, options: links.map((l) => ({ label: l.url, value: l.id })) };
          },
        });
      },
    }),
  journeyId: (required = false, description = '') =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Journey',
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth: auth?.props,
          load: async (credentials) => {
            const result = await tarventClient.listAll<{ id: string; name: string }>({
              auth: credentials,
              operation: 'GetJourneys',
              field: 'journeys',
              selection: 'id name',
            });
            return { ...result, options: result.items.map((j) => ({ label: j.name, value: j.id })) };
          },
        }),
    }),
  campaignScope: Property.DynamicProperties({
    auth: tarventAuth,
    displayName: 'Campaign scope',
    refreshers: ['campaignType'],
    required: false,
    props: async ({ campaignType }) => {
      if (String(campaignType) !== 'AnyX') {
        return {};
      }
      const prop: DynamicPropsValue = {
        campaignRange: Property.Number({ displayName: 'Range', required: true }),
        campaignPeriod: Property.StaticDropdown({
          displayName: 'Period',
          required: true,
          options: {
            options: [
              { label: 'Hour(s)', value: 'h' },
              { label: 'Day(s)', value: 'd' },
              { label: 'Week(s)', value: 'w' },
              { label: 'Month(s)', value: 'm' },
            ],
          },
          defaultValue: 'd',
        }),
      };
      return prop;
    },
  }),
  audienceId: (required = false, description = '') =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Audience',
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth: auth?.props,
          load: async (credentials) => {
            const result = await tarventClient.listAll<{ id: string; name: string }>({
              auth: credentials,
              operation: 'GetAudiences',
              field: 'audiences',
              selection: 'id name',
            });
            return { ...result, options: result.items.map((a) => ({ label: a.name, value: a.id })) };
          },
        }),
    }),
  audienceGroupId: (required = false, description = '') =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Audience group',
      description,
      required,
      refreshers: ['audienceId'],
      options: async ({ auth, audienceId }) => groupOptions({ auth: auth?.props, audienceId }),
    }),
  audienceGroupIds: (required = false, description = '') =>
    Property.MultiSelectDropdown({
      auth: tarventAuth,
      displayName: 'Audience group',
      description,
      required,
      refreshers: ['audienceId'],
      options: async ({ auth, audienceId }) => groupOptions({ auth: auth?.props, audienceId }),
    }),
  audienceFormId: (required = false, description = '') =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Audience form',
      description,
      required,
      refreshers: ['audienceId'],
      options: async ({ auth, audienceId }) => {
        if (!audienceId) {
          return { disabled: true, placeholder: 'Please select an audience first', options: [] };
        }
        return loadOptions({
          auth: auth?.props,
          load: async (credentials) => {
            const result = await tarventClient.listAll<{ id: string; name: string }>({
              auth: credentials,
              operation: 'GetForms',
              field: 'forms',
              selection: 'id name',
              argDefs: ', $audienceId: String, $order: [FormInfoSortInput!]',
              args: ', audienceId: $audienceId, order: $order',
              variables: { audienceId, order: [{ name: 'ASC' }] },
            });
            return { ...result, options: result.items.map((f) => ({ label: f.name, value: f.id })) };
          },
        });
      },
    }),
  audienceDataFields: Property.DynamicProperties({
    displayName: 'Data fields',
    auth: tarventAuth,
    refreshers: ['audienceId'],
    required: false,
    props: async ({ auth, audienceId }) => {
      if (!auth || !audienceId) {
        return {};
      }
      const { items } = await tarventClient.listAll<TarventDataField>({
        auth: auth.props,
        operation: 'GetDataFields',
        field: 'audienceDataFields',
        selection: 'id dataType labelText required isSystem defaultValue isGdprField',
        argDefs: ', $audienceId: String!',
        args: ', audienceId: $audienceId',
        variables: { audienceId },
      });
      return Object.fromEntries(
        items.filter((f) => !f.isSystem || f.isGdprField).map((f) => [f.id, dataFieldProperty({ field: f })]),
      );
    },
  }),
  contactId: Property.ShortText({
    displayName: 'Contact ID',
    description: 'The Tarvent contact ID. Find it in the edit contact dialog on the details page, or from Find Contact.',
    required: true,
  }),
  name: (displayName: string, required: boolean, description = '') =>
    Property.ShortText({ displayName, description, required }),
  include: Property.StaticDropdown({
    displayName: 'Include all contact data',
    description: 'If not included, only the contact ID, email and unique identifier will be passed back.',
    required: true,
    defaultValue: 'BASIC',
    options: {
      options: [
        { label: 'Include', value: 'EXTENDED' },
        { label: 'Do not include', value: 'BASIC' },
      ],
    },
  }),
  entity: Property.StaticDropdown({
    displayName: 'Email type',
    description: 'Select if a campaign, transactional email or both should fire the trigger.',
    required: true,
    defaultValue: 'BOTH',
    options: {
      options: [
        { label: 'Both', value: 'BOTH' },
        { label: 'Campaign', value: 'CAMPAIGN' },
        { label: 'Transaction', value: 'TRANSACTION' },
      ],
    },
  }),
  tagId: (required = false, description = '') =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Tags',
      description,
      required,
      refreshers: [],
      options: async ({ auth }) => tagOptions({ auth: auth?.props }),
    }),
  tagIds: (required = false, description = '') =>
    Property.MultiSelectDropdown({
      auth: tarventAuth,
      displayName: 'Tags',
      description,
      required,
      refreshers: [],
      options: async ({ auth }) => tagOptions({ auth: auth?.props }),
    }),
  txGroupName: (required = false, description = '') =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Transaction group name',
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth: auth?.props,
          load: async (credentials) => {
            const data = await tarventTransport.graphql<{ transactionGroupNames?: string[] | null }>({
              auth: credentials,
              query: 'query GetTxGroupNames { transactionGroupNames }',
            });
            return { truncated: false, options: (data.transactionGroupNames ?? []).map((n) => ({ label: n, value: n })) };
          },
        }),
    }),
  templateId: (required = false, description = '') =>
    Property.Dropdown({
      auth: tarventAuth,
      displayName: 'Template',
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        loadOptions({
          auth: auth?.props,
          load: async (credentials) => {
            const result = await tarventClient.listAll<{ id: string; name: string }>({
              auth: credentials,
              operation: 'GetTemplates',
              field: 'templates',
              selection: 'id name',
            });
            return { ...result, options: result.items.map((t) => ({ label: t.name, value: t.id })) };
          },
        }),
    }),
  landingPageId: Property.Dropdown({
    auth: tarventAuth,
    displayName: 'Landing page',
    description: 'If specified, the trigger will only fire if CTA (call-to-action) is performed on the selected landing page.',
    required: false,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth: auth?.props,
        load: async (credentials) => {
          const result = await tarventClient.listAll<{ id: string; name: string }>({
            auth: credentials,
            operation: 'GetLandingPages',
            field: 'landingPages',
            selection: 'id name',
          });
          return { ...result, options: result.items.map((p) => ({ label: p.name, value: p.id })) };
        },
      }),
  }),
  surveyId: Property.Dropdown({
    auth: tarventAuth,
    displayName: 'Survey',
    description: 'If specified, the trigger will only fire if the selected survey is submitted.',
    required: false,
    refreshers: [],
    options: async ({ auth }) =>
      loadOptions({
        auth: auth?.props,
        load: async (credentials) => {
          const result = await tarventClient.listAll<{ id: string; name: string }>({
            auth: credentials,
            operation: 'GetSurveys',
            field: 'surveys',
            selection: 'id name',
          });
          return { ...result, options: result.items.map((s) => ({ label: s.name, value: s.id })) };
        },
      }),
  }),
  limit: Property.Number({
    displayName: 'Limit',
    description: 'Maximum number of results to return (1-50). Use the returned Next Cursor to get more.',
    required: false,
    defaultValue: 50,
  }),
  cursor: Property.ShortText({
    displayName: 'Cursor',
    description: 'Next Cursor from a previous run, to get the next page of results.',
    required: false,
  }),
  pageLimit,
  trimmed,
  requireText,
  checkLength,
  splitEmail,
  profileFromDataFields,
};

function splitEmail(email: string): { localPart: string; domain: string } {
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) {
    throw new Error('Email address must look like name@example.com.');
  }
  return { localPart: email.slice(0, at), domain: email.slice(at + 1) };
}

function checkLength({ value, label, max }: { value: string | undefined; label: string; max: number }): void {
  if (value !== undefined && value.length > max) {
    throw new Error(`${label} must be ${max} characters or fewer.`);
  }
}

function pageLimit(value: unknown): number {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (parsed === undefined || parsed === null || parsed === '') {
    return 50;
  }
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    throw new Error('Limit must be a whole number between 1 and 50.');
  }
  return parsed;
}

function trimmed(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = trimmed(value);
  if (!text) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function profileFromDataFields(fields: Record<string, unknown> | undefined): { dataFieldId: string; value: string }[] {
  return Object.entries(fields ?? {}).flatMap(([dataFieldId, raw]) => {
    if (raw === undefined || raw === null || raw === '') {
      return [];
    }
    const text = typeof raw === 'string' ? raw : typeof raw === 'number' || typeof raw === 'boolean' ? String(raw) : JSON.stringify(raw);
    return [{ dataFieldId, value: isIsoDateTime(text) ? formatYmd(text) : text }];
  });
}

function isIsoDateTime(text: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?$/.test(text) && !Number.isNaN(Date.parse(text));
}

function formatYmd(text: string): string {
  const date = new Date(text);
  return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

function dataFieldProperty({ field }: { field: TarventDataField }) {
  if (field.isGdprField) {
    const label = field.labelText.replace('GDPR_', '');
    return Property.StaticDropdown({
      displayName: `${label} (GDPR Permission)`,
      description: `Sets the ${label} GDPR permission. Leave empty to keep the current value.`,
      required: field.required,
      options: {
        options: [
          { label: 'Allow', value: '1' },
          { label: 'Do not allow', value: '0' },
        ],
      },
    });
  }
  const description = helpText({ field });
  if (field.dataType === 'NUMBER') {
    return Property.Number({ displayName: field.labelText, required: field.required, description });
  }
  if (field.dataType === 'DATE' || field.dataType === 'DATE_TIME') {
    return Property.DateTime({ displayName: field.labelText, required: field.required, description });
  }
  return Property.ShortText({ displayName: field.labelText, required: field.required, description });
}

function helpText({ field }: { field: TarventDataField }): string {
  const base = `This will set the value for the ${field.labelText} data field.`;
  switch (field.dataType) {
    case 'NUMBER':
      return `${base} Must contain only numbers. (255 character limit)`;
    case 'ZIP_CODE':
      return `U.S. Only. ${base} Format: ##### or #####-#### (10 character limit)`;
    case 'BIRTHDAY':
    case 'DATE':
    case 'DATE_TIME':
    case 'PHONE':
      return base;
    default:
      return `${base}${field.defaultValue ? ` Default value: ${field.defaultValue}` : ''} (255 character limit)`;
  }
}

async function loadOptions({
  auth,
  load,
}: {
  auth: TarventCredentials | undefined;
  load: (auth: TarventCredentials) => Promise<{ options: DropdownOption<string>[]; truncated: boolean }>;
}): Promise<DropdownState<string>> {
  if (!auth) {
    return { disabled: true, placeholder: 'Please connect your account first', options: [] };
  }
  try {
    const { options, truncated } = await load(auth);
    return {
      disabled: false,
      options,
      placeholder: truncated ? 'Showing the first results only. Use a custom value for others.' : undefined,
    };
  } catch (error) {
    return {
      disabled: true,
      placeholder: `Could not load options: ${error instanceof Error ? error.message : 'unknown error'}`,
      options: [],
    };
  }
}

async function groupOptions({ auth, audienceId }: { auth: TarventCredentials | undefined; audienceId: unknown }): Promise<DropdownState<string>> {
  if (!audienceId) {
    return { disabled: true, placeholder: 'Please select an audience first', options: [] };
  }
  return loadOptions({
    auth,
    load: async (credentials) => {
      const result = await tarventClient.listAll<{ id: string; name: string }>({
        auth: credentials,
        operation: 'GetAudienceGroups',
        field: 'audienceGroups',
        selection: 'id name',
        argDefs: ', $audienceId: String!, $order: [AudienceGroupInfoSortInput!], $where: AudienceGroupInfoFilterInput',
        args: ', audienceId: $audienceId, order: $order, where: $where',
        variables: { audienceId, order: [{ name: 'ASC' }], where: { isDynamic: { eq: false } } },
      });
      return { ...result, options: result.items.map((g) => ({ label: g.name, value: g.id })) };
    },
  });
}

async function tagOptions({ auth }: { auth: TarventCredentials | undefined }): Promise<DropdownState<string>> {
  return loadOptions({
    auth,
    load: async (credentials) => {
      const result = await tarventClient.listAll<{ name: string }>({
        auth: credentials,
        operation: 'GetTags',
        field: 'tags',
        selection: 'name',
      });
      return { ...result, options: result.items.map((t) => ({ label: t.name, value: t.name })) };
    },
  });
}

type TarventDataField = {
  id: string;
  dataType: string;
  labelText: string;
  required: boolean;
  isSystem: boolean;
  defaultValue: string;
  isGdprField: boolean;
};
