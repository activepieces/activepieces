import {
  Property,
  DynamicPropsValue,
  createAction,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { bannerbearAuth } from '../../';

export const bannerbearCreateImageAction = createAction({
  auth: bannerbearAuth,
  name: 'bannerbear_create_image', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Create Image',
  description: 'Create image from Bannerbear template',
  props: {
    template: Property.Dropdown({
      displayName: 'Template',
      description: 'The template to use in image creation.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please enter your API key first.',
          };
        }

        const response = await httpClient.sendRequest<BannerbearTemplate[]>({
          method: HttpMethod.GET,
          url: `https://api.bannerbear.com/v2/templates`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
        });

        if (response.status === 200) {
          return {
            disabled: false,
            options: response.body.map((template) => {
              return {
                label: template.name,
                value: template,
              };
            }),
          };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Error processing templates',
        };
      },
    }),
    template_version: Property.Number({
      displayName: 'Template version',
      description: 'Create image based on a specific version of the template.',
      required: false,
    }),
    modifications: Property.DynamicProperties({
      displayName: 'Template modifications',
      description: 'A list of modifications you want to make on the template.',
      required: true,
      refreshers: ['template'],
      props: async ({ auth, template }) => {
        if (!auth) return {};
        if (!template) return {};

        let fields: DynamicPropsValue = {};

        (template as BannerbearTemplate).available_modifications.map(
          (modification) => {
            if ('text' in modification) {
              fields = {
                ...BannerbearModificationsMapping.main,
                ...BannerbearModificationsMapping.text,
                ...BannerbearModificationsMapping.common,
              };
            } else if ('rating' in modification) {
              fields = {
                ...BannerbearModificationsMapping.main,
                ...BannerbearModificationsMapping.star_rating,
                ...BannerbearModificationsMapping.common,
              };
            } else if ('image_url' in modification) {
              fields = {
                ...BannerbearModificationsMapping.main,
                ...BannerbearModificationsMapping.image,
                ...BannerbearModificationsMapping.common,
              };
            } else if ('chart_data' in modification) {
              fields = {
                ...BannerbearModificationsMapping.main,
                ...BannerbearModificationsMapping.barline_chart,
                ...BannerbearModificationsMapping.common,
              };
            } else if ('bar_code_data' in modification) {
              fields = {
                ...BannerbearModificationsMapping.main,
                ...BannerbearModificationsMapping.bar_code,
                ...BannerbearModificationsMapping.common,
              };
            }
          }
        );

        return fields;
      },
    }),
    transparent: Property.Checkbox({
      displayName: 'Transparent background',
      description:
        'Render a PNG with a transparent background. Default is false.',
      required: false,
    }),
    render_pdf: Property.Checkbox({
      displayName: 'Render a PDF',
      description: 'Render a PDF instead of a PNG. Default is false.',
      required: false,
    }),
    metadata: Property.LongText({
      displayName: 'Metadata',
      description:
        'Any metadata that you need to store e.g. ID of a record in your DB.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      modifications:
        Object.keys(propsValue.modifications).length === 0
          ? []
          : [propsValue.modifications],
      template_version: propsValue.template_version,
      transparent: propsValue.transparent,
      render_pdf: propsValue.render_pdf,
      template: propsValue.template.uid,
      metadata: propsValue.metadata,
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://sync.api.bannerbear.com/v2/images`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth,
      },
    };

    const result = await httpClient.sendRequest<BannerbearTemplate>(request);
    console.debug('Image creation complete', result);

    if (result.status === 200 || result.status === 202) {
      return result.body;
    } else {
      return result;
    }
  },
});

interface BannerbearTemplate {
  created_at: string;
  name: string;
  self: string;
  uid: string;
  preview_url: number;
  width: number;
  height: number;
  available_modifications: {
    name: string;
    image_url?: string;
    text?: string;
    chart_data: string;
    bar_code_data: number;
    rating: number;
  }[];
  tags: string[];
}

const BannerbearModificationsMapping = {
  main: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
      description: 'The name of the layer you want to change.',
    }),
    color: Property.ShortText({
      displayName: 'Color',
      required: false,
      description: 'Color in hex format e.g. "#FF0000".',
    }),
  },
  common: {
    gradient: Property.ShortText({
      displayName: 'Gradient',
      required: false,
      description: 'Fill with gradient e.g. ["#000", "#FFF"]',
    }),
    border_width: Property.Number({
      displayName: 'Border width',
      required: false,
      description: 'Width of the object border.',
    }),
    border_color: Property.ShortText({
      displayName: 'Border color',
      required: false,
      description: 'Border color in hex format e.g. "#FF0000".',
    }),
    shift_x: Property.Number({
      displayName: 'Shift x',
      required: false,
      description: 'Shift layer along the x axis.',
    }),
    shift_y: Property.Number({
      displayName: 'Shift y',
      required: false,
      description: 'Shift layer along the y axis.',
    }),
    target: Property.ShortText({
      displayName: 'Target',
      required: false,
      description:
        'Add a clickable link to a URL on this object when rendering a PDF.',
    }),
    hide: Property.Checkbox({
      displayName: 'Hide',
      required: false,
      description: 'Set to true to hide a layer.',
    }),
  },
  text: {
    text: Property.ShortText({
      displayName: 'Text',
      required: false,
      description: 'Replacement text you want to use.',
    }),
    background: Property.ShortText({
      displayName: 'Background',
      required: false,
      description: 'Background color in hex format e.g. "#FF0000".',
    }),
    font_family: Property.ShortText({
      displayName: 'Font family',
      required: false,
      description: 'Change the font.',
    }),
    text_align_h: Property.ShortText({
      displayName: 'Text align H',
      required: false,
      description: 'Horizontal alignment (left, center, right)',
    }),
    text_align_v: Property.ShortText({
      displayName: 'Text align V',
      required: false,
      description: 'Vertical alignment (top, center, bottom)',
    }),
    font_family_2: Property.ShortText({
      displayName: 'Font family 2',
      required: false,
      description: 'Change the secondary font.',
    }),
    color_2: Property.ShortText({
      displayName: 'Color 2',
      required: false,
      description: 'Change the secondary font color.',
    }),
  },
  image: {
    image_url: Property.ShortText({
      displayName: 'Image url',
      required: false,
      description: 'Change the image.',
    }),
    effect: Property.ShortText({
      displayName: 'Effect',
      required: false,
      description: 'Change the effect.',
    }),
    anchor_x: Property.ShortText({
      displayName: 'Anchor x',
      required: false,
      description: 'Change the anchor point (left, center, right)',
    }),
    anchor_y: Property.ShortText({
      displayName: 'Anchor y',
      required: false,
      description: 'Change the anchor point (top, center, bottom).',
    }),
    fill_type: Property.ShortText({
      displayName: 'Fill type',
      required: false,
      description: 'Change the fill type (fill, fit).',
    }),
    disable_face_detect: Property.Checkbox({
      displayName: 'Disable face detect',
      required: false,
      description:
        'Set to true to disable face detect for this request (if the image container is using face detect).',
    }),
    disable_smart_crop: Property.Checkbox({
      displayName: 'Disable smart crop',
      required: false,
      description:
        'Set to true to disable smart crop for this request (if the image container is using smart crop)',
    }),
  },
  barline_chart: {
    chart_data: Property.ShortText({
      displayName: 'Chart data',
      required: false,
      description: 'Comma-delimited list of numbers to use as data.',
    }),
  },
  star_rating: {
    rating: Property.Number({
      displayName: 'Rating',
      required: false,
      description: 'Number from 0 to 100 to use as the rating.',
    }),
  },
  qr_code: {
    target: Property.ShortText({
      displayName: 'Target',
      required: false,
      description: 'URL or text to use as the code target.',
    }),
  },
  bar_code: {
    bar_code_data: Property.ShortText({
      displayName: 'Barcode data',
      required: false,
      description: 'Text to encode as a bar code.',
    }),
  },
};
