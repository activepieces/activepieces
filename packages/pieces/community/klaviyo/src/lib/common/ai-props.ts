import { Property } from '@activepieces/pieces-framework';
import { isRecord, KlaviyoResource, KlaviyoPage, textOf } from './client';

function idProp({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.ShortText({ displayName, description, required });
}

function yesNoProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<string>({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function pageSizeProp({ max, defaultValue }: { max: number; defaultValue: number }) {
  return Property.Number({
    displayName: 'Page Size',
    description: `How many items to return (1-${max}, default ${defaultValue}).`,
    required: false,
    defaultValue,
  });
}

function cursorProp() {
  return Property.ShortText({
    displayName: 'Cursor',
    description: 'Leave empty for the first page. To get the next page, pass the next_cursor value from the previous call.',
    required: false,
  });
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = optionalText(value);
  if (text === undefined) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function yesNo({ value, label }: { value: unknown; label: string }): boolean | undefined {
  const text = optionalText(value)?.toLowerCase();
  if (text === undefined) {
    return undefined;
  }
  if (text === 'yes' || text === 'true') {
    return true;
  }
  if (text === 'no' || text === 'false') {
    return false;
  }
  throw new Error(`${label} must be "yes" or "no".`);
}

function pageSize({ value, max, defaultValue }: { value: unknown; max: number; defaultValue: number }): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    throw new Error(`Page Size must be a whole number between 1 and ${max}.`);
  }
  return number;
}

function isoDateTime({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  if (!ISO_DATE_TIME.test(text) || Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be an ISO 8601 date-time with a timezone, for example 2026-01-15T10:00:00Z.`);
  }
  return text;
}

function oneOf({ value, label, allowed }: { value: unknown; label: string; allowed: string[] }): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  if (!allowed.includes(text)) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  }
  return text;
}

function flatProfile(profile: KlaviyoResource): Record<string, unknown> {
  const attributes = profile.attributes;
  const location = isRecord(attributes['location']) ? attributes['location'] : {};
  const result: Record<string, unknown> = {
    id: profile.id,
    email: attributes['email'] ?? null,
    phone_number: attributes['phone_number'] ?? null,
    external_id: attributes['external_id'] ?? null,
    first_name: attributes['first_name'] ?? null,
    last_name: attributes['last_name'] ?? null,
    organization: attributes['organization'] ?? null,
    locale: attributes['locale'] ?? null,
    title: attributes['title'] ?? null,
    image: attributes['image'] ?? null,
    created: attributes['created'] ?? null,
    updated: attributes['updated'] ?? null,
    last_event_date: attributes['last_event_date'] ?? null,
    location: {
      address1: location['address1'] ?? null,
      address2: location['address2'] ?? null,
      city: location['city'] ?? null,
      country: location['country'] ?? null,
      region: location['region'] ?? null,
      zip: location['zip'] ?? null,
      timezone: location['timezone'] ?? null,
      ip: location['ip'] ?? null,
      latitude: location['latitude'] ?? null,
      longitude: location['longitude'] ?? null,
    },
    properties: isRecord(attributes['properties']) ? attributes['properties'] : {},
  };
  if (attributes['subscriptions'] !== undefined) {
    result['subscriptions'] = attributes['subscriptions'];
  }
  if (attributes['joined_group_at'] !== undefined) {
    result['joined_group_at'] = attributes['joined_group_at'];
  }
  return result;
}

function flatGroup(resource: KlaviyoResource): Record<string, unknown> {
  return { id: resource.id, ...resource.attributes };
}

function relationshipId({ resource, name }: { resource: KlaviyoResource; name: string }): string | null {
  const relationship = resource.relationships[name];
  const data = isRecord(relationship) ? relationship['data'] : undefined;
  return isRecord(data) ? textOf(data['id']) ?? null : null;
}

function flatEvent(event: KlaviyoResource): Record<string, unknown> {
  const properties = event.attributes['event_properties'];
  return {
    id: event.id,
    uuid: event.attributes['uuid'] ?? null,
    datetime: event.attributes['datetime'] ?? null,
    timestamp: event.attributes['timestamp'] ?? null,
    metric_id: relationshipId({ resource: event, name: 'metric' }),
    profile_id: relationshipId({ resource: event, name: 'profile' }),
    event_properties: isRecord(properties) ? properties : {},
  };
}

function triggerProfile(profile: KlaviyoResource): Record<string, unknown> {
  const attributes = profile.attributes;
  const location = isRecord(attributes['location']) ? attributes['location'] : {};
  const firstName = textOf(attributes['first_name']);
  const lastName = textOf(attributes['last_name']);
  return {
    id: profile.id,
    email: attributes['email'] ?? null,
    phone_number: attributes['phone_number'] ?? null,
    external_id: attributes['external_id'] ?? null,
    first_name: attributes['first_name'] ?? null,
    last_name: attributes['last_name'] ?? null,
    full_name: [firstName, lastName].filter((part) => part !== undefined).join(' ') || null,
    organization: attributes['organization'] ?? null,
    locale: attributes['locale'] ?? null,
    title: attributes['title'] ?? null,
    image: attributes['image'] ?? null,
    created: attributes['created'] ?? null,
    updated: attributes['updated'] ?? null,
    last_event_date: attributes['last_event_date'] ?? null,
    address1: location['address1'] ?? null,
    address2: location['address2'] ?? null,
    city: location['city'] ?? null,
    country: location['country'] ?? null,
    region: location['region'] ?? null,
    zip: location['zip'] ?? null,
    timezone: location['timezone'] ?? null,
    ip: location['ip'] ?? null,
    latitude: location['latitude'] ?? null,
    longitude: location['longitude'] ?? null,
  };
}

function pageOutput({ page, map }: { page: KlaviyoPage; map: (resource: KlaviyoResource) => Record<string, unknown> }): AiPageOutput {
  return { items: page.items.map(map), next_cursor: page.next_cursor, has_more: page.has_more };
}

function profileAttributes(input: ProfileInput): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  const textFields: (keyof ProfileInput)[] = ['email', 'phone_number', 'external_id', 'first_name', 'last_name', 'organization', 'locale', 'title', 'image'];
  for (const field of textFields) {
    const text = optionalText(input[field]);
    if (text !== undefined) {
      attributes[field] = text;
    }
  }
  const location: Record<string, unknown> = {};
  const locationText: (keyof ProfileInput)[] = ['address1', 'address2', 'city', 'country', 'region', 'zip', 'timezone', 'ip'];
  for (const field of locationText) {
    const text = optionalText(input[field]);
    if (text !== undefined) {
      location[field] = text;
    }
  }
  const coordinates: ('latitude' | 'longitude')[] = ['latitude', 'longitude'];
  for (const field of coordinates) {
    const raw = input[field];
    if (raw !== undefined && raw !== null && raw !== '') {
      const number = Number(raw);
      if (!Number.isFinite(number)) {
        throw new Error(`${field === 'latitude' ? 'Latitude' : 'Longitude'} must be a number.`);
      }
      location[field] = number;
    }
  }
  if (Object.keys(location).length > 0) {
    attributes['location'] = location;
  }
  if (isRecord(input.custom_properties) && Object.keys(input.custom_properties).length > 0) {
    attributes['properties'] = input.custom_properties;
  }
  return attributes;
}

export const klaviyoInputs = {
  idProp,
  yesNoProp,
  pageSizeProp,
  cursorProp,
  optionalText,
  requireText,
  yesNo,
  pageSize,
  isoDateTime,
  oneOf,
  flatProfile,
  flatGroup,
  relationshipId,
  flatEvent,
  triggerProfile,
  pageOutput,
  profileAttributes,
};

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

export type AiPageOutput = {
  items: Record<string, unknown>[];
  next_cursor: string | null;
  has_more: boolean;
};

export type ProfileInput = {
  email?: unknown;
  phone_number?: unknown;
  external_id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  organization?: unknown;
  locale?: unknown;
  title?: unknown;
  image?: unknown;
  address1?: unknown;
  address2?: unknown;
  city?: unknown;
  country?: unknown;
  region?: unknown;
  zip?: unknown;
  timezone?: unknown;
  ip?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  custom_properties?: unknown;
};
