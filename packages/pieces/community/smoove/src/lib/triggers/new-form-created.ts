import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smooveApiCall } from '../common/client';
import { smooveAuth } from '../common/auth';

const LAST_FORM_IDS_KEY = 'smoove-last-form-ids';

export const newFormCreated = createTrigger({
  auth: smooveAuth,
  name: 'new_form_created',
  displayName: 'New Form Created',
  description: 'Triggers when a new form (landing page) is created in your Smoove account.',
  type: TriggerStrategy.POLLING,

  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How often to check for new forms.',
      required: false,
      defaultValue: '5',
      options: {
        disabled: false,
        options: [
          { label: 'Every 1 minute', value: '1' },
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
    }),
  },

  async onEnable(context) {
    const forms = await smooveApiCall<any[]>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/LandingPages',
    });

    const formIds = forms.map((form) => form.id);
    await context.store.put<string[]>(LAST_FORM_IDS_KEY, formIds);

    console.log(`Smoove New Form Trigger initialized with ${formIds.length} forms`);
  },

  async onDisable() {
    console.log('Smoove New Form Trigger disabled');
  },

  async run(context) {
    const previousIds = (await context.store.get<string[]>(LAST_FORM_IDS_KEY)) || [];

    const forms = await smooveApiCall<any[]>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/LandingPages',
    });

    const currentIds = forms.map((form) => form.id);
    await context.store.put<string[]>(LAST_FORM_IDS_KEY, currentIds);

    const newForms = forms.filter((form) => !previousIds.includes(form.id));

    return newForms.map((form) => ({
      id: String(form.id),
      name: form.name || form.title || 'Untitled Form',
      type: form.type || 'LandingPage',
      createdAt: form.createdAt || new Date().toISOString(),
      rawFormData: form,
      triggerInfo: {
        detectedAt: new Date().toISOString(),
        source: 'smoove',
        type: 'new_form_created',
      },
    }));
  },

  async test(context) {
    const forms = await smooveApiCall<any[]>({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: '/LandingPages',
    });

    const form = forms?.[0];
    if (!form) throw new Error('No forms found to test with');

    return [
      {
        id: String(form.id),
        name: form.name || form.title || 'Untitled Form',
        type: form.type || 'LandingPage',
        createdAt: form.createdAt || new Date().toISOString(),
        rawFormData: form,
        triggerInfo: {
          detectedAt: new Date().toISOString(),
          source: 'smoove',
          type: 'new_form_created',
        },
      },
    ];
  },

  sampleData: {
    id: '581014',
    name: 'Landing page - 581014',
    type: 'LandingPage',
    createdAt: '2025-07-19T08:22:43.123Z',
    triggerInfo: {
      detectedAt: new Date().toISOString(),
      source: 'smoove',
      type: 'new_form_created',
    },
  },
});
