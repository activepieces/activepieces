import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  phoneNumberIdDropdown,
  businessAccountIdDropdown,
  templateDropdown,
} from '../common/props';

export const sendTemplate = createAction({
  auth: kapsoAuth,
  name: 'send_template_message',
  displayName: 'Send Template Message',
  description: 'Send a pre-approved WhatsApp template message.',
  props: {
    businessAccountId: businessAccountIdDropdown,
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    template: templateDropdown,
    headerType: Property.StaticDropdown({
      displayName: 'Header Type',
      description: 'The type of header your template uses. Leave as None if no header.',
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
      displayName: 'Header Text Parameters',
      description:
        'Text header parameters (only if header type is Text).',
      required: false,
      properties: {
        parameterName: Property.ShortText({
          displayName: 'Parameter Name',
          description: 'The name of the header parameter (e.g. sale_name).',
          required: true,
        }),
        text: Property.ShortText({
          displayName: 'Value',
          description: 'The value to substitute for this parameter.',
          required: true,
        }),
      },
    }),
    headerMediaUrl: Property.ShortText({
      displayName: 'Header Media URL',
      description:
        'Public URL of the media file for image, video, or document headers.',
      required: false,
    }),
    headerMediaFilename: Property.ShortText({
      displayName: 'Header Document Filename',
      description: 'Filename for document headers (e.g. invoice.pdf).',
      required: false,
    }),
    headerLocationLatitude: Property.Number({
      displayName: 'Header Location Latitude',
      description: 'Latitude for location headers.',
      required: false,
    }),
    headerLocationLongitude: Property.Number({
      displayName: 'Header Location Longitude',
      description: 'Longitude for location headers.',
      required: false,
    }),
    headerLocationName: Property.ShortText({
      displayName: 'Header Location Name',
      description: 'Name of the location (e.g. Delivery Location).',
      required: false,
    }),
    headerLocationAddress: Property.ShortText({
      displayName: 'Header Location Address',
      description: 'Address of the location.',
      required: false,
    }),
    bodyParameters: Property.Array({
      displayName: 'Body Parameters',
      description:
        'Template body parameters. Each entry needs a parameter name and value.',
      required: false,
      properties: {
        parameterName: Property.ShortText({
          displayName: 'Parameter Name',
          description: 'The name of the template parameter (e.g. customer_name).',
          required: true,
        }),
        text: Property.ShortText({
          displayName: 'Value',
          description: 'The value to substitute for this parameter.',
          required: true,
        }),
      },
    }),
    buttonParameters: Property.Array({
      displayName: 'Button Parameters',
      description:
        'Template button parameters. Each entry maps to a button by index.',
      required: false,
      properties: {
        subType: Property.StaticDropdown({
          displayName: 'Button Type',
          description: 'The type of button.',
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
          description: 'Zero-based index of the button (e.g. 0, 1, 2).',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description:
            'For quick_reply: the payload string. For url: the dynamic URL suffix. For otp: the OTP code. Leave empty for flow buttons.',
          required: false,
        }),
        flowToken: Property.ShortText({
          displayName: 'Flow Token',
          description: 'Token for flow buttons (e.g. a session identifier).',
          required: false,
        }),
        flowActionData: Property.Json({
          displayName: 'Flow Action Data',
          description: 'JSON object with data to pass to the flow (e.g. {"customer_id": "123"}).',
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
