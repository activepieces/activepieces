import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../auth';
import { createMailgunClient, MailgunEventResponse } from '../common/client';

export const getEventsAction = createAction({
  auth: mailgunAuth,
  name: 'get_events',
  displayName: 'Get Events',
  description: 'List Mailgun events for the configured domain.',
  props: {
    event: Property.ShortText({
      displayName: 'Event',
      description: 'For example accepted, delivered, opened, clicked, failed, or stored.',
      required: false,
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    begin: Property.ShortText({
      displayName: 'Begin',
      description: 'Beginning of the search window. Accepts Mailgun-supported date strings.',
      required: false,
    }),
    end: Property.ShortText({
      displayName: 'End',
      description: 'End of the search window. Accepts Mailgun-supported date strings.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const client = createMailgunClient(context.auth.props);
    return (await client.events.get(context.auth.props.domain, {
      event: context.propsValue.event,
      recipient: context.propsValue.recipient,
      subject: context.propsValue.subject,
      begin: context.propsValue.begin,
      end: context.propsValue.end,
      limit: context.propsValue.limit,
    })) as unknown as MailgunEventResponse;
  },
});
