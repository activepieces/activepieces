import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateDashboardSubscriptionOutputSchema } from '../../output-schemas';

export const createDashboardSubscriptionAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_dashboard_subscription',
  outputSchema: metabaseCreateDashboardSubscriptionOutputSchema,
  displayName: 'Create Dashboard Subscription',
  description: 'Email a dashboard on a schedule.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an email subscription that sends every card of a dashboard on a schedule to Metabase users and/or external addresses. Each call creates a new subscription.',
    idempotent: false,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Subscription name. Empty = the dashboard name.',
      required: false,
    }),
    scheduleType: Property.StaticDropdown({
      displayName: 'Frequency',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Hourly', value: 'hourly' },
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
        ],
      },
    }),
    scheduleHour: Property.Number({
      displayName: 'Hour',
      description:
        'Hour of day (0-23, instance time zone) for daily, weekly and monthly. Defaults to 8.',
      required: false,
    }),
    scheduleDay: Property.StaticDropdown({
      displayName: 'Day',
      description:
        'Day of the week for weekly, or with "first"/"last" for monthly.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Monday', value: 'mon' },
          { label: 'Tuesday', value: 'tue' },
          { label: 'Wednesday', value: 'wed' },
          { label: 'Thursday', value: 'thu' },
          { label: 'Friday', value: 'fri' },
          { label: 'Saturday', value: 'sat' },
          { label: 'Sunday', value: 'sun' },
        ],
      },
    }),
    scheduleFrame: Property.StaticDropdown({
      displayName: 'Monthly On',
      description:
        'For monthly: the first, middle or last day (or weekday with Day) of the month.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'First', value: 'first' },
          { label: 'Middle', value: 'mid' },
          { label: 'Last', value: 'last' },
        ],
      },
    }),
    skipIfEmpty: Property.Checkbox({
      displayName: 'Skip If Empty',
      description: 'Do not send when every card has no results.',
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
    const dashboard = await metabaseApi.getDashboard({
      auth,
      dashboardId: propsValue.dashboardId,
    });
    const cards = (dashboard.dashcards ?? []).flatMap((dashcard) =>
      dashcard.card_id
        ? [
            {
              id: dashcard.card_id,
              dashboard_card_id: dashcard.id,
              include_csv: false,
              include_xls: false,
            },
          ]
        : []
    );
    if (cards.length === 0) {
      throw new Error('The dashboard has no question cards to send.');
    }
    return await metabaseApi.createDashboardSubscription({
      auth,
      body: {
        name: propsValue.name ?? dashboard.name,
        dashboard_id: propsValue.dashboardId,
        cards,
        skip_if_empty: propsValue.skipIfEmpty ?? false,
        channels: [
          {
            channel_type: 'email',
            enabled: true,
            schedule_type: propsValue.scheduleType,
            schedule_hour:
              propsValue.scheduleType === 'hourly'
                ? null
                : propsValue.scheduleHour ?? 8,
            schedule_day: propsValue.scheduleDay ?? null,
            schedule_frame: propsValue.scheduleFrame ?? null,
            recipients: [
              ...recipientUserIds.map((id) => ({ id })),
              ...recipientEmails.map((email) => ({ email })),
            ],
          },
        ],
      },
    });
  },
});
