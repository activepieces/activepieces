import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioCreateFormOutputSchema } from '../../../output-schemas';

export const getFormAction = createAction({
  auth: podioAuth,
  name: 'podio_get_form',
  outputSchema: podioCreateFormOutputSchema,
  displayName: 'Get Form',
  description: 'Gets one web form with its settings, domains and fields.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio web form: its status (active or disabled), texts, theme, captcha, allowed domains, fields and whether attachments are allowed. The form id comes from List Forms or Create Form.',
    idempotent: true,
  },
  props: {
    formId: podioAiProps.id({ required: true, displayName: 'Form ID', description: 'The id of the form, from List Forms or Create Form.' }),
  },
  async run({ auth, propsValue }) {
    return await podioApi.getForm({ auth, formId: propsValue.formId });
  },
});
