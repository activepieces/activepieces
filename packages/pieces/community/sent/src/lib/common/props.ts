import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi, SentApiError } from './api';
import { Account, ProfileList, TemplateList } from './types';
import { sentValues } from './values';

function pageNumber({
  value,
  label,
  maximum,
}: {
  value: number;
  label: string;
  maximum?: number;
}): number {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    (maximum !== undefined && value > maximum)
  ) {
    throw new Error(
      `${label} must be a whole number between 1 and ${
        maximum ?? '2147483647'
      }.`
    );
  }
  return value;
}

const profile = Property.Dropdown({
  auth: sentAuth,
  displayName: 'Sender Profile',
  description:
    'For organization API keys, select a profile or enter its ID using a dynamic value. Leave empty to use the connected account. Standalone and profile API keys should leave this empty.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth)
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Sent account first',
      };
    try {
      const account = sentApi.data(
        await sentApi.request<Account>({
          apiKey: auth.secret_text,
          path: '/me',
        })
      );
      if (account.type !== 'organization')
        return {
          options: [],
          placeholder: 'Your connected account is used automatically',
        };
      const options: { label: string; value: string }[] = [];
      for (let page = 1; page <= 100; page++) {
        const result = sentApi.data(
          await sentApi.request<ProfileList>({
            apiKey: auth.secret_text,
            path: '/sender-profiles',
            query: { page, page_size: 100 },
          })
        );
        options.push(
          ...result.sender_profiles.map((item) => ({
            label: item.name,
            value: item.id,
          }))
        );
        if (!result.pagination?.has_more) return { options };
      }
      return {
        options,
        placeholder:
          'First 10,000 profiles loaded; enter an ID for another profile',
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder:
          error instanceof SentApiError
            ? error.message
            : 'Could not load Sender Profiles. Enter a profile ID or check the connection.',
      };
    }
  },
});

const content = Property.DynamicProperties({
  auth: sentAuth,
  displayName: 'Message',
  required: true,
  refreshers: ['message_type', 'profile_id'],
  props: async ({
    auth,
    message_type,
    profile_id,
  }): Promise<DynamicPropsValue> => {
    if (message_type !== 'template') {
      return {
        text: Property.LongText({
          displayName: 'Text',
          description:
            'The plain-text message to send. Channel-specific conversation rules still apply.',
          required: true,
        }),
      };
    }
    const choices: { label: string; value: string }[] = [];
    let loadError: string | undefined;
    if (auth) {
      try {
        for (let page = 1; page <= 100; page++) {
          const result = sentApi.data(
            await sentApi.request<TemplateList>({
              apiKey: auth.secret_text,
              path: '/templates',
              profileId: sentValues.optionalString(profile_id),
              query: { page, page_size: 100, status: 'APPROVED' },
            })
          );
          choices.push(
            ...result.templates.map((item) => ({
              label: `${item.name} (${item.language})`,
              value: item.id,
            }))
          );
          if (!result.pagination?.has_more) break;
          if (page === 100)
            loadError =
              'First 10,000 templates loaded. Use a template ID for any remaining template.';
        }
      } catch (error) {
        loadError =
          error instanceof SentApiError
            ? error.message
            : 'Could not load templates. Check the connection and profile.';
      }
    }
    return {
      template_id: Property.StaticDropdown({
        displayName: 'Template',
        description:
          'Choose an approved template or enter its template ID using a dynamic value. Options refresh when the message type or Sender Profile changes.',
        required: true,
        options: {
          options: choices,
          placeholder:
            loadError ??
            (auth ? 'Select a template' : 'Connect your Sent account first'),
        },
      }),
      parameters: Property.Object({
        displayName: 'Template Parameters',
        description:
          'Use the variable names from your Sent template as keys and text values for personalization, for example name → Alex and order_id → 12345. Leave empty for templates without variables.',
        required: false,
      }),
    };
  },
});

export const sentProps = {
  profile,
  content,
  pageNumber,
  messageId: Property.ShortText({
    displayName: 'Message ID',
    description:
      'Map message_id from Send Message → data → recipients, or from a Sent webhook payload.',
    required: true,
  }),
  contactId: Property.ShortText({
    displayName: 'Contact ID',
    description: 'Map a contact id from List Contacts → data → contacts.',
    required: true,
  }),
};
