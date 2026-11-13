import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId } from '../common/props';
import { createListOutputSchema } from '../output-schemas';

export const createListAction = createAction({
  auth: campaignMonitorAuth,
  name: 'create_list',
  classification: 'WRITE',
  displayName: 'Create List',
  description: 'Creates a new subscriber list for a client.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new subscriber list under a Campaign Monitor client and returns its list ID. Choose this to set up a fresh audience before adding subscribers. Not idempotent: every call creates another list, even with the same title.',
    idempotent: false,
  },
  outputSchema: createListOutputSchema,
  props: {
    clientId: clientId,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    unsubscribeSetting: Property.StaticDropdown({
      displayName: 'Unsubscribe Setting',
      description:
        'Whether an unsubscribe here also applies to all client lists.',
      required: true,
      defaultValue: 'AllClientLists',
      options: {
        options: [
          { label: 'All client lists', value: 'AllClientLists' },
          { label: 'Only this list', value: 'OnlyThisList' },
        ],
      },
    }),
    confirmedOptIn: Property.Checkbox({
      displayName: 'Confirmed Opt-In',
      description:
        'Require new subscribers to confirm by email (double opt-in).',
      required: false,
      defaultValue: false,
    }),
    unsubscribePage: Property.ShortText({
      displayName: 'Unsubscribe Page URL',
      description:
        'Page shown after unsubscribing. Leave empty for the default page.',
      required: false,
    }),
    confirmationSuccessPage: Property.ShortText({
      displayName: 'Confirmation Success Page URL',
      description:
        'Page shown after a subscriber confirms (Confirmed Opt-In only).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/lists/${propsValue.clientId}.json`,
      body: {
        Title: propsValue.title,
        UnsubscribePage: propsValue.unsubscribePage ?? '',
        UnsubscribeSetting: propsValue.unsubscribeSetting,
        ConfirmedOptIn: propsValue.confirmedOptIn ?? false,
        ConfirmationSuccessPage: propsValue.confirmationSuccessPage ?? '',
      },
    });
    return {
      listId: String(response.body),
      title: propsValue.title,
    };
  },
});
