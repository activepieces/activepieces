import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const createDesign = createAction({
  auth: canvaAuth,
  name: 'create_design',
  displayName: 'Create Design',
  description: 'Create a new design in Canva',
  props: {
    name: Property.ShortText({
      displayName: 'Design Name',
      description: 'The name of the design to create',
      required: true,
    }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'Optional template ID to use as a base',
      required: false,
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Width of the design in pixels',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Height of the design in pixels',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const { name, templateId, width, height } = context.propsValue;

    const requestBody: Record<string, unknown> = {
      name,
    };

    if (templateId) {
      requestBody.templateId = templateId;
    }

    if (width && height) {
      requestBody.dimensions = {
        width,
        height,
        unit: 'px',
      };
    }

    const response = await fetch('https://api.canva.com/rest/v1/designs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create design: ${error}`);
    }

    return await response.json();
  },
});