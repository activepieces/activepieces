import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { sendpulseApiCall } from '../common/client';
import { mailingListDropdown } from '../common/props';

type SendpulseVariable = {
  name: string;
  type: string;
};

const variableDropdown = Property.Dropdown({
  displayName: 'Variable Name',
  description: 'Select variable to update',
  required: true,
  refreshers: ['mailingListId'],
  options: async ({ auth, mailingListId }) => {
    if (!auth || !mailingListId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a mailing list first',
      };
    }

    try {
      const variables = await sendpulseApiCall<SendpulseVariable[]>({
        auth: auth as any,
        method: HttpMethod.GET,
        resourceUri: `/addressbooks/${mailingListId}/variables`,
      });

      if (!variables.length) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No variables found in this mailing list',
        };
      }

      return {
        disabled: false,
        options: variables
          .filter(variable => variable.name !== 'email')
          .map((variable) => ({
            label: `${variable.name} (${variable.type})`,
            value: variable.name,
          })),
      };
    } catch (error: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load variables: ${error.message}`,
      };
    }
  },
});

export const changeVariableForSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'change-variable-for-subscriber',
  displayName: 'Change Variable for Subscriber',
  description: 'Update subscriber variable',
  props: {
    mailingListId: mailingListDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Subscriber email address',
      required: true,
    }),
    variableName: variableDropdown,
    variableValue: Property.ShortText({
      displayName: 'Variable Value',
      description: 'New value for the variable',
      required: true,
    }),
  },

  async run(context) {
    const { mailingListId, email, variableName, variableValue } = context.propsValue;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    let variableType: string | null = null;
    try {
      const variables = await sendpulseApiCall<SendpulseVariable[]>({
        auth: context.auth,
        method: HttpMethod.GET,
        resourceUri: `/addressbooks/${mailingListId}/variables`,
      });
      
      const variable = variables.find(v => v.name === variableName);
      if (variable) {
        variableType = variable.type;
      }
    } catch (error) {
      // Continue without type validation if variable fetch fails
    }

    if (variableType) {
      if (variableType === 'number' && isNaN(Number(variableValue))) {
        throw new Error(`Variable "${variableName}" expects a number, but got: ${variableValue}`);
      }
      
      if (variableType === 'date') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(variableValue) && !Date.parse(variableValue)) {
          throw new Error(`Variable "${variableName}" expects a date format (YYYY-MM-DD), but got: ${variableValue}`);
        }
      }
    }

    const body = {
      email,
      variables: [
        {
          name: variableName,
          value: variableValue,
        },
      ],
    };

    try {
      const result = await sendpulseApiCall<{ result: boolean }>({
        method: HttpMethod.POST,
        auth: context.auth,
        resourceUri: `/addressbooks/${mailingListId}/emails/variable`,
        body,
      });

      if (result.result) {
        return {
          success: true,
          message: `Variable "${variableName}" updated for ${email}`,
          email,
          variableName,
          variableValue,
          variableType,
        };
      } else {
        throw new Error('SendPulse API returned failure');
      }
    } catch (error: any) {
      throw new Error(`Failed to update variable: ${error.message || 'Unknown error'}`);
    }
  },
});
