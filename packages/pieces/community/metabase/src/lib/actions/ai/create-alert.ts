import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateAlertOutputSchema } from '../../output-schemas';

export const createAlertAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_alert',
  outputSchema: metabaseCreateAlertOutputSchema,
  displayName: 'Create Alert',
  description: 'Create an email alert on a saved question.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an email alert on a question (card) that runs on a cron schedule and emails Metabase users and/or external addresses when the condition is met. Each call creates a new alert.',
    idempotent: false,
  },
  props: {
    cardId: metabaseAiProps.cardId({ required: true }),
    cronSchedule: Property.ShortText({
      displayName: 'Cron Schedule',
      description:
        'Quartz cron expression (seconds first), e.g. "0 0 9 * * ?" for every day at 09:00.',
      required: true,
    }),
    sendCondition: Property.StaticDropdown({
      displayName: 'Send When',
      description:
        'When the alert fires. Goal conditions need a goal line on the chart.',
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
    sendOnce: Property.Checkbox({
      displayName: 'Send Once',
      description: 'Stop the alert after it fires the first time.',
      required: false,
      defaultValue: false,
    }),
    recipientUserIds: Property.Array({
      displayName: 'Recipient User IDs',
      description: 'Numeric IDs of Metabase users to email, from List Users.',
      required: false,
    }),
    recipientEmails: Property.Array({
      displayName: 'Recipient Emails',
      description: 'External email addresses to send to.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const recipientUserIds = propsValue.recipientUserIds ?? [];
    if (
      !recipientUserIds.every(
        (id): id is number => typeof id === 'number' && Number.isInteger(id)
      )
    ) {
      throw new Error('Recipient User IDs must be a list of numeric IDs.');
    }
    const recipientEmails = propsValue.recipientEmails ?? [];
    if (
      !recipientEmails.every(
        (value): value is string => typeof value === 'string' && value !== ''
      )
    ) {
      throw new Error('Recipient Emails must be a list of non-empty strings.');
    }
    if (recipientUserIds.length + recipientEmails.length === 0) {
      throw new Error(
        'Set at least one recipient in Recipient User IDs or Recipient Emails.'
      );
    }
    return await metabaseApi.createAlert({
      auth,
      body: {
        payload_type: 'notification/card',
        payload: {
          card_id: propsValue.cardId,
          send_condition: propsValue.sendCondition ?? 'has_result',
          send_once: propsValue.sendOnce ?? false,
        },
        subscriptions: [
          {
            type: 'notification-subscription/cron',
            cron_schedule: propsValue.cronSchedule,
          },
        ],
        handlers: [
          {
            channel_type: 'channel/email',
            recipients: [
              ...recipientUserIds.map((userId) => ({
                type: 'notification-recipient/user',
                user_id: userId,
              })),
              ...recipientEmails.map((email) => ({
                type: 'notification-recipient/raw-value',
                details: { value: email },
              })),
            ],
          },
        ],
      },
    });
  },
});
