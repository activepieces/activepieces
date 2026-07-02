import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callPlivoApi } from '../common';
import { plivoAuth } from '../..';

export const plivoSendWhatsapp = createAction({
  auth: plivoAuth,
  name: 'send_whatsapp',
  description: 'Send a WhatsApp template message.',
  audience: 'both',
  aiMetadata: { description: 'Sends a WhatsApp message from a Plivo-registered WhatsApp number using an approved template. Use to reach a recipient on WhatsApp with a pre-approved template, optionally filling its dynamic variables. Requires the source and destination numbers in E.164 format and the template name and language; sending is billable and delivers a message on every call, so it is not idempotent.', idempotent: false },
  displayName: 'Send WhatsApp Message',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'The Plivo-registered WhatsApp number to send from, in E.164 format (e.g., +15558675310).',
      required: true,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'The WhatsApp number to send the message to, in E.164 format (e.g., +15558675310).',
      required: true,
    }),
    template_name: Property.ShortText({
      displayName: 'Template Name',
      description: 'The name of the approved WhatsApp template to send.',
      required: true,
    }),
    template_language: Property.ShortText({
      displayName: 'Template Language',
      description: 'The language code of the template (e.g., en_US).',
      required: true,
    }),
    template_components: Property.Json({
      displayName: 'Template Components',
      description: 'The template components array that fills the template variables. Leave empty for templates without dynamic variables.',
      required: false,
    }),
  },
  async run(context) {
    const { from, to, template_name, template_language, template_components } =
      context.propsValue;
    const auth_id = context.auth.username;
    const auth_token = context.auth.password;

    const template: {
      name: string;
      language: string;
      components?: unknown[];
    } = {
      name: template_name,
      language: template_language,
    };
    if (template_components !== undefined && template_components !== null) {
      if (!Array.isArray(template_components)) {
        throw new Error('Template Components must be a JSON array.');
      }
      template.components = template_components;
    }

    const response = await callPlivoApi(
      HttpMethod.POST,
      'Message/',
      { auth_id, auth_token },
      {
        src: from,
        dst: to,
        type: 'whatsapp',
        template,
      }
    );
    return response.body;
  },
});
