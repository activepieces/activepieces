import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { aidbaseClient } from './client';

export const emailInboxDropdown = Property.Dropdown({
  displayName: 'Email Inbox',
  description:
    'Select the email inbox to watch. Leave blank to trigger for all inboxes.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Aidbase account first.',
        options: [],
      };
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: { items: { id: string; title: string }[] };
    }>({
      method: HttpMethod.GET,
      url: 'https://api.aidbase.ai/v1/email-inboxes',
      headers: {
        Authorization: `Bearer ${auth as string}`,
      },
    });

    if (response.body.success) {
      return {
        disabled: false,
        options: response.body.data.items.map((inbox) => ({
          label: inbox.title,
          value: inbox.id,
        })),
      };
    }

    return {
      disabled: true,
      placeholder: 'Could not load inboxes.',
      options: [],
    };
  },
});

export const ticketFormDropdown = Property.Dropdown({
  displayName: 'Ticket Form',
  description:
    'Select the ticket form to watch. Leave blank to trigger for all forms.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Aidbase account first.',
        options: [],
      };
    }

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: { items: { public_id: string; title: string }[] };
    }>({
      method: HttpMethod.GET,
      url: 'https://api.aidbase.ai/v1/ticket-forms',
      headers: {
        Authorization: `Bearer ${auth as string}`,
      },
    });

    if (response.body.success) {
      return {
        disabled: false,
        options: response.body.data.items.map((form) => ({
          label: form.title,
          value: form.public_id,
        })),
      };
    }

    return {
      disabled: true,
      placeholder: 'Could not load ticket forms.',
      options: [],
    };
  },
});

export const faqDropdown = Property.Dropdown({
  displayName: 'FAQ',
  description: 'Select the FAQ to which the item will be added.',
  required: true,
  refreshers: [], 
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Aidbase account first.',
        options: [],
      };
    }

    const response = await aidbaseClient.listKnowledgeItems(auth as string);

    const faqItems = response.items.filter((item) => item.type === 'faq');

    return {
      disabled: false,
      options: faqItems.map((item) => ({
        label: item.title || item.id, 
        value: item.id,
      })),
    };
  },
});

export const chatbotDropdown = Property.Dropdown({
  displayName: 'Chatbot',
  description: 'Select the chatbot that will generate the reply.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Aidbase account first.',
        options: [],
      };
    }

    const response = await aidbaseClient.listChatbots(auth as string);

    return {
      disabled: false,
      options: response.items.map((chatbot) => ({
        label: chatbot.title,
        value: chatbot.id,
      })),
    };
  },
});

export const knowledgeItemDropdown = Property.Dropdown({
  displayName: 'Knowledge Item',
  description: 'Select the knowledge item to train.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Aidbase account first.',
        options: [],
      };
    }

    const response = await aidbaseClient.listKnowledgeItems(auth as string);

    const getLabel = (item: {
      type: string;
      title?: string;
      base_url?: string;
      id: string;
    }) => {
      switch (item.type) {
        case 'faq':
          return `[FAQ] ${item.title || item.id}`;
        case 'website':
          return `[Website] ${item.base_url || item.id}`;
        case 'video':
          return `[Video] ${item.title || item.id}`;
        case 'document':
          return `[Document] ${item.title || item.id}`;
        default:
          return `[${item.type}] ${item.id}`;
      }
    };

    return {
      disabled: false,
      options: response.items.map((item) => ({
        label: getLabel(item),
        value: item.id,
      })),
    };
  },
});