import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { moosendAuth } from '../common/auth';
import { moosendApiCall } from '../common/client';

export const createCampaign = createAction({
  auth: moosendAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new email campaign in Moosend.',
  props: {
    mailing_list_id: Property.ShortText({
      displayName: 'Mailing List ID',
      description: 'The ID of the mailing list to send to.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the campaign.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'Internal name for the campaign.',
      required: true,
    }),
    confirmation_email: Property.ShortText({
      displayName: 'Confirmation Email',
      description: 'Email to send confirmation to.',
      required: true,
    }),
    web_location: Property.ShortText({
      displayName: 'Web Version URL',
      description: 'URL for the web version of the campaign.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const body: Record<string, unknown> = {
      MailingListID: props.mailing_list_id,
      Subject: props.subject,
      Name: props.name,
      ConfirmationEmail: props.confirmation_email,
    };
    if (props.web_location) body['WebVersionLocation'] = props.web_location;

    const response = await moosendApiCall<{ Context: { ID: string } }>({
      method: HttpMethod.POST,
      path: 'campaigns/create.json',
      auth: context.auth,
      body,
    });

    return response.body.Context;
  },
});
