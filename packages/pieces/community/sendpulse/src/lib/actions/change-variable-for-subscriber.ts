import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { isRecord, normalizeEmail, parseMailingListId, sendpulseApiCall, SendPulseAuthProps } from '../common/client';
import { mailingListDropdown } from '../common/props';

async function fetchVariables({ auth, listId }: { auth: SendPulseAuthProps; listId: string }): Promise<{ name: string; type: string }[]> {
  const response = await sendpulseApiCall<unknown>({
    auth,
    method: HttpMethod.GET,
    resourceUri: `/addressbooks/${listId}/variables`,
    operation: 'list mailing list variables',
  });
  return (Array.isArray(response) ? response : []).flatMap((item) =>
    isRecord(item) && typeof item['name'] === 'string'
      ? [{ name: item['name'], type: typeof item['type'] === 'string' ? item['type'] : 'string' }]
      : [],
  );
}

function assertValueMatchesType({ variableName, variableValue, variableType }: { variableName: string; variableValue: string; variableType: string }): void {
  if (variableType === 'number' && (variableValue.trim() === '' || isNaN(Number(variableValue)))) {
    throw new Error(`Variable "${variableName}" expects a number, but got: ${variableValue}`);
  }
  if (variableType === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(variableValue) && isNaN(Date.parse(variableValue))) {
    throw new Error(`Variable "${variableName}" expects a date format (YYYY-MM-DD), but got: ${variableValue}`);
  }
}

const variableDropdown = Property.Dropdown({
  auth: sendpulseAuth,
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
      const variables = await fetchVariables({ auth: auth.props, listId: parseMailingListId(mailingListId) });
      const options = variables
        .filter((variable) => variable.name !== 'email')
        .map((variable) => ({
          label: `${variable.name} (${variable.type})`,
          value: variable.name,
        }));

      if (!options.length) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No variables found in this mailing list',
        };
      }
      return { disabled: false, options };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: `Failed to load variables: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

const outputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'variableName', label: 'Variable Name' },
    { key: 'variableValue', label: 'Variable Value' },
    { key: 'variableType', label: 'Variable Type' },
  ],
};

export const changeVariableForSubscriberAction = createAction({
  auth: sendpulseAuth,
  name: 'change-variable-for-subscriber',
  classification: 'WRITE',
  displayName: 'Change Variable for Subscriber',
  description: 'Update subscriber variable',
  audience: 'human',
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
  outputSchema,
  async run(context) {
    const { mailingListId, variableName, variableValue } = context.propsValue;
    const listId = parseMailingListId(mailingListId);
    const email = normalizeEmail(context.propsValue.email);
    const auth = context.auth.props;

    const variables = await fetchVariables({ auth, listId });
    const variableType = variables.find((variable) => variable.name === variableName)?.type ?? null;
    if (variableType) {
      assertValueMatchesType({ variableName, variableValue, variableType });
    }

    const result = await sendpulseApiCall<unknown>({
      method: HttpMethod.POST,
      auth,
      resourceUri: `/addressbooks/${listId}/emails/variable`,
      operation: 'update subscriber variable',
      body: {
        email,
        variables: [{ name: variableName, value: variableValue }],
      },
    });

    if (!isRecord(result) || result['result'] !== true) {
      throw new Error(`SendPulse update variable failed: unexpected response ${JSON.stringify(result)}`);
    }
    return {
      success: true,
      message: `Variable "${variableName}" updated for ${email}`,
      email,
      variableName,
      variableValue,
      variableType,
    };
  },
});
