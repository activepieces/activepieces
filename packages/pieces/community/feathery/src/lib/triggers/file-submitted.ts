import {
  createTrigger,
  Property,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { featheryAuth } from '../common/auth';
import { featheryCommon } from '../common/client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof featheryAuth>,
  { lookup_type: string; document_id?: string; user_id?: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { lookup_type, document_id, user_id } = propsValue;

    let url: string;
    if (lookup_type === 'document') {
      if (!document_id) {
        throw new Error('Please enter a Document ID to monitor for file submissions.');
      }
      url = `/document/envelope/?type=document&id=${encodeURIComponent(document_id)}`;
    } else if (lookup_type === 'user') {
      if (!user_id) {
        throw new Error('Please select a User to monitor for file submissions.');
      }
      url = `/document/envelope/?type=user&id=${encodeURIComponent(user_id)}`;
    } else {
      throw new Error('Please select a lookup type (Document Template or User).');
    }

    try {
      const envelopes = await featheryCommon.apiCall<
        Array<{
          id: string;
          document: string;
          user: string;
          signer: string;
          sender: string;
          file: string;
          type: string;
          viewed: boolean;
          signed: boolean;
          tags: string[];
          created_at: string;
        }>
      >({
        method: HttpMethod.GET,
        url,
        apiKey: auth.secret_text,
      });

      // Handle case where API returns error object instead of array
      if (!Array.isArray(envelopes)) {
        return [];
      }

      return envelopes.map((envelope) => ({
        epochMilliSeconds: dayjs(envelope.created_at).valueOf(),
        data: envelope,
      }));
    } catch {
      // Return empty if no documents/users found
      return [];
    }
  },
};

export const fileSubmittedTrigger = createTrigger({
  auth: featheryAuth,
  name: 'file_submitted',
  displayName: 'File Submitted',
  description: 'Triggers when a file is submitted in your form, or when a document is signed/generated.',
  props: {
    lookup_type: Property.StaticDropdown({
      displayName: 'Lookup By',
      description: 'Choose how to find document envelopes.',
      required: true,
      options: {
        options: [
          { label: 'Document Template', value: 'document' },
          { label: 'User', value: 'user' },
        ],
      },
      defaultValue: 'document',
    }),
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document template to monitor.',
      required: false,
    }),
    user_id: Property.Dropdown({
      displayName: 'User',
      description: 'Select the user to monitor for file submissions.',
      required: false,
      refreshers: [],
      auth: featheryAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const users = await featheryCommon.apiCall<
          Array<{ id: string; created_at: string; updated_at: string }>
        >({
          method: HttpMethod.GET,
          url: '/user/',
          apiKey: auth.secret_text,
        });

        return {
          disabled: false,
          options: users.map((user) => ({
            label: user.id,
            value: user.id,
          })),
        };
      },
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'envelope-123',
    document: 'doc-456',
    user: 'user@example.com',
    signer: 'signer@example.com',
    sender: 'sender@example.com',
    file: 'https://link-to-filled-file.com',
    type: 'pdf',
    viewed: true,
    signed: true,
    tags: ['document-tag'],
    created_at: '2024-06-03T00:00:00Z',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});
