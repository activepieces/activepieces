import {
  Property,
  DropdownOption,
  DropdownState,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  HttpError,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';

async function typeformRequest<T>({
  token,
  method,
  path,
  queryParams,
  body,
  headers,
}: TypeformRequest): Promise<T> {
  const response = await httpClient
    .sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      queryParams: compactQuery({ query: queryParams ?? {} }),
      body,
      headers,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    })
    .catch((error: unknown) => {
      throw toTypeformError({ error });
    });
  return response.body;
}

async function fetchAllPages<T>({
  token,
  path,
  queryParams,
}: {
  token: string;
  path: string;
  queryParams?: Record<string, string | undefined>;
}): Promise<T[]> {
  const fetchPage = async (page: number): Promise<T[]> => {
    const response = await typeformRequest<TypeformPage<T>>({
      token,
      method: HttpMethod.GET,
      path,
      queryParams: { ...queryParams, page: String(page), page_size: String(MAX_PAGE_SIZE) },
    });
    const items = response.items ?? [];
    if (response.page_count === undefined || page >= response.page_count) {
      return items;
    }
    return [...items, ...(await fetchPage(page + 1))];
  };
  return fetchPage(1);
}

async function getForm({ token, formId }: { token: string; formId: string }): Promise<TypeformRecord> {
  return typeformRequest<TypeformRecord>({
    token,
    method: HttpMethod.GET,
    path: `/forms/${encodeURIComponent(formId)}`,
  });
}

function pageQuery({
  page,
  pageSize,
  maxPageSize,
}: {
  page: number | undefined;
  pageSize: number | undefined;
  maxPageSize: number;
}): Record<string, string | undefined> {
  return {
    page: page === undefined || page === null ? undefined : String(Math.max(1, Math.floor(page))),
    page_size:
      pageSize === undefined || pageSize === null
        ? undefined
        : String(Math.min(maxPageSize, Math.max(1, Math.floor(pageSize)))),
  };
}

function toHref({ resource, id }: { resource: string; id: string }): { href: string } {
  return { href: `${BASE_URL}/${resource}/${encodeURIComponent(id.trim())}` };
}

function toFormPayload({ form }: { form: TypeformRecord }): TypeformRecord {
  const rest = omitKeys({ record: form, keys: READ_ONLY_FORM_KEYS });
  return {
    ...rest,
    ...(isRecord(rest['settings']) ? { settings: withoutReadOnlySettings({ settings: rest['settings'] }) } : {}),
  };
}

function toDuplicatePayload({ form }: { form: TypeformRecord }): TypeformRecord {
  const payload = toFormPayload({ form });
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      DUPLICATE_ID_KEYS.includes(key) ? stripIds({ value }) : value,
    ])
  );
}

function stripIds({ value }: { value: unknown }): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripIds({ value: item }));
  }
  if (!isRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'id')
      .map(([key, item]) => [key, stripIds({ value: item })])
  );
}

function withoutReadOnlySettings({ settings }: { settings: TypeformRecord }): TypeformRecord {
  const enrichment = settings['enrichment_in_renderer'];
  if (!isRecord(enrichment)) {
    return settings;
  }
  return { ...settings, enrichment_in_renderer: omitKeys({ record: enrichment, keys: ['active'] }) };
}

function omitKeys({ record, keys }: { record: TypeformRecord; keys: string[] }): TypeformRecord {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
}

function flattenFields({ fields }: { fields: unknown }): TypeformRecord[] {
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields.filter(isRecord).flatMap((field) => {
    const properties = field['properties'];
    const nested = isRecord(properties) ? flattenFields({ fields: properties['fields'] }) : [];
    return [field, ...nested];
  });
}

function fieldIds({ fields }: { fields: unknown }): string[] {
  return flattenFields({ fields })
    .map((field) => field['id'])
    .filter((id): id is string => typeof id === 'string');
}

function themeBody({ values, current }: { values: ThemeFieldValues; current: TypeformRecord }): TypeformRecord {
  const colors = compactRecord({
    record: {
      question: values.questionColor,
      answer: values.answerColor,
      button: values.buttonColor,
      background: values.backgroundColor,
    },
  });
  const fields = compactRecord({ record: { alignment: values.fieldAlignment, font_size: values.fieldFontSize } });
  const screens = compactRecord({ record: { alignment: values.screenAlignment, font_size: values.screenFontSize } });
  return {
    ...(isProvided(values.name) ? { name: values.name.trim() } : {}),
    ...(isProvided(values.font) ? { font: values.font } : {}),
    ...(Object.keys(colors).length > 0 ? { colors: { ...recordOrEmpty({ value: current['colors'] }), ...colors } } : {}),
    ...(Object.keys(fields).length > 0 ? { fields: { ...recordOrEmpty({ value: current['fields'] }), ...fields } } : {}),
    ...(Object.keys(screens).length > 0 ? { screens: { ...recordOrEmpty({ value: current['screens'] }), ...screens } } : {}),
  };
}

function compactRecord({ record }: { record: Record<string, string | undefined | null> }): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record)
      .filter((entry): entry is [string, string] => isProvided(entry[1]))
      .map(([key, value]) => [key, value.trim()])
  );
}

function recordOrEmpty({ value }: { value: unknown }): TypeformRecord {
  return isRecord(value) ? value : {};
}

function isProvided(value: string | undefined | null): value is string {
  return value !== undefined && value !== null && value.trim().length > 0;
}

function isRecord(value: unknown): value is TypeformRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringList({ values }: { values: unknown[] | undefined | null }): string[] {
  return (values ?? [])
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
}

function compactQuery({
  query,
}: {
  query: Record<string, string | undefined>;
}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter(
      (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== ''
    )
  );
}

function toTypeformError({ error }: { error: unknown }): unknown {
  if (!(error instanceof HttpError)) {
    return error;
  }
  const { status, body } = error.response;
  if (status === 403) {
    return new Error(
      'Typeform denied access (403). Reconnect your Typeform account to grant the permissions this action needs, and check that your plan includes this feature.'
    );
  }
  if (!isRecord(body)) {
    return error;
  }
  const code = typeof body['code'] === 'string' ? body['code'] : 'Typeform error';
  const description = typeof body['description'] === 'string' ? body['description'] : '';
  const details = Array.isArray(body['details']) ? ` ${JSON.stringify(body['details'])}` : '';
  return new Error(`${code} (${status}): ${description}${details}`.trim());
}

async function workspaceOptions({ token }: { token: string | undefined }): Promise<DropdownState<string>> {
  if (!token) {
    return { disabled: true, placeholder: 'Connect your Typeform account', options: [] };
  }
  const workspaces = await fetchAllPages<{ id: string; name: string }>({
    token,
    path: '/workspaces',
  });
  return {
    disabled: false,
    options: workspaces.map((workspace) => ({ label: workspace.name, value: workspace.id })),
  };
}

async function themeOptions({ token }: { token: string | undefined }): Promise<DropdownState<string>> {
  if (!token) {
    return { disabled: true, placeholder: 'Connect your Typeform account', options: [] };
  }
  const themes = await fetchAllPages<{ id: string; name: string; visibility: string }>({
    token,
    path: '/themes',
  });
  return {
    disabled: false,
    options: themes.map((theme) => ({
      label: theme.visibility === 'public' ? `${theme.name} (Typeform)` : theme.name,
      value: theme.id,
    })),
  };
}

const BASE_URL = 'https://api.typeform.com';
const MAX_PAGE_SIZE = 200;
const READ_ONLY_FORM_KEYS = ['id', '_links', 'self', 'created_at', 'last_updated_at', 'published_at'];
const DUPLICATE_ID_KEYS = ['fields', 'welcome_screens', 'thankyou_screens', 'logic', 'variables', 'hidden'];
const THEME_FONTS = [
  'Acme', 'Arial', 'Arvo', 'Avenir Next', 'Bangers', 'Cabin', 'Cabin Condensed', 'Courier', 'Crete Round',
  'Dancing Script', 'Exo', 'Georgia', 'Handlee', 'Helvetica Neue', 'Karla', 'Lato', 'Lekton', 'Lobster', 'Lora',
  'McLaren', 'Montserrat', 'Nixie One', 'Old Standard TT', 'Open Sans', 'Oswald', 'Playfair Display', 'Quicksand',
  'Raleway', 'Signika', 'Sniglet', 'Source Sans Pro', 'Vollkorn',
];
const ALIGNMENTS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
];
const FONT_SIZES = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
];
const CHOICE_FIELD_TYPES = ['dropdown', 'multiple_choice', 'ranking', 'picture_choice'];

export const formsDropdown = Property.Dropdown<string, true, typeof typeformAuth>({
  auth: typeformAuth,
  displayName: 'Form',
  description: 'Form Name',
  required: true,
  refreshers: [],
  async options({ auth: authentication }) {
    const auth = authentication;

    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect typeform account',
        options: [],
      };
    }

    const accessToken = auth.access_token;

    const options: DropdownOption<string>[] = [];
    let hasMore = true;
    let page = 1;

    do {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: 'https://api.typeform.com/forms',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
        queryParams: {
          page: page.toString(),
          page_size: '200',
        },
      };

      const response = await httpClient.sendRequest<FormListResponse>(request);

      for (const form of response.body.items) {
        options.push({ label: form.title, value: form.id });
      }

      hasMore =
        response.body.page_count != undefined &&
        page < response.body.page_count;

      page++;
    } while (hasMore);

    return {
      disabled: false,
      placeholder: 'Select form',
      options,
    };
  },
});

export const typeformCommon = {
  baseUrl: BASE_URL,
  subscribeWebhook: async (
    formId: string,
    tag: string,
    webhookUrl: string,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${typeformCommon.baseUrl}/forms/${formId}/webhooks/${tag}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        enabled: true,
        url: webhookUrl,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      queryParams: {},
    };

    await httpClient.sendRequest(request);
  },
  unsubscribeWebhook: async (
    formId: string,
    tag: string,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${typeformCommon.baseUrl}/forms/${formId}/webhooks/${tag}`,
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  },
  form: formsDropdown,
  workspace: Property.Dropdown<string, false, typeof typeformAuth>({
    auth: typeformAuth,
    displayName: 'Workspace',
    description: 'Workspace ID, from List Workspaces.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => workspaceOptions({ token: auth?.access_token }),
  }),
  theme: Property.Dropdown<string, false, typeof typeformAuth>({
    auth: typeformAuth,
    displayName: 'Theme',
    description: 'Theme ID, from List Themes.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => themeOptions({ token: auth?.access_token }),
  }),
  choiceField: Property.Dropdown<string, true, typeof typeformAuth>({
    auth: typeformAuth,
    displayName: 'Question',
    description: 'Dropdown, multiple choice, ranking or picture choice question. Field ID or ref, from Get Form.',
    required: true,
    refreshers: ['form_id'],
    async options({ auth, form_id }) {
      if (!auth || typeof form_id !== 'string' || form_id.length === 0) {
        return { disabled: true, placeholder: 'Select a form first', options: [] };
      }
      const form = await getForm({ token: auth.access_token, formId: form_id });
      return {
        disabled: false,
        options: flattenFields({ fields: form['fields'] })
          .filter((field) => CHOICE_FIELD_TYPES.includes(String(field['type'])))
          .map((field) => ({ label: String(field['title'] ?? field['id']), value: String(field['id']) })),
      };
    },
  }),
  formId: Property.ShortText({
    displayName: 'Form ID',
    description: 'Form ID, from List Forms.',
    required: true,
  }),
  workspaceId: Property.ShortText({
    displayName: 'Workspace ID',
    description: 'Workspace ID, from List Workspaces.',
    required: false,
  }),
  requiredWorkspaceId: Property.ShortText({
    displayName: 'Workspace ID',
    description: 'Workspace ID, from List Workspaces.',
    required: true,
  }),
  themeId: Property.ShortText({
    displayName: 'Theme ID',
    description: 'Theme ID, from List Themes.',
    required: false,
  }),
  requiredThemeId: Property.ShortText({
    displayName: 'Theme ID',
    description: 'Theme ID, from List Themes.',
    required: true,
  }),
  themeFields: {
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    font: Property.StaticDropdown({
      displayName: 'Font',
      required: false,
      options: { options: THEME_FONTS.map((font) => ({ label: font, value: font })) },
    }),
    questionColor: Property.ShortText({
      displayName: 'Question Color',
      description: 'Hex color, for example #3D3D3D.',
      required: false,
    }),
    answerColor: Property.ShortText({
      displayName: 'Answer Color',
      description: 'Hex color.',
      required: false,
    }),
    buttonColor: Property.ShortText({
      displayName: 'Button Color',
      description: 'Hex color.',
      required: false,
    }),
    backgroundColor: Property.ShortText({
      displayName: 'Background Color',
      description: 'Hex color.',
      required: false,
    }),
    fieldAlignment: Property.StaticDropdown({
      displayName: 'Question Alignment',
      required: false,
      options: { options: ALIGNMENTS },
    }),
    fieldFontSize: Property.StaticDropdown({
      displayName: 'Question Font Size',
      required: false,
      options: { options: FONT_SIZES },
    }),
    screenAlignment: Property.StaticDropdown({
      displayName: 'Screen Alignment',
      description: 'Alignment of welcome and thank-you screens.',
      required: false,
      options: { options: ALIGNMENTS },
    }),
    screenFontSize: Property.StaticDropdown({
      displayName: 'Screen Font Size',
      required: false,
      options: { options: FONT_SIZES },
    }),
  },
  page: Property.Number({
    displayName: 'Page',
    description: 'Page number, starting at 1.',
    required: false,
  }),
  pageSize: Property.Number({
    displayName: 'Page Size',
    description: 'How many items to return per page, from 1 to 200.',
    required: false,
  }),
  typeformRequest,
  fetchAllPages,
  getForm,
  pageQuery,
  toHref,
  toFormPayload,
  toDuplicatePayload,
  flattenFields,
  fieldIds,
  themeBody,
  isProvided,
  isRecord,
  toStringList,
  maxPageSize: MAX_PAGE_SIZE,
  choiceFieldTypes: CHOICE_FIELD_TYPES,
};

export type TypeformRecord = Record<string, unknown>;

export type TypeformPage<T> = {
  total_items?: number;
  page_count?: number;
  items?: T[];
};

type ThemeFieldValues = {
  name?: string | null;
  font?: string | null;
  questionColor?: string | null;
  answerColor?: string | null;
  buttonColor?: string | null;
  backgroundColor?: string | null;
  fieldAlignment?: string | null;
  fieldFontSize?: string | null;
  screenAlignment?: string | null;
  screenFontSize?: string | null;
};

type FormListResponse = {
  page_count: number;
  total_items: number;
  items: {
    id: string;
    title: string;
  }[];
};

type TypeformRequest = {
  token: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};
