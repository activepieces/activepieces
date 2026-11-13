import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListAlertsOutputSchema } from '../../output-schemas';

export const listAlertsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_alerts',
  outputSchema: metabaseListAlertsOutputSchema,
  displayName: 'List Alerts',
  description: 'List question alerts.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists alerts on questions (cards), optionally for one card or creator, with their schedule, condition and recipients. Dashboard subscriptions are listed by List Dashboard Subscriptions.',
    idempotent: true,
  },
  props: {
    cardId: metabaseAiProps.cardId({
      required: false,
      description:
        'Only alerts on this question, from List Cards. Empty = all.',
    }),
    creatorId: metabaseAiProps.userId({
      required: false,
      displayName: 'Creator ID',
      description:
        'Only alerts created by this user, from List Users. Empty = all.',
    }),
    includeInactive: Property.Checkbox({
      displayName: 'Include Inactive',
      description: 'Also return archived (inactive) alerts.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const alerts = await metabaseApi.listAlerts({
      auth,
      payloadType: 'notification/card',
      cardId: propsValue.cardId,
      creatorId: propsValue.creatorId,
      includeInactive: propsValue.includeInactive ?? false,
    });
    return { alerts, count: alerts.length };
  },
});
