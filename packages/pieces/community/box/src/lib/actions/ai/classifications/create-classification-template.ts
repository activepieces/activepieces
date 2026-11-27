import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createClassificationTemplateAction = createAction({
  auth: boxAuth,
  name: 'box_create_classification_template',
  displayName: 'Create Classification Template',
  description: 'Sets up security classifications for a Box enterprise with an initial list of labels.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates the enterprise\'s classification template with its first classification labels; only for an enterprise with no classifications yet (List Classifications returns 404), otherwise it fails and Add Classification is the one to use. Needs an admin. Add definitions and colors afterwards with Update Classification.',
    idempotent: false,
  },
  props: {
    labels: Property.Array({
      displayName: 'Labels',
      description: 'The initial classification labels, e.g. ["Public", "Confidential"].',
      required: true,
    }),
    hidden: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Hidden',
      description: '"true" or "false": whether the classification template is hidden in the Box web and mobile apps.',
    }),
    copyInstanceOnItemCopy: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Copy On Item Copy',
      description: '"true" or "false": whether a classification is kept when its file or folder is copied.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/metadata_templates/schema',
      body: {
        scope: 'enterprise',
        templateKey: 'securityClassification-6VMVochwUWo',
        displayName: 'Classification',
        ...(propsValue.hidden !== undefined ? { hidden: propsValue.hidden === 'true' } : {}),
        ...(propsValue.copyInstanceOnItemCopy !== undefined
          ? { copyInstanceOnItemCopy: propsValue.copyInstanceOnItemCopy === 'true' }
          : {}),
        fields: [
          {
            type: 'enum',
            key: 'Box__Security__Classification__Key',
            displayName: 'Classification',
            options: propsValue.labels.map((label) => ({ key: String(label) })),
          },
        ],
      },
    });
  },
});
