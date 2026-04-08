import { createAction, Property } from '@activepieces/pieces-framework';
import { customgptAuth } from '../common/auth';
import { projectId } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateSettings = createAction({
  auth: customgptAuth,
  name: 'update_settings',
  displayName: 'Update Agent Settings',
  description: 'Update agent configuration and behavior settings',
  props: {
    project_id: projectId,
    default_prompt: Property.ShortText({
      displayName: 'Default Prompt',
      description:
        'Default prompt text shown to users (e.g., "Ask Me Anything ...")',
      required: false,
    }),

    response_source: Property.StaticDropdown({
      displayName: 'Response Source',
      description: 'Source for generating responses',
      required: false,
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Own Content', value: 'own_content' },
          { label: 'OpenAI Content', value: 'openai_content' },
        ],
      },
    }),
    chat_bot_avatar: Property.File({
      displayName: 'Chatbot Avatar',
      description: 'Upload avatar image for the chatbot',
      required: false,
    }),
    chat_bot_bg: Property.File({
      displayName: 'Chatbot Background',
      description: 'Upload background image for the chatbot',
      required: false,
    }),
    chatbot_msg_lang: Property.ShortText({
      displayName: 'Chatbot Message Language',
      description:
        'Language code for chatbot messages (e.g., "en", "es", "ur")',
      required: false,
    }),
    chatbot_color: Property.ShortText({
      displayName: 'Chatbot Color',
      description:
        'Primary color for chatbot UI (hex color code, e.g., "#0e57cc")',
      required: false,
    }),
    chatbot_toolbar_color: Property.ShortText({
      displayName: 'Chatbot Toolbar Color',
      description: 'Toolbar color for chatbot UI (hex color code)',
      required: false,
    }),
    persona_instructions: Property.LongText({
      displayName: 'Persona Instructions',
      description: 'Custom persona/behavior instructions for the chatbot',
      required: false,
    }),
    citations_answer_source_label_msg: Property.ShortText({
      displayName: 'Citations Answer Source Label',
      description: 'Label message for citation answer sources',
      required: false,
    }),
    citations_sources_label_msg: Property.ShortText({
      displayName: 'Citations Sources Label',
      description: 'Label message for citation sources',
      required: false,
    }),
    hang_in_there_msg: Property.ShortText({
      displayName: 'Hang In There Message',
      description: 'Message shown during long processing times',
      required: false,
    }),
    chatbot_siesta_msg: Property.ShortText({
      displayName: 'Chatbot Siesta Message',
      description: 'Message shown when chatbot is temporarily unavailable',
      required: false,
    }),
    is_loading_indicator_enabled: Property.Checkbox({
      displayName: 'Enable Loading Indicator',
      description: 'Show loading indicator during responses',
      required: false,
    }),
    enable_citations: Property.Checkbox({
      displayName: 'Enable Citations',
      description: 'Enable citation display in responses',
      required: false,
    }),
    enable_feedbacks: Property.Checkbox({
      displayName: 'Enable Feedbacks',
      description: 'Enable user feedback collection',
      required: false,
    }),
    citations_view_type: Property.StaticDropdown({
      displayName: 'Citations View Type',
      description: 'How citations should be displayed',
      required: false,
      options: {
        options: [
          { label: 'User Controlled', value: 'user' },
          { label: 'Always Show', value: 'show' },
          { label: 'Always Hide', value: 'hide' },
        ],
      },
    }),
    no_answer_message: Property.ShortText({
      displayName: 'No Answer Message',
      description: 'Message shown when no answer is found',
      required: false,
    }),
    ending_message: Property.ShortText({
      displayName: 'Ending Message',
      description: 'Message shown at the end of conversations',
      required: false,
    }),
    remove_branding: Property.Checkbox({
      displayName: 'Remove Branding',
      description: 'Remove CustomGPT branding from the chatbot',
      required: false,
    }),
    enable_recaptcha_for_public_chatbots: Property.Checkbox({
      displayName: 'Enable reCAPTCHA',
      description: 'Enable reCAPTCHA for public chatbots',
      required: false,
    }),
    chatbot_model: Property.StaticDropdown({
      displayName: 'Chatbot Model',
      description: 'Default AI model for the chatbot',
      required: false,
      options: {
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20240620' },
          { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
        ],
      },
    }),
    is_selling_enabled: Property.Checkbox({
      displayName: 'Enable Selling',
      description: 'Enable selling features',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { chat_bot_avatar, chat_bot_bg } = propsValue;
    const formData = new FormData();

    if (chat_bot_avatar) {
      const avatarBuffer = Buffer.from(chat_bot_avatar.base64, 'base64');
      const avatarBlob = new Blob([avatarBuffer], {
        type: 'application/octet-stream',
      });
      formData.append('file', avatarBlob, chat_bot_avatar.filename || 'avatar');
    }
    if (chat_bot_bg) {
      const bgBuffer = Buffer.from(chat_bot_bg.base64, 'base64');
      const bgBlob = new Blob([bgBuffer], {
        type: 'application/octet-stream',
      });
      formData.append('chat_bot_bg', bgBlob, chat_bot_bg.filename);
    }
    if (propsValue.default_prompt !== undefined) {
      formData.append('default_prompt', propsValue.default_prompt);
    }

    if (propsValue.response_source !== undefined) {
      formData.append('response_source', propsValue.response_source);
    }
    if (propsValue.chatbot_msg_lang !== undefined) {
      formData.append('chatbot_msg_lang', propsValue.chatbot_msg_lang);
    }
    if (propsValue.chatbot_color !== undefined) {
      formData.append('chatbot_color', propsValue.chatbot_color);
    }
    if (propsValue.chatbot_toolbar_color !== undefined) {
      formData.append(
        'chatbot_toolbar_color',
        propsValue.chatbot_toolbar_color
      );
    }
    if (propsValue.persona_instructions !== undefined) {
      formData.append('persona_instructions', propsValue.persona_instructions);
    }
    if (propsValue.citations_answer_source_label_msg !== undefined) {
      formData.append(
        'citations_answer_source_label_msg',
        propsValue.citations_answer_source_label_msg
      );
    }
    if (propsValue.citations_sources_label_msg !== undefined) {
      formData.append(
        'citations_sources_label_msg',
        propsValue.citations_sources_label_msg
      );
    }
    if (propsValue.hang_in_there_msg !== undefined) {
      formData.append('hang_in_there_msg', propsValue.hang_in_there_msg);
    }
    if (propsValue.chatbot_siesta_msg !== undefined) {
      formData.append('chatbot_siesta_msg', propsValue.chatbot_siesta_msg);
    }
    if (propsValue.is_loading_indicator_enabled !== undefined) {
      formData.append(
        'is_loading_indicator_enabled',
        String(propsValue.is_loading_indicator_enabled)
      );
    }
    if (propsValue.enable_citations !== undefined) {
      formData.append('enable_citations', String(propsValue.enable_citations));
    }
    if (propsValue.enable_feedbacks !== undefined) {
      formData.append('enable_feedbacks', String(propsValue.enable_feedbacks));
    }
    if (propsValue.citations_view_type !== undefined) {
      formData.append('citations_view_type', propsValue.citations_view_type);
    }
    if (propsValue.no_answer_message !== undefined) {
      formData.append('no_answer_message', propsValue.no_answer_message);
    }
    if (propsValue.ending_message !== undefined) {
      formData.append('ending_message', propsValue.ending_message);
    }
    if (propsValue.remove_branding !== undefined) {
      formData.append('remove_branding', String(propsValue.remove_branding));
    }
    if (propsValue.enable_recaptcha_for_public_chatbots !== undefined) {
      formData.append(
        'enable_recaptcha_for_public_chatbots',
        String(propsValue.enable_recaptcha_for_public_chatbots)
      );
    }
    if (propsValue.chatbot_model !== undefined) {
      formData.append('chatbot_model', propsValue.chatbot_model);
    }
    if (propsValue.is_selling_enabled !== undefined) {
      formData.append(
        'is_selling_enabled',
        String(propsValue.is_selling_enabled)
      );
    }

    return await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      `/projects/${propsValue.project_id}/settings`,
      formData
    );
  },
});
