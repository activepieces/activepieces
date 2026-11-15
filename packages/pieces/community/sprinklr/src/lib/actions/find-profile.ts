import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrClient, SprinklrAuthValue } from '../common/client';
import { sprinklrEndpoints } from '../common/endpoints';
import { SprinklrApiError, sprinklrErrors } from '../common/errors';

type FindBy = 'email' | 'channel_id' | 'profile_id';

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeProfile(raw: Record<string, unknown>): ProfileOutput {
  const contact = sprinklrErrors.isRecord(raw['contact']) ? raw['contact'] : null;
  const profiles = Array.isArray(raw['profiles']) ? raw['profiles'] : [];
  return {
    found: true,
    id: text(raw['id']),
    contact: contact
      ? { fullName: text(contact['fullName']), email: text(contact['email']), phoneNo: text(contact['phoneNo']) }
      : null,
    profiles: profiles.filter(sprinklrErrors.isRecord).map((p) => ({
      channelType: text(p['channelType']),
      channelId: text(p['channelId']),
      username: text(p['username']),
      name: text(p['name']),
    })),
    createdTime: num(raw['createdTime']),
    modifiedTime: num(raw['modifiedTime']),
  };
}

const NOT_FOUND: ProfileOutput = {
  found: false,
  id: null,
  contact: null,
  profiles: [],
  createdTime: null,
  modifiedTime: null,
};

function first(data: unknown): Record<string, unknown> | undefined {
  const item = Array.isArray(data) ? data[0] : data;
  return sprinklrErrors.isRecord(item) && Object.keys(item).length > 0 ? item : undefined;
}

async function lookup({
  auth,
  findBy,
  value,
  channelType,
}: {
  auth: SprinklrAuthValue;
  findBy: FindBy;
  value: string;
  channelType: string;
}): Promise<Record<string, unknown> | undefined> {
  if (findBy === 'email') {
    const result = await sprinklrClient.search({
      auth,
      entity: sprinklrEndpoints.SEARCH_ENTITY.PROFILE,
      body: { filter: { type: 'IN', key: 'contact.email', values: [value] }, page: { size: 1 } },
      maxResults: 1,
    });
    return first(result.results);
  }
  const query = findBy === 'profile_id' ? { id: value } : { channelTypeChannelId: `${channelType}~${value}` };
  return first(await sprinklrClient.request({ auth, method: HttpMethod.GET, path: sprinklrEndpoints.PROFILE, query }));
}

const outputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'id', label: 'Profile ID' },
    {
      key: 'contact',
      label: 'Contact',
      children: [
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'phoneNo', label: 'Phone Number' },
      ],
    },
    {
      key: 'profiles',
      label: 'Channel Profiles',
      labelKey: 'channelType',
      listItems: [
        { key: 'channelType', label: 'Channel Type' },
        { key: 'channelId', label: 'Channel ID' },
        { key: 'username', label: 'Username' },
        { key: 'name', label: 'Name' },
      ],
    },
    { key: 'createdTime', label: 'Created Time', description: 'Epoch milliseconds' },
    { key: 'modifiedTime', label: 'Modified Time', description: 'Epoch milliseconds' },
  ],
};

export const findProfileAction = createAction({
  auth: sprinklrAuth,
  name: 'find_profile',
  classification: 'READ',
  displayName: 'Find Profile',
  description: 'Finds a customer profile by ID, channel or email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up one Sprinklr customer profile by its exact email, channel account (channel type plus channel ID) or profile ID. Returns found: false instead of failing when nothing matches, so check found before using the fields. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    find_by: Property.StaticDropdown<FindBy, true>({
      displayName: 'Find By',
      required: true,
      defaultValue: 'email',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'email', description: 'Profile email', icon: 'inbox' },
          { label: 'Channel ID', value: 'channel_id', description: 'Handle or ID', icon: 'user' },
          { label: 'Profile ID', value: 'profile_id', description: 'Sprinklr ID', icon: 'code' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Email, Channel ID or Profile ID',
      description: 'The value to look for, matching Find By.',
      placeholder: 'jane.doe@example.com',
      required: true,
    }),
    channel_type: Property.ShortText({
      displayName: 'Channel Type',
      description: 'Needed for Channel ID, e.g. TWITTER, SMS or EMAIL.',
      placeholder: 'TWITTER',
      required: false,
    }),
  },
  async run(context) {
    const findBy = context.propsValue.find_by;
    const value = String(context.propsValue.value ?? '').trim();
    if (value.length === 0) {
      throw new Error('Enter the email, channel ID or profile ID to look for.');
    }
    const channelType = String(context.propsValue.channel_type ?? '').trim().toUpperCase();
    if (findBy === 'channel_id' && channelType.length === 0) {
      throw new Error('Enter the Channel Type (for example TWITTER or SMS) to find a profile by channel ID.');
    }
    try {
      const raw = await lookup({ auth: context.auth, findBy, value, channelType });
      return raw ? normalizeProfile(raw) : NOT_FOUND;
    } catch (error) {
      if (error instanceof SprinklrApiError && error.kind === 'not_found') {
        return NOT_FOUND;
      }
      throw error;
    }
  },
  outputSchema,
});

type ProfileOutput = {
  found: boolean;
  id: string | null;
  contact: { fullName: string | null; email: string | null; phoneNo: string | null } | null;
  profiles: { channelType: string | null; channelId: string | null; username: string | null; name: string | null }[];
  createdTime: number | null;
  modifiedTime: number | null;
};
