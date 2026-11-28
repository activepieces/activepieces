import { createAction, Property } from '@activepieces/pieces-framework';
import { randomUUID } from 'crypto';
import { inklyAuth } from '../auth';
import { inklyClient } from '../common/client';
import { inklyProps } from '../common/props';
import { inklyTemplateInputs } from '../common/template-inputs';
import { inklyOutputSchemas } from '../output-schemas';

export const createDraftAction = createAction({
  auth: inklyAuth,
  name: 'create_draft',
  classification: 'WRITE',
  displayName: 'Create Draft From Template',
  description: 'Prepares a document from a template without sending it, so you can review and send it in Inkly.',
  audience: 'both',
  aiMetadata: {
    description:
      'Prepare an Inkly document from a template as a draft that a person reviews and sends in Inkly. Nothing is emailed and the monthly allowance is not charged. Use Send Document From Template to send right away. Each call creates a new draft.',
    idempotent: false,
  },
  outputSchema: inklyOutputSchemas.createDraft,
  props: {
    template: inklyProps.template(),
    template_inputs: inklyProps.templateInputs(),
    title: Property.ShortText({
      displayName: 'Document Title',
      description: "Leave empty to use the template's title.",
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'A personal note in the invitation email, sent when you send the draft.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const templateId = context.propsValue.template;
    const title = inklyTemplateInputs.text(context.propsValue.title);
    const message = inklyTemplateInputs.text(context.propsValue.message);

    const template = await inklyClient.getTemplate({ apiKey, templateId });
    const inputs = inklyTemplateInputs.read({ template, values: context.propsValue.template_inputs ?? {} });
    if (inputs.missingRoleLabel) {
      throw new Error(`Add an email address for ${inputs.missingRoleLabel}.`);
    }

    const draft = await inklyClient.createDraft({
      apiKey,
      body: {
        template_id: templateId,
        roles: inputs.roles,
        prefilled: inputs.prefilled,
        request_id: randomUUID(),
        ...(title ? { title } : {}),
        ...(message ? { message } : {}),
      },
    });

    return {
      document_id: draft.id,
      status: draft.status,
      review_url: draft.review_url,
      app_url: draft.app_url,
    };
  },
});
