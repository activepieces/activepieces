import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bushbulletAuth } from '../../common/auth';
import { PushbulletPush, pushbulletApi } from '../../common/client';
import { pushbulletOutputSchemas } from '../../common/output-schemas';

export const aiListPushes = createAction({
  auth: bushbulletAuth,
  name: 'ai_list_pushes',
  displayName: 'List Pushes',
  description: 'Lists recent pushes, newest first.',
  audience: 'ai',
  classification: 'SEARCH',
  outputSchema: pushbulletOutputSchemas.listPushes,
  aiMetadata: {
    description:
      'Lists pushes on the Pushbullet account (sent and received), newest first by modification time, one page at a time. Use it to find a push iden for Dismiss Push or Delete Push, or to read incoming notes and links. Only non-deleted pushes are returned. Set modifiedAfter (Unix seconds) to get only pushes changed since then, and pass the returned cursor to fetch the next page; an empty cursor means no more pages.',
    idempotent: true,
  },
  props: {
    modifiedAfter: Property.Number({
      displayName: 'Modified After',
      description: 'Only pushes created or changed after this Unix time in seconds, e.g. 1735689600.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum pushes in this page (1–500). Defaults to 20.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'The cursor from a previous call, to get the next page.',
      required: false,
    }),
  },
  async run(context) {
    const { modifiedAfter, limit, cursor } = context.propsValue;
    const queryParams: Record<string, string> = {
      active: 'true',
      limit: String(Math.min(Math.max(Math.trunc(limit ?? 20), 1), 500)),
    };
    if (typeof modifiedAfter === 'number' && Number.isFinite(modifiedAfter)) {
      queryParams['modified_after'] = String(modifiedAfter);
    }
    if (cursor && cursor.trim()) {
      queryParams['cursor'] = cursor.trim();
    }
    const response = await pushbulletApi.request<{ pushes?: PushbulletPush[]; cursor?: string }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/pushes',
      queryParams,
    });
    return { pushes: response.pushes ?? [], cursor: response.cursor ?? null };
  },
});
