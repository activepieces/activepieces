import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateAlertOutputSchema } from '../../output-schemas';

export const updateAlertAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_alert',
  outputSchema: metabaseUpdateAlertOutputSchema,
  displayName: 'Update Alert',
  description: 'Change or archive a question alert.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the settings you set on an alert (active state, condition, send-once, schedule); everything else, including recipients, is kept. Archive with Active = No. Concurrent edits to the same alert can overwrite each other.',
    idempotent: true,
  },
  props: {
    alertId: metabaseAiProps.alertId({ required: true }),
    active: metabaseAiProps.yesNo({
      displayName: 'Active',
      description: 'No archives the alert, Yes restores it. Empty = unchanged.',
      required: false,
    }),
    sendCondition: Property.StaticDropdown({
      displayName: 'Send When',
      description: 'When the alert fires. Empty = unchanged.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'The question has results', value: 'has_result' },
          { label: 'Results go above the goal', value: 'goal_above' },
          { label: 'Results go below the goal', value: 'goal_below' },
        ],
      },
    }),
    sendOnce: metabaseAiProps.yesNo({
      displayName: 'Send Once',
      description: 'Stop after the first send. Empty = unchanged.',
      required: false,
    }),
    cronSchedule: Property.ShortText({
      displayName: 'Cron Schedule',
      description:
        'New Quartz cron expression, e.g. "0 0 9 * * ?". Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const current = await metabaseApi.getAlert({
      auth,
      alertId: propsValue.alertId,
    });
    const cronSchedule = propsValue.cronSchedule;
    return await metabaseApi.updateAlert({
      auth,
      alertId: propsValue.alertId,
      body: {
        ...current,
        active: propsValue.active ?? current.active,
        payload: {
          ...current.payload,
          send_condition:
            propsValue.sendCondition ?? current.payload?.['send_condition'],
          send_once: propsValue.sendOnce ?? current.payload?.['send_once'],
        },
        subscriptions:
          cronSchedule === undefined
            ? current.subscriptions
            : (current.subscriptions ?? []).map((subscription) => ({
                ...subscription,
                cron_schedule: cronSchedule,
              })),
      },
    });
  },
});
