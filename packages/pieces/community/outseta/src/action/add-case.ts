import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const addCaseAction = createAction({
  name: 'add_case',
  auth: outsetaAuth,
  displayName: 'Create Ticket',
  description: 'Create a new support ticket (case) in Outseta.',
  props: {
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: true,
      description: 'The UID of the person submitting the ticket.',
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
      description: 'Subject line of the ticket.',
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: true,
      description: 'Body content of the ticket.',
    }),
    source: Property.StaticDropdown({
      displayName: 'Source',
      required: true,
      description: 'The source channel of the ticket.',
      options: {
        disabled: false,
        options: [
          { label: 'Website', value: 1 },
          { label: 'Email', value: 2 },
          { label: 'Facebook', value: 3 },
          { label: 'Twitter', value: 4 },
        ],
      },
    }),
    sendAutoResponder: Property.Checkbox({
      displayName: 'Send Auto Responder',
      required: false,
      defaultValue: true,
      description: 'Whether to send an auto-responder email to the person.',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const sendAutoResponder = context.propsValue.sendAutoResponder ?? true;

    const body = {
      FromPerson: { Uid: context.propsValue.personUid },
      Subject: context.propsValue.subject,
      Body: context.propsValue.body,
      Source: context.propsValue.source,
    };

    const result = await client.post<any>(
      `/api/v1/support/cases?sendAutoResponder=${sendAutoResponder}`,
      body
    );

    return result;
  },
});
