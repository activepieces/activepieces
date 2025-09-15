import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface FormItem {
  id: string;
  name?: string;
  email?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export const newCapturedForm = createTrigger({
  name: 'new_captured_form',
  displayName: 'New Captured Form',
  description: 'Fires when a new form submission is captured in Insighto.ai',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to start checking from',
      required: false,
      defaultValue: 1,
    }),
    size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of forms to check per page (max 100)',
      required: false,
      defaultValue: 50,
    }),
  },
  sampleData: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    phone_number: '+1234567890',
    created_at: '2023-11-07T05:31:56Z',
    updated_at: '2023-11-07T05:31:56Z'
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    // Initialize with empty seen forms
    await context.store.put('seen_forms', []);
  },
  async onDisable(context) {
    await context.store.delete('seen_forms');
  },
  async run(context) {
    const apiKey = context.auth as string;
    const page = context.propsValue['page'] || 1;
    const size = context.propsValue['size'] || 50;

    const url = `https://api.insighto.ai/api/v1/form/list`;

    const queryParams: Record<string, string> = {
      api_key: apiKey,
      page: page.toString(),
      size: size.toString(),
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      queryParams,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.body.data;
    if (!data || !data.items) {
      return [];
    }

    // Get previously seen form IDs
    const seenForms = (await context.store.get<string[]>('seen_forms')) || [];

    // Find new forms that haven't been seen before
    const newForms: FormItem[] = [];
    const currentFormIds: string[] = [];

    for (const form of data.items) {
      const formId = form.id;
      currentFormIds.push(formId);

      if (!seenForms.includes(formId)) {
        newForms.push(form);
      }
    }

    // Update the store with all current form IDs (to avoid processing old forms again)
    await context.store.put('seen_forms', currentFormIds);

    return newForms;
  },
});
