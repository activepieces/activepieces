import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxClient } from '../../../common/client';

export const addClassificationAction = createAction({
  auth: boxAuth,
  name: 'box_add_classification',
  displayName: 'Add Classification',
  description: 'Adds a new security classification label to the Box enterprise.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one classification label to the enterprise\'s existing list and returns the updated template. Needs an admin and an enterprise that already has classifications (List Classifications); otherwise use Create Classification Template. Use Update Classification to rename or redescribe a label.',
    idempotent: false,
  },
  props: {
    key: Property.ShortText({
      displayName: 'Label',
      description: 'The new classification label as shown in Box, e.g. "Sensitive".',
      required: true,
    }),
    definition: Property.LongText({
      displayName: 'Definition',
      description: 'A longer description of the classification, e.g. "Sensitive information that must not be shared."',
      required: false,
    }),
    colorId: Property.Number({
      displayName: 'Color ID',
      description: 'Label color: 0 yellow, 1 orange, 2 red, 3 purple, 4 light blue, 5 dark blue, 6 light green, 7 gray.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: '/metadata_templates/enterprise/securityClassification-6VMVochwUWo/schema',
      body: [
        {
          op: 'addEnumOption',
          fieldKey: 'Box__Security__Classification__Key',
          data: {
            key: propsValue.key,
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
