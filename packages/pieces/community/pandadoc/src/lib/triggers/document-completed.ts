import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { pandadocAuth, pandadocClient } from '../common';

export const documentCompleted = createTrigger({
  name: 'documentCompleted',
  displayName: 'Document Completed',
  description:
    'Triggers when a document is completed.',
  auth: pandadocAuth,
  props: {
    template_filter: Property.MultiSelectDropdown({
      displayName: 'Filter by Templates',
      description:
        'Only trigger for documents created from specific templates (leave empty for all)',
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
      description:
        'Only trigger for documents in specific folders (leave empty for all)',
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
  },
  sampleData: {
    event_type: 'document_state_changed',
    data: {
      id: 'sample_document_id',
      name: 'Sample Contract',
      status: 'document.completed',
      date_completed: '2024-01-15T10:30:00Z',
      template: {
        id: 'template_id',
        name: 'Contract Template',
      },
      folder_uuid: 'folder_uuid',
      recipients: [
        {
          id: 'recipient_id',
          email: 'client@example.com',
          has_completed: true,
          signature_date: '2024-01-15T10:30:00Z',
        },
      ],
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhookSubscription = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pandadoc.com/public/v1/webhook-subscriptions',
      headers: {
        Authorization: `API-Key ${context.auth as string}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Activepieces Document Completed`,
        url: context.webhookUrl,
        active: true,
        triggers: ['document_state_changed', 'recipient_completed'],
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
            Authorization: `API-Key ${context.auth as string}`,
          },
        });
      } catch (error) {
        console.log('Error cleaning up webhook:', error);
      }
    }
  },
  async run(context) {
    const payload = context.payload.body as any;

    if (
      payload.event_type === 'document_state_changed' &&
      payload.data?.status === 'document.completed'
    ) {
      const documentData = payload.data;

      if (
        context.propsValue.template_filter &&
        context.propsValue.template_filter.length > 0
      ) {
        const templateId = documentData?.template?.id;
        if (
          !templateId ||
          !context.propsValue.template_filter.includes(templateId)
        ) {
          return [];
        }
      }

      if (
        context.propsValue.folder_filter &&
        context.propsValue.folder_filter.length > 0
      ) {
        const folderUuid = documentData?.folder_uuid;
        if (
          !folderUuid ||
          !context.propsValue.folder_filter.includes(folderUuid)
        ) {
          return [];
        }
      }

      return [documentData];
    }

    if (payload.event_type === 'recipient_completed') {
      const allCompleted = payload.data?.recipients?.every(
        (recipient: any) => recipient.has_completed
      );
      if (allCompleted) {
        const documentData = payload.data;

        if (
          context.propsValue.template_filter &&
          context.propsValue.template_filter.length > 0
        ) {
          const templateId = documentData?.template?.id;
          if (
            !templateId ||
            !context.propsValue.template_filter.includes(templateId)
          ) {
            return [];
          }
        }

        if (
          context.propsValue.folder_filter &&
          context.propsValue.folder_filter.length > 0
        ) {
          const folderUuid = documentData?.folder_uuid;
          if (
            !folderUuid ||
            !context.propsValue.folder_filter.includes(folderUuid)
          ) {
            return [];
          }
        }

        return [documentData];
      }
    }

    return [];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.NONE,
  },
});
