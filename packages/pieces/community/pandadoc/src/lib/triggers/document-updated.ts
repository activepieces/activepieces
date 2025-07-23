import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { pandadocAuth, pandadocClient } from '../common';

export const documentUpdated = createTrigger({
  name: 'documentUpdated',
  displayName: 'Document Updated',
  description: 'Triggers when a document is updated.',
  auth: pandadocAuth,
  props: {
    template_filter: Property.MultiSelectDropdown({
      displayName: 'Filter by Templates',
      description: 'Only trigger for documents created from specific templates (leave empty for all)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await pandadocClient.makeRequest<{
            results: Array<{
              id: string;
              name: string;
              date_created: string;
            }>;
          }>(auth as string, HttpMethod.GET, '/templates?count=100');

          const options = response.results.map((template) => ({
            label: `${template.name} - ${template.id.substring(0, 8)}...`,
            value: template.id,
          }));

          return {
            disabled: false,
            options,
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load templates',
            options: [],
          };
        }
      },
    }),
    folder_filter: Property.MultiSelectDropdown({
      displayName: 'Filter by Folders',
      description: 'Only trigger for documents in specific folders (leave empty for all)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        try {
          const response = await pandadocClient.makeRequest<{
            results: Array<{
              uuid: string;
              name: string;
              date_created: string;
            }>;
          }>(auth as string, HttpMethod.GET, '/documents/folders?count=100');

          const options = response.results.map((folder) => ({
            label: `${folder.name} - ${folder.uuid.substring(0, 8)}...`,
            value: folder.uuid,
          }));

          return {
            disabled: false,
            options,
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load folders',
            options: [],
          };
        }
      },
    }),
    update_type_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Filter by Update Type',
      description: 'Only trigger for specific types of updates (leave empty for all)',
      required: false,
      options: {
        options: [
          { label: 'Content Changes', value: 'content' },
          { label: 'Recipient Changes', value: 'recipients' },
          { label: 'Settings Changes', value: 'settings' },
          { label: 'Status Changes', value: 'status' },
          { label: 'Field Changes', value: 'fields' },
          { label: 'Name Changes', value: 'name' },
          { label: 'Metadata Changes', value: 'metadata' },
        ],
      },
    }),
  },
  sampleData: {
    event_type: 'document_updated',
    data: {
      id: 'sample_document_id',
      name: 'Sample Contract',
      status: 'document.draft',
      date_modified: '2024-01-15T10:30:00Z',
      content_date_modified: '2024-01-15T10:30:00Z',
      updated_fields: ['name', 'recipients'],
      template: {
        id: 'template_id',
        name: 'Contract Template'
      },
      folder_uuid: 'folder_uuid',
      recipients: [
        {
          id: 'recipient_id',
          email: 'client@example.com',
          has_completed: false,
          role: 'Client'
        }
      ]
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookSubscription = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pandadoc.com/public/v1/webhook-subscriptions',
      headers: {
        Authorization: `API-Key ${(context.auth as string)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Activepieces Document Updated`,
        url: context.webhookUrl,
        active: true,
        triggers: ['document_updated'],
        payload: ['fields', 'products', 'tokens', 'metadata', 'pricing'],
      }),
    });

    await context.store?.put('webhook_id', webhookSubscription.body.uuid);
  },
  async onDisable(context) {
    const webhookId = await context.store?.get('webhook_id');
    if (webhookId) {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `https://api.pandadoc.com/public/v1/webhook-subscriptions/${webhookId}`,
          headers: {
            Authorization: `API-Key ${(context.auth as string)}`,
          },
        });
      } catch (error) {
        console.log('Error cleaning up webhook:', error);
      }
    }
  },
  async run(context) {
    const payload = context.payload.body as any;

    if (payload.event_type === 'document_updated') {
      const documentData = payload.data;

      if (context.propsValue.template_filter && context.propsValue.template_filter.length > 0) {
        const templateId = documentData?.template?.id;
        if (!templateId || !context.propsValue.template_filter.includes(templateId)) {
          return [];
        }
      }

      if (context.propsValue.folder_filter && context.propsValue.folder_filter.length > 0) {
        const folderUuid = documentData?.folder_uuid;
        if (!folderUuid || !context.propsValue.folder_filter.includes(folderUuid)) {
          return [];
        }
      }

      if (context.propsValue.update_type_filter && context.propsValue.update_type_filter.length > 0) {
        const updatedFields = documentData?.updated_fields || [];
        const hasMatchingUpdate = context.propsValue.update_type_filter.some((filterType: string) => {
          switch (filterType) {
            case 'content':
              return updatedFields.includes('content') || documentData?.content_date_modified;
            case 'recipients':
              return updatedFields.includes('recipients');
            case 'settings':
              return updatedFields.includes('settings');
            case 'status':
              return updatedFields.includes('status');
            case 'fields':
              return updatedFields.includes('fields');
            case 'name':
              return updatedFields.includes('name');
            case 'metadata':
              return updatedFields.includes('metadata');
            default:
              return false;
          }
        });

        if (!hasMatchingUpdate) {
          return [];
        }
      }

      return [documentData];
    }

    return [];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.NONE,
  },
});
