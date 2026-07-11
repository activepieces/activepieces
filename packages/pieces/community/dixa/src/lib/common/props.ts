import {
  DropdownOption,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { dixaAuth } from '../auth';
import {
  dixaClient,
  DixaContactEndpoint,
  DixaConversation,
  DixaCustomAttribute,
  DixaEndUser,
  DixaListResponse,
  DixaSelectOption,
  DixaTag,
  fetchAllPages,
} from './client';
import { HttpMethod } from '@activepieces/pieces-common';

function flattenSelectOptions(
  options: DixaSelectOption[],
  parentVal = '',
  parentLabel = ''
): DropdownOption<string>[] {
  const result: DropdownOption<string>[] = [];

  for (const option of options) {
    const label = parentLabel ? `${parentLabel} - ${option.label}` : option.label;
    const value = parentVal ? `${parentVal}/${option.value}` : option.value;

    if (option.nestedOptions?.length) {
      result.push(...flattenSelectOptions(option.nestedOptions, value, label));
    } else {
      result.push({ label, value });
    }
  }

  return result;
}

export const endUserIdProp = (displayName = 'End User ID') =>
  Property.Dropdown({
    auth: dixaAuth,
    displayName,
    description: 'The ID of the end user.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          options: [],
          disabled: true,
          placeholder: 'Please connect your account first',
        };
      }

      const endUsers = await fetchAllPages<DixaEndUser>(
        auth.secret_text,
        '/endusers'
      );

      return {
        options: endUsers.map((user) => ({
          value: user.id,
          label: user.displayName ?? user.id,
        })),
      };
    },
  });

export const conversationIdProp = Property.Dropdown({
  auth: dixaAuth,
  displayName: 'Conversation ID',
  description: 'The ID of the conversation',
  required: true,
  refreshers: ['endUserId'],
  options: async ({ auth, endUserId }) => {
    if (!auth || !endUserId) {
      return {
        options: [],
        disabled: true,
        placeholder: 'Select an end user first',
      };
    }

    const response = await dixaClient.makeRequest<DixaListResponse<DixaConversation>>(
      auth.secret_text,
      HttpMethod.GET,
      `/endusers/${endUserId}/conversations`
    );

    return {
      options: response.data.map((conversation) => {
        const email =
          conversation.direction === 'Inbound'
            ? conversation.fromEmail
            : conversation.toEmail;

        return {
          value: String(conversation.id),
          label: `${conversation.direction ?? 'Conversation'} - ${email ?? conversation.id}`,
        };
      }),
    };
  },
});

export const agentIdProp = (options?: {
  displayName?: string;
  description?: string;
  required?: boolean;
  refreshers?: string[];
}) =>
  Property.Dropdown({
    auth: dixaAuth,
    displayName: options?.displayName ?? 'Agent ID',
    description:
      options?.description ?? 'The ID of the agent.',
    required: options?.required ?? true,
    refreshers: options?.refreshers ?? [],
    options: async ({ auth, direction }) => {
      if (!auth) {
        return {
          options: [],
          disabled: true,
          placeholder: 'Please connect your account first',
        };
      }

      if (direction && direction !== 'Outbound') {
        return {
          options: [],
          disabled: true,
          placeholder: 'Only required for outbound messages',
        };
      }

      const agents = await fetchAllPages<{ id: string; displayName?: string }>(
        auth.secret_text,
        '/agents'
      );

      return {
        options: agents.map((agent) => ({
          value: agent.id,
          label: agent.displayName ?? agent.id,
        })),
      };
    },
  });

export const tagIdProp = Property.Dropdown({
  auth: dixaAuth,
  displayName: 'Tag ID',
  description: 'The ID of the tag to add',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        options: [],
        disabled: true,
        placeholder: 'Please connect your account first',
      };
    }

    const response = await dixaClient.makeRequest<DixaListResponse<DixaTag>>(
      auth.secret_text,
      HttpMethod.GET,
      '/tags'
    );

    return {
      options: response.data
        .filter((tag) => tag.state === 'Active')
        .map((tag) => ({
          value: tag.id,
          label: tag.name,
        })),
    };
  },
});

export const emailIntegrationIdProp = Property.Dropdown({
  auth: dixaAuth,
  displayName: 'Email Integration ID',
  description: 'The contact endpoint in the organization.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        options: [],
        disabled: true,
        placeholder: 'Please connect your account first',
      };
    }

    const response = await dixaClient.makeRequest<
      DixaListResponse<DixaContactEndpoint>
    >(auth.secret_text, HttpMethod.GET, '/contact-endpoints');

    return {
      options: response.data
        .filter((endpoint) => endpoint._type === 'EmailEndpoint')
        .map((endpoint) => ({
          value: endpoint.address,
          label: endpoint.address,
        })),
    };
  },
});

export const directionProp = Property.StaticDropdown({
  displayName: 'Direction',
  description: 'The direction of the message',
  required: true,
  options: {
    disabled: false,
    options: [
      { label: 'Inbound', value: 'Inbound' },
      { label: 'Outbound', value: 'Outbound' },
    ],
  },
});

export const channelProp = Property.Dropdown({
  auth: dixaAuth,
  displayName: 'Channel',
  description:
    'For outbound, only Email is supported. Inbound also supports ContactForm.',
  required: true,
  refreshers: ['direction'],
  options: async ({ direction }) => {
    if (!direction) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select a direction first',
      };
    }

    const options =
      direction === 'Outbound'
        ? [{ label: 'Email', value: 'Email' }]
        : [
            { label: 'Contact Form', value: 'ContactForm' },
            { label: 'Email', value: 'Email' },
          ];

    return {
      disabled: false,
      options,
    };
  },
});

export async function buildContactCustomAttributeProps(
  apiKey: string
): Promise<DynamicPropsValue> {
  const response = await dixaClient.makeRequest<DixaListResponse<DixaCustomAttribute>>(
    apiKey,
    HttpMethod.GET,
    '/custom-attributes'
  );

  const dynamicProps: DynamicPropsValue = {};

  for (const attribute of response.data) {
    if (
      attribute.isDeactivated ||
      attribute.isArchived ||
      attribute.entityType !== 'Contact'
    ) {
      continue;
    }

    const inputType = attribute.inputDefinition._type;

    if (inputType === 'Select' && attribute.inputDefinition.options?.length) {
      dynamicProps[attribute.id] = Property.StaticDropdown({
        displayName: attribute.label,
        description: attribute.description,
        required: attribute.isRequired ?? false,
        options: {
          disabled: false,
          placeholder: attribute.inputDefinition.placeholder,
          options: flattenSelectOptions(attribute.inputDefinition.options),
        },
      });
    } else {
      dynamicProps[attribute.id] = Property.ShortText({
        displayName: attribute.label,
        description: attribute.description,
        required: attribute.isRequired ?? false,
      });
    }
  }

  return dynamicProps;
}

export function prepareCustomAttributePayload(
  attributes: DixaCustomAttribute[],
  values: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    const attribute = attributes.find((item) => item.id === key);
    if (!attribute) {
      continue;
    }

    payload[key] =
      attribute.inputDefinition._type !== 'Text'
        ? String(value).split('/')
        : value;
  }

  return payload;
}

export async function listContactCustomAttributes(
  apiKey: string
): Promise<DixaCustomAttribute[]> {
  const response = await dixaClient.makeRequest<DixaListResponse<DixaCustomAttribute>>(
    apiKey,
    HttpMethod.GET,
    '/custom-attributes'
  );

  return response.data.filter(
    (attribute) =>
      !attribute.isDeactivated &&
      !attribute.isArchived &&
      attribute.entityType === 'Contact'
  );
}
