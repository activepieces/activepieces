import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../common/auth';
import { famulorRequest, flattenCampaign } from '../common/client';
import { assistantDropdown } from '../common/props';

export const createCampaign = createAction({
  auth: famulorAuth,
  name: 'createCampaign',
  displayName: 'Create Campaign',
  description: 'Create an outbound phone-call campaign. Assign an assistant before you start it in Famulor.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Create an outbound Famulor phone campaign bound to an assistant UUID. Does not start the campaign. Each call creates a new campaign.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Campaign name',
      description: 'Name shown in the Famulor dashboard',
      required: true,
    }),
    assistant_id: assistantDropdown(true),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone for calling windows, for example Europe/Berlin',
      required: false,
    }),
    concurrency: Property.Number({
      displayName: 'Max parallel calls',
      description: 'How many calls the dialer may place at the same time',
      required: false,
      defaultValue: 1,
    }),
    retry_max: Property.Number({
      displayName: 'Max retries',
      description: 'How often a lead is retried after no-answer, busy, or failed (0 = no retries)',
      required: false,
      defaultValue: 2,
    }),
    retry_delay_minutes: Property.Number({
      displayName: 'Retry delay (minutes)',
      description: 'Minutes to wait before retrying a lead',
      required: false,
      defaultValue: 60,
    }),
    retry_on_voicemail: Property.Checkbox({
      displayName: 'Retry on voicemail',
      description: 'Retry when answering-machine detection reaches voicemail',
      required: false,
      defaultValue: false,
    }),
    mark_complete_when_no_leads: Property.Checkbox({
      displayName: 'Mark complete when no leads',
      description: 'Automatically complete the campaign when no open leads remain',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const name = propsValue.name.trim();
    if (!name) {
      throw new Error('Campaign name is required.');
    }

    const response = await famulorRequest({
      auth,
      method: HttpMethod.POST,
      path: '/campaigns',
      body: {
        name,
        assistant_id: propsValue.assistant_id,
        timezone: propsValue.timezone?.trim() || undefined,
        concurrency: propsValue.concurrency,
        retry_max: propsValue.retry_max,
        retry_delay_minutes: propsValue.retry_delay_minutes,
        retry_on_voicemail: propsValue.retry_on_voicemail,
        mark_complete_when_no_leads: propsValue.mark_complete_when_no_leads,
      },
    });

    return flattenCampaign(response);
  },
});
