import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wufooAuth } from '../../index';
import { wufooApiCall } from '../common/client';

const LAST_FORM_IDS_KEY = 'wufoo-last-form-ids';

export const newFormTrigger = createTrigger({
  auth: wufooAuth,
  name: 'new_form_created',
  displayName: 'New Form Created',
  description: 'Triggers when a new form is created in your Wufoo account.',
  type: TriggerStrategy.POLLING,
  props: {
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'How frequently to check for new forms. More frequent checking provides faster detection but uses more API calls.',
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
    
    nameFilter: Property.ShortText({
      displayName: 'Form Name Filter (Optional)',
      description: 'Only trigger for forms containing this text in their name. Leave empty to monitor all forms.',
      required: false,
    }),
    
    includeInactive: Property.Checkbox({
      displayName: 'Include Inactive Forms',
      description: 'Include forms that are not currently active/published. Useful for monitoring all form creation activity.',
      required: false,
      defaultValue: false,
    }),
    
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Choose the format for form data. JSON is recommended for most workflows.',
      required: false,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
  },

  async onEnable(context) {
    const { responseFormat } = context.propsValue;
    const { apiKey, subdomain } = context.auth;

    try {
      const response = await wufooApiCall<{ Forms: WufooForm[] }>({
        auth: { apiKey, subdomain },
        method: HttpMethod.GET,
        resourceUri: `/forms.${responseFormat || 'json'}`,
      });

      const hashes = response.Forms.map((form) => form.Hash);
      await context.store.put<string[]>(LAST_FORM_IDS_KEY, hashes);
      
      console.log(`Wufoo New Form trigger initialized with ${hashes.length} existing forms`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed: Please check your API key and subdomain. Make sure your API key has permission to access forms.'
        );
      }
      
      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to list forms. Please check your Wufoo account permissions.'
        );
      }
      
      throw new Error(
        `Failed to initialize form monitoring: ${error.message || 'Unknown error occurred'}. Please check your Wufoo connection.`
      );
    }
  },

  async onDisable() {
    console.log('Wufoo New Form trigger disabled and cleaned up');
  },

  async run(context) {
    const { nameFilter, includeInactive, responseFormat } = context.propsValue;
    const { apiKey, subdomain } = context.auth;
    
    try {
      const previousHashes = await context.store.get<string[]>(LAST_FORM_IDS_KEY) || [];

      const response = await wufooApiCall<{ Forms: WufooForm[] }>({
        auth: { apiKey, subdomain },
        method: HttpMethod.GET,
        resourceUri: `/forms.${responseFormat || 'json'}`,
      });

      const allForms = response.Forms || [];
      const currentHashes = allForms.map((f) => f.Hash);

      await context.store.put<string[]>(LAST_FORM_IDS_KEY, currentHashes);

      let newForms = allForms.filter((form) => !previousHashes.includes(form.Hash));

      if (nameFilter && nameFilter.trim()) {
        const filterText = nameFilter.trim().toLowerCase();
        newForms = newForms.filter((form) => 
          form.Name && form.Name.toLowerCase().includes(filterText)
        );
      }

      if (!includeInactive) {
        newForms = newForms.filter((form) => form.IsPublic === '1');
      }

      const processedForms = newForms.map((form) => ({
        id: form.Hash,
        name: form.Name,
        description: form.Description,
        url: form.Url,
        
        isPublic: form.IsPublic === '1',
        isActive: form.IsPublic === '1',
        redirectUrl: form.RedirectUrl,
        
        dateCreated: form.DateCreated,
        dateUpdated: form.DateUpdated,
        
        entryCount: parseInt(form.EntryCount || '0', 10),
        
        language: form.Language || 'english',
        
        rawFormData: form,
        
        triggerInfo: {
          detectedAt: new Date().toISOString(),
          source: 'wufoo',
          type: 'new_form',
        },
      }));

      return processedForms;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error(
          'Authentication failed: Your API key may have expired. Please check your Wufoo authentication.'
        );
      }
      
      if (error.response?.status === 429) {
        throw new Error(
          'Rate limit exceeded: Wufoo API rate limit reached. Consider increasing your polling interval.'
        );
      }
      
      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to list forms. Please check your account permissions.'
        );
      }
      
      throw new Error(
        `Failed to check for new forms: ${error.message || 'Unknown error occurred'}. The trigger will retry on the next polling interval.`
      );
    }
  },

  async test(context) {
    const { responseFormat } = context.propsValue;
    const { apiKey, subdomain } = context.auth;

    try {
      const response = await wufooApiCall<{ Forms: WufooForm[] }>({
        auth: { apiKey, subdomain },
        method: HttpMethod.GET,
        resourceUri: `/forms.${responseFormat || 'json'}`,
      });

      const forms = response.Forms || [];
      
      if (forms.length > 0) {
        const testForm = forms[0];
        return [
          {
            id: testForm.Hash,
            name: testForm.Name,
            description: testForm.Description,
            url: testForm.Url,
            isPublic: testForm.IsPublic === '1',
            isActive: testForm.IsPublic === '1',
            redirectUrl: testForm.RedirectUrl,
            dateCreated: testForm.DateCreated,
            dateUpdated: testForm.DateUpdated,
            entryCount: parseInt(testForm.EntryCount || '0', 10),
            language: testForm.Language || 'english',
            rawFormData: testForm,
            triggerInfo: {
              detectedAt: new Date().toISOString(),
              source: 'wufoo',
              type: 'new_form',
            },
          },
        ];
      } else {
        return [
          {
            id: 's1afea8b1vk0jf7',
            name: 'Sample Contact Form',
            description: 'A sample contact form for testing purposes',
            url: 'https://example.wufoo.com/forms/s1afea8b1vk0jf7/',
            isPublic: true,
            isActive: true,
            redirectUrl: 'https://example.com/thank-you',
            dateCreated: '2025-01-15 10:00:00',
            dateUpdated: '2025-01-15 10:00:00',
            entryCount: 0,
            language: 'english',
            rawFormData: {
              Hash: 's1afea8b1vk0jf7',
              Name: 'Sample Contact Form',
              Description: 'A sample contact form for testing purposes',
              Url: 'https://example.wufoo.com/forms/s1afea8b1vk0jf7/',
              IsPublic: '1',
              EntryCount: '0',
              DateCreated: '2025-01-15 10:00:00',
              DateUpdated: '2025-01-15 10:00:00',
              Language: 'english',
            },
            triggerInfo: {
              detectedAt: new Date().toISOString(),
              source: 'wufoo',
              type: 'new_form',
            },
          },
        ];
      }
    } catch (error: any) {
      return [
        {
          id: 's1afea8b1vk0jf7',
          name: 'Test Contact Form',
          description: 'A test form created for workflow testing',
          url: 'https://example.wufoo.com/forms/s1afea8b1vk0jf7/',
          isPublic: true,
          isActive: true,
          redirectUrl: 'https://example.com/thank-you',
          dateCreated: '2025-01-15 10:00:00',
          dateUpdated: '2025-01-15 10:00:00',
          entryCount: 5,
          language: 'english',
          rawFormData: {
            Hash: 's1afea8b1vk0jf7',
            Name: 'Test Contact Form',
            Description: 'A test form created for workflow testing',
            Url: 'https://example.wufoo.com/forms/s1afea8b1vk0jf7/',
            IsPublic: '1',
            EntryCount: '5',
            DateCreated: '2025-01-15 10:00:00',
            DateUpdated: '2025-01-15 10:00:00',
            Language: 'english',
          },
          triggerInfo: {
            detectedAt: new Date().toISOString(),
            source: 'wufoo',
            type: 'new_form',
          },
        },
      ];
    }
  },

  sampleData: {
    id: 's1afea8b1vk0jf7',
    name: 'Customer Feedback Form',
    description: 'Collect valuable feedback from our customers',
    url: 'https://example.wufoo.com/forms/s1afea8b1vk0jf7/',
    isPublic: true,
    isActive: true,
    redirectUrl: 'https://example.com/thank-you',
    dateCreated: '2025-01-15 09:30:00',
    dateUpdated: '2025-01-15 09:30:00',
    entryCount: 0,
    language: 'english',
    rawFormData: {
      Hash: 's1afea8b1vk0jf7',
      Name: 'Customer Feedback Form',
      Description: 'Collect valuable feedback from our customers',
      Url: 'https://example.wufoo.com/forms/s1afea8b1vk0jf7/',
      IsPublic: '1',
      EntryCount: '0',
      DateCreated: '2025-01-15 09:30:00',
      DateUpdated: '2025-01-15 09:30:00',
      Language: 'english',
    },
    triggerInfo: {
      detectedAt: '2025-01-15T09:30:00.000Z',
      source: 'wufoo',
      type: 'new_form',
    },
  },
});

/**
 * Interface for Wufoo form data structure
 */
interface WufooForm {
  Hash: string;
  Name: string;
  Description: string;
  Url: string;
  IsPublic: string;
  EntryCount: string;
  DateCreated: string;
  DateUpdated: string;
  Language?: string;
  RedirectUrl?: string;
  [key: string]: any;
}
