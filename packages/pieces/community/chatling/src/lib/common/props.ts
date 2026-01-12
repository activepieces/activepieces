import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './index';
import { chatlingAuth } from '../../index';

export const chatbotIdDropdown = Property.Dropdown({
  auth: chatlingAuth,
  displayName: 'Chatbot',
  description: 'Select a chatbot',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first.',
        options: [],
      };
    }

    const response = await makeRequest<{
      data: {
        chatbots: { id: string; name: string }[];
      };
    }>(auth.secret_text, HttpMethod.GET, '/chatbots');

    const options: DropdownOption<string>[] = response.data.chatbots.map(
      (chatbot) => ({
        label: chatbot.name,
        value: chatbot.id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const aiModelIdDropdown = Property.Dropdown({
  auth: chatlingAuth,
  displayName: 'AI Model',
  description: 'Select the AI model to use',
  required: true,
  refreshers: ['chatbotId'],
  options: async ({ auth, chatbotId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first.',
        options: [],
      };
    }

    if (!chatbotId) {
      return {
        disabled: true,
        placeholder: 'Please select a chatbot first.',
        options: [],
      };
    }

    const response = await makeRequest<{
      data: {
        models: { id: number; name: string }[];
      };
    }>(
      auth.secret_text,
      HttpMethod.GET,
      `/chatbots/${chatbotId}/ai/kb/models`
    );

    const options: DropdownOption<number>[] = response.data.models.map(
      (model) => ({
        label: model.name,
        value: model.id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const languageIdDropdown = Property.Dropdown({
  auth: chatlingAuth,
  displayName: 'Language',
  description: 'Select the language for the AI response',
  required: false,
  refreshers: ['chatbotId'],
  options: async ({ auth, chatbotId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first.',
        options: [],
      };
    }

    if (!chatbotId) {
      return {
        disabled: true,
        placeholder: 'Please select a chatbot first.',
        options: [],
      };
    }

    const response = await makeRequest<{
      data: {
        languages: { id: number; name: string }[];
      };
    }>(
      auth.secret_text,
      HttpMethod.GET,
      `/chatbots/${chatbotId}/ai/kb/languages`
    );

    const options: DropdownOption<number>[] = response.data.languages.map(
      (language) => ({
        label: language.name,
        value: language.id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const contactIdDropdown = Property.Dropdown({
  auth: chatlingAuth,
  displayName: 'Contact',
  description: 'Associate the conversation with a contact',
  required: false,
  refreshers: ['chatbotId'],
  options: async ({ auth, chatbotId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first.',
        options: [],
      };
    }

    if (!chatbotId) {
      return {
        disabled: true,
        placeholder: 'Please select a chatbot first.',
        options: [],
      };
    }

    const response = await makeRequest<{
      data: {
        contacts: { id: string; name: string; email: string }[];
      };
    }>(
      auth.secret_text,
      HttpMethod.GET,
      `/chatbots/${chatbotId}/contacts`
    );

    const options: DropdownOption<string>[] = response.data.contacts.map(
      (contact) => ({
        label: contact.name || contact.email || contact.id,
        value: contact.id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const templateIdDropdown = Property.Dropdown({
  auth: chatlingAuth,
  displayName: 'Template',
  description: 'Use a template to create the chatbot',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first.',
        options: [],
      };
    }

    const response = await makeRequest<{
      data: {
        templates: { id: number; name: string; description: string }[];
      };
    }>(auth.secret_text, HttpMethod.GET, '/chatbot-templates');

    const options: DropdownOption<number>[] = response.data.templates.map(
      (template) => ({
        label: template.name,
        value: template.id,
      })
    );

    return {
      disabled: false,
      options,
    };
  },
});

export const conversationIdDropdown = Property.Dropdown({
  auth: chatlingAuth,
  displayName: 'Conversation',
  description: 'Continue an existing conversation',
  required: false,
  refreshers: ['chatbotId'],
  options: async ({ auth, chatbotId }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first.',
        options: [],
      };
    }

    if (!chatbotId) {
      return {
        disabled: true,
        placeholder: 'Please select a chatbot first.',
        options: [],
      };
    }

    const response = await makeRequest<{
      data: {
        conversations: {
          id: string;
          created_at: string;
          messages: { text: string; role: string }[];
        }[];
      };
    }>(
      auth.secret_text,
      HttpMethod.GET,
      `/chatbots/${chatbotId}/conversations`
    );

    const options: DropdownOption<string>[] = response.data.conversations.map(
      (conv) => {
        const firstUserMsg = conv.messages?.find((m) => m.role === 'user');
        const preview = firstUserMsg?.text
          ? firstUserMsg.text.substring(0, 50) +
            (firstUserMsg.text.length > 50 ? '...' : '')
          : conv.created_at;
        return {
          label: preview,
          value: conv.id,
        };
      }
    );

    return {
      disabled: false,
      options,
    };
  },
});

