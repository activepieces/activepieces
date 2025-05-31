import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

export const startCall = createAction({
  name: 'startCall',
  displayName: 'Start Call',
  description: 'Start a call using Voho AI',
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Voho API key',
      required: true,
    }),
    assistantId: Property.ShortText({
      displayName: 'Assistant ID',
      description: 'The ID of the assistant to use for the call',
      required: true,
    }),
    phoneNumberId: Property.ShortText({
      displayName: 'Phone Number ID',
      description: 'The ID of the phone number to use for the call',
      required: true,
    }),
    customerNumber: Property.ShortText({
      displayName: 'Customer Phone Number',
      description: 'The customer phone number to call',
      required: true,
    }),
  },
  async run(context) {
    const { apiKey, assistantId, phoneNumberId, customerNumber } = context.propsValue;

    try {
      const response = await axios.post(
        'https://api.teloai.app/api/activepiece/create-call',
        {
          assistantId: assistantId,
          phoneNumberId: phoneNumberId,
          customer: {
            number: customerNumber,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `Bearer ${apiKey}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          },
        };
      }
      
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred',
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  },
});
