import { Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

async function calendlyRequest<T>({
  token,
  method,
  path,
  queryParams,
  body,
}: CalendlyRequest): Promise<T> {
  const response = await httpClient
    .sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      queryParams: compactQuery({ query: queryParams ?? {} }),
      body,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    })
    .catch((error: unknown) => {
      throw toCalendlyError({ error });
    });
  return response.body;
}

async function getUser(personalToken: string): Promise<CalendlyUser> {
  const response = await calendlyRequest<{ resource: CalendlyUser }>({
    token: personalToken,
    method: HttpMethod.GET,
    path: '/users/me',
  });
  return response.resource;
}

async function resolveUserUri({
  token,
  user,
}: {
  token: string;
  user: string | undefined;
}): Promise<string> {
  if (isProvided(user)) {
    return toUri({ resource: 'users', value: user });
  }
  const currentUser = await getUser(token);
  return currentUser.uri;
}

async function resolveOrganizationUri({
  token,
  organization,
}: {
  token: string;
  organization: string | undefined;
}): Promise<string> {
  if (isProvided(organization)) {
    return toUri({ resource: 'organizations', value: organization });
  }
  const currentUser = await getUser(token);
  return currentUser.current_organization;
}

function toUri({ resource, value }: { resource: string; value: string }): string {
  const trimmed = value.trim();
  return trimmed.startsWith('https://')
    ? trimmed
    : `${BASE_URL}/${resource}/${encodeURIComponent(trimmed)}`;
}

function toUuid({ value }: { value: string }): string {
  const segments = value.trim().replace(/\/+$/, '').split('/');
  return encodeURIComponent(segments[segments.length - 1]);
}

function toInviteeUri({
  invitee,
  scheduledEvent,
}: {
  invitee: string;
  scheduledEvent: string | undefined;
}): string {
  const trimmed = invitee.trim();
  if (trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (!isProvided(scheduledEvent)) {
    throw new Error('Pass the full invitee URI, or set Scheduled Event when Invitee is a UUID.');
  }
  return `${BASE_URL}/scheduled_events/${toUuid({ value: scheduledEvent })}/invitees/${encodeURIComponent(trimmed)}`;
}

function UuidFromUri(uri: string): string | undefined {
  return uri.split('/').pop();
}

function authorizationHeader(personalToken: string): string {
  return `Bearer ${personalToken}`;
}

function pageQuery({
  count,
  pageToken,
}: {
  count: number | undefined;
  pageToken: string | undefined;
}): Record<string, string | undefined> {
  return {
    count: String(
      Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(count ?? DEFAULT_PAGE_SIZE)))
    ),
    page_token: isProvided(pageToken) ? pageToken.trim() : undefined,
  };
}

function toPage<T>({ response }: { response: CalendlyCollection<T> }) {
  return {
    items: response.collection,
    count: response.collection.length,
    next_page_token: response.pagination?.next_page_token ?? null,
  };
}

function validateTimeWindow({
  startTime,
  endTime,
  maxDays,
}: {
  startTime: string;
  endTime: string;
  maxDays: number;
}): { start_time: string; end_time: string } {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error('Start Time and End Time must be valid ISO 8601 date-times.');
  }
  const effectiveStart = Math.max(start, Date.now() + FUTURE_START_BUFFER_MS);
  if (end <= effectiveStart) {
    throw new Error('End Time must be after Start Time and in the future.');
  }
  if (end - effectiveStart > maxDays * DAY_MS) {
    throw new Error(`The range between Start Time and End Time can be at most ${maxDays} days.`);
  }
  return {
    start_time: new Date(effectiveStart).toISOString(),
    end_time: new Date(end).toISOString(),
  };
}

function isProvided(value: string | undefined | null): value is string {
  return value !== undefined && value !== null && value.trim().length > 0;
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

function toCalendlyError({ error }: { error: unknown }): unknown {
  if (!(error instanceof HttpError)) {
    return error;
  }
  const { status, body } = error.response;
  if (!isRecord(body)) {
    return error;
  }
  const requiredScopes = Array.isArray(body['required_scopes'])
    ? body['required_scopes'].filter((scope): scope is string => typeof scope === 'string')
    : [];
  if (status === 403 && requiredScopes.length > 0) {
    return new Error(
      `Your Calendly Personal Access Token is missing the scope(s): ${requiredScopes.join(', ')}. Create a new token with these scopes and reconnect.`
    );
  }
  const title = typeof body['title'] === 'string' ? body['title'] : 'Calendly error';
  const message = typeof body['message'] === 'string' ? body['message'] : '';
  const details = Array.isArray(body['details']) ? ` ${JSON.stringify(body['details'])}` : '';
  return new Error(`${title} (${status}): ${message}${details}`.trim());
}

function eventTypeBody({
  duration,
  description,
  color,
  active,
  locations,
}: EventTypeFieldValues): Record<string, unknown> {
  const locationList = (locations ?? []).filter(isRecord).map((location) =>
    Object.fromEntries(
      Object.entries(location).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== ''
      )
    )
  );
  return {
    ...(duration !== undefined && duration !== null ? { duration } : {}),
    ...(isProvided(description) ? { description } : {}),
    ...(isProvided(color) ? { color: color.trim() } : {}),
    ...(isProvided(active) ? { active: active === 'true' } : {}),
    ...(locationList.length > 0 ? { locations: locationList } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const BASE_URL = 'https://api.calendly.com';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;
const FUTURE_START_BUFFER_MS = 60 * 1000;

const LOCATION_KINDS = [
  { label: 'Zoom', value: 'zoom_conference' },
  { label: 'Google Meet', value: 'google_conference' },
  { label: 'Microsoft Teams', value: 'microsoft_teams_conference' },
  { label: 'Webex', value: 'webex_conference' },
  { label: 'GoToMeeting', value: 'gotomeeting_conference' },
  { label: 'In person', value: 'physical' },
  { label: 'Phone call (host calls invitee)', value: 'outbound_call' },
  { label: 'Phone call (invitee calls host)', value: 'inbound_call' },
  { label: 'Custom', value: 'custom' },
  { label: 'Ask invitee', value: 'ask_invitee' },
];

export const calendlyCommon = {
  baseUrl: BASE_URL,
  scope: Property.StaticDropdown({
    displayName: 'Scope',
    required: true,
    options: {
      options: [
        { value: 'user', label: 'User' },
        { value: 'organization', label: 'Organization' },
      ],
      disabled: false,
    },
  }),
  user: Property.ShortText({
    displayName: 'User',
    description:
      'User URI (https://api.calendly.com/users/...) or UUID. Leave empty to use the connected user.',
    required: false,
  }),
  organization: Property.ShortText({
    displayName: 'Organization',
    description:
      "Organization URI (https://api.calendly.com/organizations/...) or UUID. Leave empty to use the connected user's organization.",
    required: false,
  }),
  eventType: Property.ShortText({
    displayName: 'Event Type',
    description: 'Event type URI (https://api.calendly.com/event_types/...) or UUID, from List Event Types.',
    required: true,
  }),
  scheduledEvent: Property.ShortText({
    displayName: 'Scheduled Event',
    description:
      'Scheduled event URI (https://api.calendly.com/scheduled_events/...) or UUID, from List Scheduled Events or a trigger.',
    required: true,
  }),
  invitee: Property.ShortText({
    displayName: 'Invitee',
    description:
      'Invitee URI (https://api.calendly.com/scheduled_events/.../invitees/...), or its UUID together with Scheduled Event.',
    required: true,
  }),
  optionalScheduledEvent: Property.ShortText({
    displayName: 'Scheduled Event',
    description: 'Scheduled event URI or UUID. Only needed when Invitee is a UUID.',
    required: false,
  }),
  count: Property.Number({
    displayName: 'Page Size',
    description: 'How many items to return, from 1 to 100.',
    required: false,
    defaultValue: DEFAULT_PAGE_SIZE,
  }),
  pageToken: Property.ShortText({
    displayName: 'Page Token',
    description: 'Next Page Token from a previous call. Leave empty for the first page.',
    required: false,
  }),
  eventTypeFields: {
    duration: Property.Number({
      displayName: 'Duration (minutes)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Hex color, for example #ff5733.',
      required: false,
    }),
    active: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ],
      },
    }),
    locations: Property.Array({
      displayName: 'Locations',
      description: 'Replaces all locations of the event type when set.',
      required: false,
      properties: {
        kind: Property.StaticDropdown({
          displayName: 'Kind',
          required: true,
          options: {
            options: LOCATION_KINDS.map((kind) => ({ label: kind.label, value: kind.value })),
          },
        }),
        location: Property.ShortText({
          displayName: 'Location',
          description: 'Address or link, for physical and custom locations.',
          required: false,
        }),
        phone_number: Property.ShortText({
          displayName: 'Phone Number',
          description: 'Required for inbound calls.',
          required: false,
        }),
        additional_info: Property.ShortText({
          displayName: 'Additional Info',
          required: false,
        }),
      },
    }),
  },
  calendlyRequest,
  getUser,
  resolveUserUri,
  resolveOrganizationUri,
  toUri,
  toUuid,
  toInviteeUri,
  pageQuery,
  toPage,
  validateTimeWindow,
  eventTypeBody,
  isProvided,
  authorizationHeader,
  UuidFromUri,
};

export interface CalendlyWebhookInformation {
  webhookId: string;
}

export type CalendlyRecord = Record<string, unknown>;

export type CalendlyCollection<T> = {
  collection: T[];
  pagination?: { next_page_token: string | null };
};

type EventTypeFieldValues = {
  duration?: number | null;
  description?: string | null;
  color?: string | null;
  active?: string | null;
  locations?: unknown[] | null;
};

type CalendlyRequest = {
  token: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string | undefined>;
  body?: unknown;
};

type CalendlyUser = {
  uri: string;
  email: string;
  name: string;
  current_organization: string;
};
