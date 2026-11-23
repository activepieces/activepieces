import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoItemResponse, TinkoSendMessageResult, tinkoClient } from '../common/client';
import { messageProps } from '../common/message';
import { tinkoOutput } from '../common/output';
import { tinkoProps } from '../common/props';

export const sendTemplateMessageAction = createAction({
  auth: tinkoAuth,
  name: 'send_template_message',
  classification: 'WRITE',
  displayName: 'Send Template Message',
  description: 'Sends an approved WhatsApp template through an official WhatsApp channel.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send an approved WhatsApp template message through an official WhatsApp (WhatsApp Business API) channel in Tinko. Use it to start a conversation or reply after the 24 hour customer service window closed, when plain text is rejected. Each call sends a new message, so retries duplicate it.',
    idempotent: false,
  },
  props: {
    channel: tinkoProps.channelDropdown({
      description: 'The official WhatsApp channel that sends the template.',
    }),
    recipient: messageProps.recipient(),
    template: tinkoProps.templateDropdown(),
    bodyVariables: Property.Array({
      displayName: 'Body Variables',
      description:
        'Values for the variables in the template body, in order. The first value fills {{1}}, the second fills {{2}}, and so on.',
      required: false,
    }),
    headerType: Property.StaticDropdown({
      displayName: 'Header Variable Type',
      description: 'Fill this in only when the template header has a variable or a media file.',
      required: false,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Document', value: 'document' },
        ],
      },
    }),
    headerValue: Property.ShortText({
      displayName: 'Header Variable Value',
      description:
        'For a text header, the value of the header variable. For a media header, the public URL of the file, for example https://example.com/banner.png.',
      required: false,
    }),
    components: Property.Json({
      displayName: 'Components (Advanced)',
      description:
        'Optional. A JSON array of template components that replaces the variable fields above, for templates with button variables. Example: [{"type":"body","parameters":[{"type":"text","text":"Jane"}]},{"type":"button","sub_type":"url","index":0,"parameters":[{"type":"text","text":"order-1234"}]}]',
      required: false,
    }),
    attendant: tinkoProps.attendantDropdown({
      description: 'The Tinko user registered as the sender of the message. Leave empty to send as the company.',
    }),
  },
  async run(context) {
    const {
      channel,
      recipient,
      template,
      bodyVariables,
      headerType,
      headerValue,
      components,
      attendant,
    } = context.propsValue;
    const response = await tinkoClient.request<TinkoItemResponse<TinkoSendMessageResult>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/messages',
      body: messageProps.body({
        channel,
        recipient,
        attendant,
        fields: {
          type: 'template',
          template,
          components: resolveComponents({
            components,
            bodyVariables: bodyVariables ?? [],
            headerType,
            headerValue,
          }),
        },
      }),
    });
    return tinkoOutput.sentMessage(response.data ?? {});
  },
});

function resolveComponents({
  components,
  bodyVariables,
  headerType,
  headerValue,
}: {
  components: unknown;
  bodyVariables: unknown[];
  headerType: string | undefined;
  headerValue: string | undefined;
}): unknown[] | undefined {
  const advanced = parseComponents(components);
  if (advanced !== undefined) {
    return advanced.length > 0 ? advanced : undefined;
  }
  const header =
    headerType && headerValue
      ? [
          {
            type: 'header',
            parameters: [
              headerType === 'text'
                ? { type: 'text', text: headerValue }
                : { type: headerType, path: headerValue.trim() },
            ],
          },
        ]
      : [];
  const body =
    bodyVariables.length > 0
      ? [
          {
            type: 'body',
            parameters: bodyVariables.map((value) => ({
              type: 'text',
              text: value === null || value === undefined ? '' : String(value),
            })),
          },
        ]
      : [];
  const result = [...header, ...body];
  return result.length > 0 ? result : undefined;
}

function parseComponents(value: unknown): unknown[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = typeof value === 'string' ? parseJson(value) : value;
  if (parsed === undefined) {
    return undefined;
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length === 0) {
    return undefined;
  }
  throw new Error(
    'Components (Advanced) must be a JSON array of template components, for example [{"type":"body","parameters":[{"type":"text","text":"Jane"}]}]'
  );
}

function parseJson(value: string): unknown {
  if (value.trim() === '') {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
