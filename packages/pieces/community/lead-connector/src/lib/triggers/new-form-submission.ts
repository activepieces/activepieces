import { OAuth2PropertyValue, Property, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { leadConnectorAuth } from '../..';
import { getFormSubmissions, getForms } from '../common';

const polling: Polling<OAuth2PropertyValue, { form: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const currentValues =
      (await getFormSubmissions(auth, propsValue.form)) ?? [];

    return currentValues.map((submission) => {
      return {
        id: submission.id,
        data: submission,
      };
    });
  },
};

export const newFormSubmission = createTrigger({
  auth: leadConnectorAuth,
  name: 'new_form_submission',
  displayName: 'New Form Submission',
  description: 'Trigger when a form is submitted.',
  props: {
    form: Property.Dropdown({
      displayName: 'Form',
      description: 'The form you want to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
          };

        const forms = await getForms(auth as OAuth2PropertyValue);

        return {
          options: forms.map((form) => {
            return {
              label: form.name,
              value: form.id,
            };
          }),
        };
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},

  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
});
