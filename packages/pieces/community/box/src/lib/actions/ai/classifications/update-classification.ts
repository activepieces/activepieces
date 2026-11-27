import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const updateClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_update_classification',
  displayName: 'Update Classification',
  description: 'Renames or redescribes a security classification label of the Box enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes one existing classification label\'s name, definition or color and returns the updated template. Needs an admin. Get the current label from List Classifications; give the same label as New Label to keep the name.',
    idempotent: true,
  },
  props: {
    currentKey: Property.ShortText({
      displayName: 'Current Label',
      description: 'The classification label to change, exactly as listed by List Classifications, e.g. "Sensitive".',
      required: true,
    }),
    newKey: Property.ShortText({
      displayName: 'New Label',
      description: 'The label after the change, e.g. "Very Sensitive". Repeat the current label to keep it.',
      required: true,
    }),
    definition: Property.LongText({
      displayName: 'Definition',
      description: 'A new longer description of the classification.',
      required: false,
    }),
    colorId: Property.Number({
      displayName: 'Color ID',
      description: 'New label color: 0 yellow, 1 orange, 2 red, 3 purple, 4 light blue, 5 dark blue, 6 light green, 7 gray.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: '/metadata_templates/enterprise/securityClassification-6VMVochwUWo/schema',
      headers: { 'content-type': 'application/json-patch+json' },
      body: [
        {
          op: 'editEnumOption',
          fieldKey: 'Box__Security__Classification__Key',
          enumOptionKey: propsValue.currentKey,
          data: {
            key: propsValue.newKey,
            ...staticConfig({ definition: propsValue.definition, colorId: propsValue.colorId }),
          },
        },
      ],
    });
  },
});

function staticConfig({ definition, colorId }: { definition?: string; colorId?: number }) {
  if (definition === undefined && colorId === undefined) {
    return {};
  }
  return {
    staticConfig: {
      classification: {
        ...(definition !== undefined ? { classificationDefinition: definition } : {}),
        ...(colorId !== undefined ? { colorID: colorId } : {}),
      },
    },
  };
}
