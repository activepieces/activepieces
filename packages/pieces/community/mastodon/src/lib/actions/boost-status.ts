import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { MastodonEntity, mastodonClient, mastodonUtils } from '../common/client';
import { statusOutputSchema } from '../output-schemas';

export const boostStatus = createAction({
  auth: mastodonAuth,
  name: 'boost_status',
  classification: 'WRITE',
  displayName: 'Boost Status',
  description: 'Share a status with your followers by boosting it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Boosts (reblogs) a status so it appears to the connected account\'s followers and the author is notified. Visibility defaults to the account\'s default posting privacy, not public; set it explicitly to control reach. Boosting an already-boosted status returns the existing boost, so it is safe to retry. Use Unboost Status to undo.',
    idempotent: true,
  },
  outputSchema: statusOutputSchema,
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Status to Boost',
      icon: 'send',
      props: ['status_id', 'visibility'],
    },
  ],
  props: {
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'ID of the status, for example from a trigger, Get Status or Search.',
      placeholder: '109372843234737004',
      required: true,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Who sees the boost. Empty uses your account default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Followers only', value: 'private' },
        ],
      },
    }),
  },
  async run(context) {
    const { status_id, visibility } = context.propsValue;
    return mastodonClient.request<MastodonEntity>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/api/v1/statuses/${encodeURIComponent(status_id)}/reblog`,
      operation: 'Boost Status',
      scope: 'write:statuses',
      body: mastodonUtils.hasValue(visibility) ? { visibility } : {},
    });
  },
});
