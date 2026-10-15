import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { themeOutputSchema } from '../output-schemas';

export const createThemeAction = createAction({
  auth: typeformAuth,
  name: 'create_theme',
  classification: 'WRITE',
  displayName: 'Create Theme',
  description: 'Creates a custom theme.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a private Typeform theme with a name, font, the four colors (question, answer, button, background, as hex like #3D3D3D) and alignment and font size for questions and screens. Alignment defaults to left and font size to medium. Apply it to a form with Update Form. Each call creates another theme.',
    idempotent: false,
  },
  outputSchema: themeOutputSchema,
  props: {
    ...typeformCommon.themeFields,
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    questionColor: Property.ShortText({
      displayName: 'Question Color',
      description: 'Hex color, for example #3D3D3D.',
      required: true,
    }),
    answerColor: Property.ShortText({
      displayName: 'Answer Color',
      description: 'Hex color.',
      required: true,
    }),
    buttonColor: Property.ShortText({
      displayName: 'Button Color',
      description: 'Hex color.',
      required: true,
    }),
    backgroundColor: Property.ShortText({
      displayName: 'Background Color',
      description: 'Hex color.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.POST,
      path: '/themes',
      body: typeformCommon.themeBody({
        values: {
          ...propsValue,
          fieldAlignment: propsValue.fieldAlignment ?? 'left',
          fieldFontSize: propsValue.fieldFontSize ?? 'medium',
          screenAlignment: propsValue.screenAlignment ?? 'left',
          screenFontSize: propsValue.screenFontSize ?? 'medium',
        },
        current: {},
      }),
    });
  },
});
