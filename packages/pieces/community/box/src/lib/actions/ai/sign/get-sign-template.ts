import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const getSignTemplateAction = createAction({
  auth: boxAuth,
  name: 'box_get_sign_template',
  displayName: 'Get Sign Template',
  description: 'Gets a Box Sign template by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one Box Sign template with its source files, signer roles and inputs, and which settings are locked. Use it before Create Sign Request to see which signers and emails the template needs. Get the ID from List Sign Templates.',
    idempotent: true,
  },
  props: {
    templateId: boxAiProps.signTemplateId({
      required: true,
      description: 'The sign template ID, from List Sign Templates.',
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/sign_templates/${encodeURIComponent(propsValue.templateId)}`,
    });
  },
});
