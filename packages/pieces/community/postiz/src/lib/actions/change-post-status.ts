import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { postizApiCall, postizPath, PostizAuth, PostizPost, requireText } from '../common';

function toStatus({ value }: { value: unknown }): 'draft' | 'schedule' {
  if (value === 'draft' || value === 'schedule') {
    return value;
  }
  throw new Error('Status must be "draft" or "schedule".');
}

async function findPostState({ auth, postId }: { auth: PostizAuth; postId: string }): Promise<string | null | undefined> {
  const now = Date.now();
  const response = await postizApiCall<{ posts?: PostizPost[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/posts',
    queryParams: {
      startDate: new Date(now - LOOKUP_PAST_MS).toISOString(),
      endDate: new Date(now + LOOKUP_FUTURE_MS).toISOString(),
    },
  });
  const match = (response.body?.posts ?? []).find((post) => post.id === postId);
  return match ? match.state ?? null : undefined;
}

export const changePostStatus = createAction({
  auth: postizAuth,
  name: 'change_post_status',
  classification: 'WRITE',
  displayName: 'Change Post Status',
  description: 'Moves a post to draft or back to the publishing queue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Moves a Postiz post between draft and scheduled. "schedule" queues it to publish at its stored date (immediately if that date has passed); "draft" stops it from publishing. The date is not changed. Scheduling a post whose date has already passed publishes it immediately. Never use it on published posts; published or unknown posts are refused. Needs a post ID from List Posts or a create action, for a post dated within the last year or next two years. Not idempotent: scheduling again restarts the publishing workflow.',
    idempotent: false,
  },
  outputSchema: {
    fields: [
      { key: 'id', label: 'Post ID' },
      { key: 'state', label: 'State' },
    ],
  },
  props: {
    post_id: Property.ShortText({
      displayName: 'Post ID',
      description: 'ID of the post, from List Posts or a create action.',
      required: true,
    }),
    status: Property.StaticDropdown<string>({
      displayName: 'Status',
      description: 'Draft stops publishing; Scheduled queues it again.',
      required: true,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'schedule' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const postId = requireText({ value: propsValue.post_id, label: 'Post ID' });
    const status = toStatus({ value: propsValue.status });
    const state = await findPostState({ auth, postId });
    if (state === undefined) {
      throw new Error(`Post "${postId}" was not found among posts dated from one year ago to two years ahead, so its status was not changed.`);
    }
    if (state === 'PUBLISHED') {
      throw new Error(`Post "${postId}" is already published, so its status cannot be changed.`);
    }
    const response = await postizApiCall<{ id?: string; state?: string }>({
      auth,
      method: HttpMethod.PUT,
      path: `${postizPath({ segments: ['posts', postId, 'status'] })}`,
      body: { status },
    });
    return {
      id: response.body?.id ?? postId,
      state: response.body?.state ?? null,
    };
  },
});

const LOOKUP_PAST_MS = 365 * 24 * 60 * 60 * 1000;
const LOOKUP_FUTURE_MS = 2 * 365 * 24 * 60 * 60 * 1000;
