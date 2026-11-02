import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { antworkAuth } from '../auth';
import { antworkApiCall, antworkCommon, idempotencyKey } from '../common';

type PostResult = {
  id: string;
  accountId: string;
  platform: string;
  status: string;
  reason: string | null;
  message: string | null;
  editUrl: string | null;
};

export const createDraftPost = createAction({
  auth: antworkAuth,
  name: 'create_draft_post',
  classification: 'WRITE',
  displayName: 'Create Draft Post',
  description: 'Save a draft for one social account. Nothing is published until you schedule or publish it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Saves a draft post for exactly one connected social account in an Antwork workspace. Never publishes: use Schedule Post or Publish Post with the returned id to send it. Text must fit the platform limit (X 280, Bluesky 300, Threads 500, LinkedIn 3000). Instagram and Pinterest need an image or video and TikTok and YouTube a video, passed as public media URLs. Not idempotent across runs: each run creates a new draft.',
    idempotent: false,
  },
  props: {
    workspace: antworkCommon.workspace(true),
    account: antworkCommon.account(true),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The post copy. Platform limits apply at publish time.',
      required: true,
    }),
    mediaUrls: Property.Array({
      displayName: 'Media URLs',
      description:
        'Public links to images, videos or PDFs. Antwork downloads each into its media library (needs the `media` scope).',
      required: false,
    }),
    proposedTime: Property.DateTime({
      displayName: 'Proposed Time',
      description: 'Only proposes a time on the draft. It does not schedule anything; use Schedule Post for that.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const { workspace, account, text, mediaUrls, proposedTime } = context.propsValue;
    const runId = context.run.id;

    // Media on a post must be Antwork-hosted, so a public link goes through
    // POST /media (the server fetches it into the library) first.
    const media: string[] = [];
    for (const url of (mediaUrls ?? []) as string[]) {
      const body = { url: String(url).trim(), workspaceId: workspace };
      const uploaded = await antworkApiCall<{ id: string }>({
        apiKey,
        method: HttpMethod.POST,
        path: '/media',
        body,
        idempotencyKey: idempotencyKey(runId, 'media', body),
      });
      media.push(uploaded.body.id);
    }

    // `draft: true` always: POST /posts without it publishes immediately.
    const body = {
      accounts: [account],
      text,
      draft: true,
      workspaceId: workspace,
      ...(media.length ? { media } : {}),
      ...(proposedTime ? { scheduledFor: new Date(proposedTime).toISOString() } : {}),
    };
    const response = await antworkApiCall<{ posts: PostResult[]; campaignId: string | null }>({
      apiKey,
      method: HttpMethod.POST,
      path: '/posts',
      body,
      idempotencyKey: idempotencyKey(runId, 'draft', body),
    });

    // A refused target is a row, not an HTTP error.
    const row = response.body.posts?.[0];
    if (!row) throw new Error('Antwork returned no post for this request.');
    if (row.status !== 'accepted') {
      throw new Error(row.message || `Antwork refused the post (${row.reason ?? 'rejected'}).`);
    }
    return { ...row, status: 'draft', text, campaignId: response.body.campaignId ?? null };
  },
});
