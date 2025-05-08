import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const createCampaignAction = createAction({
  auth: instantlyAiAuth,
  name: 'create_campaign',
  displayName: 'Create Campaign',
  description: 'Create a new cold email campaign in Instantly',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign Name',
      description: 'Name of the campaign',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Subject line for the campaign emails',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Email Body',
      description: 'HTML content for the campaign emails',
      required: true,
    }),
    from_email: Property.ShortText({
      displayName: 'From Email',
      description: 'Email address to send from',
      required: true,
    }),
    schedule_date: Property.DateTime({
      displayName: 'Schedule Date',
      description: 'Date to schedule the campaign',
      required: false,
    }),
    auto_start: Property.Checkbox({
      displayName: 'Auto Start',
      description: 'Whether to start the campaign automatically',
      required: false,
      defaultValue: false,
    }),
    list_id: Property.ShortText({
      displayName: 'Lead List ID',
      description: 'ID of the lead list to use for this campaign',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      subject,
      body,
      from_email,
      schedule_date,
      auto_start,
      list_id,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const payload: Record<string, unknown> = {
      name,
      subject,
      body,
      from_email,
    };

    if (schedule_date) {
      payload['schedule_date'] = schedule_date;
    }

    if (auto_start !== undefined) {
      payload['auto_start'] = auto_start;
    }

    if (list_id) {
      payload['list_id'] = list_id;
    }

    return await makeRequest({
      endpoint: 'campaigns',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: payload,
    });
  },
});
