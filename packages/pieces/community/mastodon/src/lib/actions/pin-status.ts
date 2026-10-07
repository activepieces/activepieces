import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const pinStatus = createAction({
  auth: mastodonAuth,
  name: 'pin_status',
  classification: 'WRITE',
  displayName: 'Pin Status to Profile',
  description: 'Feature one of your statuses at the top of your profile.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pins one of the connected account\'s own public, unlisted or (Mastodon 3.5+) followers-only statuses to the top of its profile, visible to profile visitors; direct messages cannot be pinned and servers cap the number of pins. Pinning an already-pinned status may be rejected, so do not blindly retry. Returns the updated status.',
    idempotent: false,
  },
  outputSchema: statusOutputSchema,
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description:
        'Local ID of your own status. Obtain it from Create Status, Get Status or List Account Statuses.',
      required: true,
    }),
  },
  async run(context) {
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/statuses/${encodeURIComponent(context.propsValue.status_id)}/pin`,
      operation: 'Pin Status to Profile',
      scope: 'write:accounts',
    });
  },
});
