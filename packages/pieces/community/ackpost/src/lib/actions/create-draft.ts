import { createAction, Property } from '@activepieces/pieces-framework';
import { ackpostAuth } from '../common/auth';
import { createClient, callMcp, MCP_BASE_URL } from '../common/client';

function parseCsvList(input?: string): string[] {
  if (!input) {
    return [];
  }
  return input
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function validateIsoDateTime(input?: string): string | null {
  if (!input || input.trim().length === 0) {
    return null;
  }
  const timestamp = Date.parse(input);
  if (Number.isNaN(timestamp)) {
    throw new Error('Schedule At must be a valid ISO datetime.');
  }
  return new Date(timestamp).toISOString();
}

export const createDraft = createAction({
  auth: ackpostAuth,
  name: 'create_draft',
  displayName: 'Create Draft',
  description: 'Creates a new social media post draft in AckPost.',
  props: {
    brandId: Property.ShortText({
      displayName: 'Brand ID',
      description: 'The brand/workspace to create the draft under.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Post Text',
      description: 'The content of the social post.',
      required: true,
    }),
    destinations: Property.ShortText({
      displayName: 'Destination IDs',
      description: 'Comma-separated destination IDs to publish to.',
      required: false,
    }),
    mediaUrls: Property.ShortText({
      displayName: 'Media URLs',
      description: 'Comma-separated URLs of images/videos to attach.',
      required: false,
    }),
    scheduleAt: Property.ShortText({
      displayName: 'Schedule At',
      description: 'ISO datetime to schedule the post. Leave empty for draft-only.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createClient(MCP_BASE_URL, auth.apiKey);
    const destinations = parseCsvList(propsValue.destinations);
    const mediaUrls = parseCsvList(propsValue.mediaUrls);
    const invalidMediaUrl = mediaUrls.find((url) => !/^https?:\/\//i.test(url));
    if (invalidMediaUrl) {
      throw new Error(`Invalid media URL: ${invalidMediaUrl}`);
    }

    return callMcp(client, 'draft/create', {
      workspace_id: auth.workspaceId,
      brand_id: propsValue.brandId,
      text: propsValue.text,
      destinations,
      media_urls: mediaUrls,
      schedule_at: validateIsoDateTime(propsValue.scheduleAt),
    });
  },
});
