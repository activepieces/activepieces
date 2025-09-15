import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const makeOutboundCallAction = createAction({
  name: 'make_outbound_call',
  displayName: 'Make Outbound Call',
  description: 'Makes outbound call to given a number',
  props: {
    widget_id: Property.ShortText({
      displayName: 'Widget ID',
      description: 'Widget ID to be used for initiating the call. It must be connected to Twilio, Plivo or Telnyx.',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number to call. Must be in E.164 format. Ex: 16501234567',
      required: true,
    }),
    prompt_dynamic_variables: Property.Object({
      displayName: 'Prompt Dynamic Variables',
      description: 'Dynamic variables to be used in the prompt. Ex: {\'name\': \'Bob\', \'appointment_day\': \'tomorrow\', \'reason\': \'for confirmation of appointment\'}',
      required: false,
    }),
  },
  async run(context) {
    const {
      widget_id,
      to,
      prompt_dynamic_variables,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const url = `https://api.insighto.ai/api/v1/call/${widget_id}`;

    const queryParams: Record<string, string> = {
      api_key: apiKey,
    };

    const body: any = {
      to,
    };

    if (prompt_dynamic_variables) {
      body.prompt_dynamic_variables = prompt_dynamic_variables;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      queryParams,
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
