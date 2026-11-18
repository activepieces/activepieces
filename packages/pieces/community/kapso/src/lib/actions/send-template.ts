import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  phoneNumberIdDropdown,
  businessAccountIdProp,
  recipientPhoneProp,
  templateDropdown,
} from '../common/props';

export const sendTemplate = createAction({
  auth: kapsoAuth,
  name: 'send_template_message',
  classification: 'WRITE',
  displayName: 'Send Template Message',
  description: 'Send a pre-approved WhatsApp template message.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a pre-approved WhatsApp template message, substituting values into named header, body, and button parameters. Use this to initiate conversations outside the 24-hour customer service window, where free-form text (Send Text Message) is not allowed; the template must already be approved for the business account. Supports text/image/video/document/location headers and quick-reply, URL, OTP, and flow buttons. Each call delivers a new message, so it is not idempotent.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Send From',
      icon: 'send',
      props: ['businessAccountId', 'phoneNumberId'],
    },
    {
      key: 'recipient',
      display: 'section',
      label: 'Send To',
      icon: 'user',
      props: ['to'],
    },
    {
      key: 'template',
      display: 'section',
      label: 'Template',
      icon: 'file',
      props: ['template'],
    },
    {
      key: 'header',
      display: 'section',
      label: 'Header',
      icon: 'type',
      props: [
        'headerType',
        'headerTextParameters',
        'headerMediaUrl',
        'headerMediaFilename',
        'headerLocationLatitude',
        'headerLocationLongitude',
        'headerLocationName',
        'headerLocationAddress',
      ],
    },
    {
      key: 'values',
      display: 'section',
      label: 'Values',
      icon: 'tag',
      props: ['bodyParameters', 'buttonParameters'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    to: recipientPhoneProp,
    template: templateDropdown,
    headerType: Property.StaticDropdown({
      displayName: 'Header Type',
      description: 'The header your template has. Fill only the fields for that type.',
      required: false,
      defaultValue: 'none',
      options: {
        options: [
          { label: 'None', value: 'none' },
          { label: 'Text', value: 'text' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
          { label: 'Document', value: 'document' },
          { label: 'Location', value: 'location' },
        ],
      },
    }),
    headerTextParameters: Property.Array({
      displayName: 'Text Parameters',
      description: "For Text headers: the value for the header's parameter.",
      required: false,
      properties: {
        parameterName: Property.ShortText({
          displayName: 'Parameter Name',
          description: 'The parameter name in the template.',
          placeholder: 'sale_name',
          required: true,
        }),
        text: Property.ShortText({
          displayName: 'Value',
          description: 'The text to put in its place.',
          required: true,
        }),
      },
    }),
    headerMediaUrl: Property.ShortText({
      displayName: 'Media URL',
      description: 'For Image, Video and Document headers: a public link.',
      placeholder: 'https://example.com/banner.jpg',
      required: false,
    }),
    headerMediaFilename: Property.ShortText({
      displayName: 'File Name',
      description: 'For Document headers: the name the recipient sees.',
      placeholder: 'invoice.pdf',
      required: false,
    }),
    headerLocationLatitude: Property.Number({
      displayName: 'Latitude',
      description: 'For Location headers.',
      width: 'half',
      required: false,
    }),
    headerLocationLongitude: Property.Number({
      displayName: 'Longitude',
      description: 'For Location headers.',
      width: 'half',
      required: false,
    }),
    headerLocationName: Property.ShortText({
      displayName: 'Location Name',
      description: 'For Location headers.',
      placeholder: 'Delivery Location',
      required: false,
    }),
    headerLocationAddress: Property.ShortText({
      displayName: 'Address',
      description: 'For Location headers.',
      required: false,
    }),
    bodyParameters: Property.Array({
      displayName: 'Body Parameters',
      description: 'A value for each named parameter in the template body.',
      required: false,
      properties: {
        parameterName: Property.ShortText({
          displayName: 'Parameter Name',
          description: 'The parameter name in the template.',
          placeholder: 'customer_name',
          required: true,
        }),
        text: Property.ShortText({
          displayName: 'Value',
          description: 'The text to put in its place.',
          required: true,
        }),
      },
    }),
    buttonParameters: Property.Array({
      displayName: 'Button Parameters',
      description: 'Values for the template buttons that need one.',
      required: false,
      properties: {
        subType: Property.StaticDropdown({
          displayName: 'Button Type',
          required: true,
          options: {
            options: [
              { label: 'Quick Reply', value: 'quick_reply' },
              { label: 'URL', value: 'url' },
              { label: 'OTP', value: 'otp' },
              { label: 'Flow', value: 'flow' },
            ],
          },
        }),
        index: Property.ShortText({
          displayName: 'Button Index',
          description: 'Position of the button, starting at 0.',
          placeholder: '0',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'Payload, URL suffix or code. Leave empty for Flow buttons.',
          required: false,
        }),
        flowToken: Property.ShortText({
          displayName: 'Flow Token',
          description: 'For Flow buttons.',
          required: false,
        }),
        flowActionData: Property.Json({
          displayName: 'Flow Action Data',
          description: 'For Flow buttons: data passed to the flow, as JSON.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const {
      phoneNumberId,
      to,
      template,
      headerType,
      headerTextParameters,
      headerMediaUrl,
      headerMediaFilename,
      headerLocationLatitude,
      headerLocationLongitude,
      headerLocationName,
      headerLocationAddress,
      bodyParameters,
      buttonParameters,
    } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const parsed = JSON.parse(template as string) as {
      name: string;
      language: string;
    };

    const components: Array<Record<string, unknown>> = [];

    if (headerType === 'text' && headerTextParameters && (headerTextParameters as unknown[]).length > 0) {
      components.push({
        type: 'header',
        parameters: (
          headerTextParameters as { parameterName: string; text: string }[]
        ).map((p) => ({
          type: 'text',
          parameterName: p.parameterName,
          text: p.text,
        })),
      });
    } else if (headerType === 'image' && headerMediaUrl) {
      components.push({
        type: 'header',
        parameters: [
          { type: 'image', image: { link: headerMediaUrl } },
        ],
      });
    } else if (headerType === 'video' && headerMediaUrl) {
      components.push({
        type: 'header',
        parameters: [
          { type: 'video', video: { link: headerMediaUrl } },
        ],
      });
    } else if (headerType === 'document' && headerMediaUrl) {
      components.push({
        type: 'header',
        parameters: [
          {
            type: 'document',
            document: {
              link: headerMediaUrl,
              filename: headerMediaFilename ?? undefined,
            },
          },
        ],
      });
    } else if (headerType === 'location' && headerLocationLatitude != null && headerLocationLongitude != null) {
      components.push({
        type: 'header',
        parameters: [
          {
            type: 'location',
            location: {
              latitude: headerLocationLatitude,
              longitude: headerLocationLongitude,
              name: headerLocationName ?? undefined,
              address: headerLocationAddress ?? undefined,
            },
          },
        ],
      });
    }

    if (bodyParameters && (bodyParameters as unknown[]).length > 0) {
      components.push({
        type: 'body',
        parameters: (
          bodyParameters as { parameterName?: string; text: string }[]
        ).map((p) => {
          const param: Record<string, unknown> = { type: 'text', text: p.text };
          if (p.parameterName) {
            param['parameterName'] = p.parameterName;
          }
          return param;
        }),
      });
    }

    if (buttonParameters && (buttonParameters as unknown[]).length > 0) {
      for (const btn of buttonParameters as {
        subType: string;
        index: string;
        value?: string;
        flowToken?: string;
        flowActionData?: unknown;
      }[]) {
        if (btn.subType === 'quick_reply') {
          components.push({
            type: 'button',
            sub_type: 'quick_reply',
            index: btn.index,
            parameters: [{ type: 'payload', payload: btn.value }],
          });
        } else if (btn.subType === 'url') {
          components.push({
            type: 'button',
            sub_type: 'url',
            index: btn.index,
            parameters: [{ type: 'text', text: btn.value }],
          });
        } else if (btn.subType === 'otp') {
          components.push({
            type: 'button',
            sub_type: 'otp',
            index: btn.index,
            parameters: [{ type: 'text', text: btn.value }],
          });
        } else if (btn.subType === 'flow') {
          const action: Record<string, unknown> = {};
          if (btn.flowToken) {
            action['flow_token'] = btn.flowToken;
          }
          if (btn.flowActionData) {
            action['flow_action_data'] =
              typeof btn.flowActionData === 'string'
                ? JSON.parse(btn.flowActionData)
                : btn.flowActionData;
          }
          components.push({
            type: 'button',
            sub_type: 'flow',
            index: btn.index,
            parameters: [{ type: 'action', action }],
          });
        }
      }
    }

    const response = await client.messages.sendTemplate({
      phoneNumberId,
      to,
      template: {
        name: parsed.name,
        language: { code: parsed.language },
        components: components as any,
      },
    });

    return response;
  },
});
