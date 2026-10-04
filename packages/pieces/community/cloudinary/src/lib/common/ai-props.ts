import { Property } from '@activepieces/pieces-framework';
import { ResourceList } from './client';

function resourceType({ required }: { required: boolean }) {
  return Property.StaticDropdown({
    displayName: 'Resource Type',
    description: required ? 'The asset type.' : 'The asset type. Leave empty to include all types.',
    required,
    defaultValue: required ? 'image' : undefined,
    options: { options: RESOURCE_TYPE_OPTIONS },
  });
}

function deliveryType() {
  return Property.StaticDropdown({
    displayName: 'Delivery Type',
    description: 'The storage/delivery type of the asset. Defaults to upload.',
    required: false,
    defaultValue: 'upload',
    options: { options: DELIVERY_TYPE_OPTIONS },
  });
}

function maxResults() {
  return Property.Number({
    displayName: 'Max Results',
    description: 'Maximum number of items to return (1-500). Defaults to 10.',
    required: false,
  });
}

function nextCursor() {
  return Property.ShortText({
    displayName: 'Next Cursor',
    description: 'The next_cursor value from a previous call, to fetch the next page.',
    required: false,
  });
}

function direction() {
  return Property.StaticDropdown({
    displayName: 'Sort Direction',
    description: 'Sort by creation time. Defaults to newest first.',
    required: false,
    options: {
      options: [
        { label: 'Newest first', value: 'desc' },
        { label: 'Oldest first', value: 'asc' },
      ],
    },
  });
}

function includeFlag({ displayName, description }: { displayName: string; description: string }) {
  return Property.Checkbox({ displayName, description, required: false, defaultValue: false });
}

function optionalBoolean({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description: `${description} Leave empty to keep the default.`,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

function invalidate() {
  return Property.Checkbox({
    displayName: 'Invalidate CDN Cache',
    description: 'Also invalidate cached copies on the CDN (takes a few minutes to propagate).',
    required: false,
    defaultValue: false,
  });
}

function toBoolean({ value }: { value: string | undefined }): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

function encodePath({ value }: { value: string }): string {
  return value
    .trim()
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}

function requireItems({ values, label, max }: { values: unknown[] | undefined; label: string; max: number }): string[] {
  const items = cleanArray({ values });
  if (items.length === 0 || items.length > max) {
    throw new Error(`Provide between 1 and ${max} ${label}.`);
  }
  return items;
}

function clampMaxResults({ value }: { value: number | undefined }): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return Math.min(Math.max(Math.trunc(value), 1), 500);
}

function toResourceList({ response }: { response: ResourceList }) {
  return {
    resources: response.resources,
    count: response.resources.length,
    total_count: response.total_count ?? null,
    next_cursor: response.next_cursor ?? null,
  };
}

function cleanArray({ values }: { values: unknown[] | undefined }): string[] {
  return (values ?? [])
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

const RESOURCE_TYPE_OPTIONS = [
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
  { label: 'Raw', value: 'raw' },
];

const DELIVERY_TYPE_OPTIONS = [
  { label: 'Upload', value: 'upload' },
  { label: 'Private', value: 'private' },
  { label: 'Authenticated', value: 'authenticated' },
  { label: 'Fetch', value: 'fetch' },
];

export const aiProps = { resourceType, deliveryType, maxResults, nextCursor, direction, includeFlag, optionalBoolean, invalidate };

export const aiResults = { clampMaxResults, toResourceList, cleanArray, toBoolean, encodePath, requireItems };
