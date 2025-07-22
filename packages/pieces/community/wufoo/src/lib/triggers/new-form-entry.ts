import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { wufooAuth } from '../../index';
import { wufooApiCall } from '../common/client';
import { formIdentifier } from '../common/props';

const TRIGGER_KEY = 'wufoo-webhook-hash';

export const newFormEntryTrigger = createTrigger({
  auth: wufooAuth,
  name: 'new_form_entry',
  displayName: 'New Form Entry',
  description: 'Triggers when someone submits a new entry to your Wufoo form.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    formIdentifier: formIdentifier,
    
    handshakeKey: Property.ShortText({
      displayName: 'Handshake Key (Optional)',
      description: 'A secret key to validate webhook authenticity and prevent unauthorized requests. Recommended for production workflows.',
      required: false,
    }),
    
    includeMetadata: Property.Checkbox({
      displayName: 'Include Form Structure Metadata',
      description: 'Include detailed form and field structure information with each submission. Useful for dynamic processing but increases payload size.',
      required: false,
      defaultValue: false,
    }),
    
    responseFormat: Property.StaticDropdown({
      displayName: 'Webhook Response Format',
      description: 'Choose the format for webhook data. JSON is recommended for most automation workflows.',
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
    const { formIdentifier, handshakeKey, includeMetadata, responseFormat } = context.propsValue;
    const { apiKey, subdomain } = context.auth;

    try {
      await wufooApiCall({
        method: HttpMethod.GET,
        auth: { apiKey, subdomain },
        resourceUri: `/forms/${formIdentifier}.json`,
      });

      const webhookBody: Record<string, string> = {
        url: context.webhookUrl,
        metadata: includeMetadata ? 'true' : 'false',
      };

      if (handshakeKey && handshakeKey.trim()) {
        webhookBody['handshakeKey'] = handshakeKey.trim();
      }

      const response = await wufooApiCall<{
        WebHookPutResult: { Hash: string };
      }>({
        method: HttpMethod.PUT,
        auth: { apiKey, subdomain },
        resourceUri: `/forms/${formIdentifier}/webhooks.${responseFormat || 'json'}`,
        body: webhookBody,
      });

      await context.store.put<string>(TRIGGER_KEY, response.WebHookPutResult.Hash);

      console.log(`Wufoo webhook successfully configured for form ${formIdentifier} with hash: ${response.WebHookPutResult.Hash}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          `Form not found: The form with identifier "${formIdentifier}" does not exist or you do not have access to it. Please verify the form identifier and your permissions.`
        );
      }
      
      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to set up webhooks for this form. Please check your Wufoo account permissions and ensure you have webhook access.'
        );
      }
      
      if (error.response?.status === 400) {
        throw new Error(
          `Invalid webhook configuration: ${error.response?.data?.Text || error.message}. Please check your webhook URL and form identifier.`
        );
      }
      
      throw new Error(
        `Failed to set up webhook: ${error.message || 'Unknown error occurred'}. Please check your form identifier and try again.`
      );
    }
  },

  async onDisable(context) {
    const webhookHash = await context.store.get<string>(TRIGGER_KEY);
    const { formIdentifier, responseFormat } = context.propsValue;
    const { apiKey, subdomain } = context.auth;

    if (!isNil(webhookHash)) {
      try {
        await wufooApiCall({
          method: HttpMethod.DELETE,
          auth: { apiKey, subdomain },
          resourceUri: `/forms/${formIdentifier}/webhooks/${webhookHash}.${responseFormat || 'json'}`,
        });
        
        console.log(`Wufoo webhook successfully removed for form ${formIdentifier} with hash: ${webhookHash}`);
      } catch (error: any) {
        console.warn(`Warning: Failed to clean up webhook ${webhookHash} for form ${formIdentifier}:`, error.message);
        
        await context.store.delete(TRIGGER_KEY);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as Record<string, any>;
    
    if (payload && typeof payload === 'object') {
      const processedPayload = {
        entryId: payload['EntryId'],
        dateCreated: payload['DateCreated'],
        createdBy: payload['CreatedBy'] || 'public',
        
        formData: Object.keys(payload)
          .filter(key => !['EntryId', 'DateCreated', 'CreatedBy', 'DateUpdated', 'UpdatedBy'].includes(key))
          .reduce((acc, key) => {
            acc[key] = payload[key];
            return acc;
          }, {} as Record<string, any>),
        
        commonFields: {
          ...(payload['Field1'] && { firstName: payload['Field1'] }),
          ...(payload['Field2'] && { lastName: payload['Field2'] }),
          ...(payload['Field218'] && { email: payload['Field218'] }),
          ...(payload['Field220'] && { phone: payload['Field220'] }),
        },
        
        rawPayload: payload,
        
        webhookInfo: {
          receivedAt: new Date().toISOString(),
          source: 'wufoo',
          type: 'form_entry',
        },
      };
      
      return [processedPayload];
    }
    
    return [payload];
  },

  async test(context) {
    return [
      {
        entryId: '123',
        dateCreated: '2025-01-15 14:30:22',
        createdBy: 'public',
        formData: {
          Field105: 'Sample form submission for testing',
          Field106: '456',
          Field107: 'This is a test paragraph field entry with multiple lines of content.',
          Field1: 'John',
          Field2: 'Doe',
          Field218: 'john.doe@example.com',
          Field220: '555-123-4567',
          Field217: '2025-01-15',
        },
        commonFields: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '555-123-4567',
        },
        rawPayload: {
          EntryId: '123',
          Field105: 'Sample form submission for testing',
          Field106: '456',
          Field107: 'This is a test paragraph field entry with multiple lines of content.',
          Field1: 'John',
          Field2: 'Doe',
          Field218: 'john.doe@example.com',
          Field220: '555-123-4567',
          Field217: '2025-01-15',
          DateCreated: '2025-01-15 14:30:22',
          CreatedBy: 'public',
        },
        webhookInfo: {
          receivedAt: '2025-01-15T14:30:22.000Z',
          source: 'wufoo',
          type: 'form_entry',
        },
      },
    ];
  },

  sampleData: {
    entryId: '124',
    dateCreated: '2025-01-15 15:45:10',
    createdBy: 'public',
    formData: {
      Field105: 'Another sample entry',
      Field106: '789',
      Field1: 'Jane',
      Field2: 'Smith',
      Field218: 'jane.smith@example.com',
      Field220: '555-987-6543',
    },
    commonFields: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '555-987-6543',
    },
    rawPayload: {
      EntryId: '124',
      Field105: 'Another sample entry',
      Field106: '789',
      Field1: 'Jane',
      Field2: 'Smith',
      Field218: 'jane.smith@example.com',
      Field220: '555-987-6543',
      DateCreated: '2025-01-15 15:45:10',
      CreatedBy: 'public',
    },
    webhookInfo: {
      receivedAt: '2025-01-15T15:45:10.000Z',
      source: 'wufoo',
      type: 'form_entry',
    },
  },
});
