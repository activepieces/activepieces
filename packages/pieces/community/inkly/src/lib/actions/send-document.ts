import { createAction, Property } from '@activepieces/pieces-framework';
import { createHash, randomUUID } from 'crypto';
import { inklyAuth } from '../auth';
import { inklyClient } from '../common/client';
import { inklyProps } from '../common/props';
import { inklyTemplateInputs } from '../common/template-inputs';
import { inklyOutputSchemas } from '../output-schemas';

export const sendDocumentAction = createAction({
  auth: inklyAuth,
  name: 'send_document',
  classification: 'WRITE',
  displayName: 'Send Document From Template',
  description: 'Sends a document for signature from one of your Inkly templates.',
  audience: 'both',
  aiMetadata: {
    description:
      'Send a legally binding document for signature from an Inkly template, emailing every signer right away. Use Create Draft From Template instead when a person should review it first. Each call sends a new document and uses one API document from the monthly allowance, unless the same Unique ID is reused, which returns the first send.',
    idempotent: false,
  },
  outputSchema: inklyOutputSchemas.sendDocument,
  props: {
    template: inklyProps.template(),
    template_inputs: inklyProps.templateInputs(),
    unique_id: Property.ShortText({
      displayName: 'Unique ID',
      description:
        "Recommended. A value that's different for each document, such as a deal ID or spreadsheet row ID. If this step runs again with the same value, Inkly won't send the document twice. It's also saved as the document's External ID. Leave it empty and every run sends a new document.",
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Document Title',
      description: "Leave empty to use the template's title.",
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'A personal note in the invitation email.',
      required: false,
    }),
    automatic_reminders: Property.Checkbox({
      displayName: 'Automatic Reminders',
      description: 'Remind signers by email until they sign.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const templateId = context.propsValue.template;
    const uniqueId = inklyTemplateInputs.text(context.propsValue.unique_id);
    const title = inklyTemplateInputs.text(context.propsValue.title);
    const message = inklyTemplateInputs.text(context.propsValue.message);

    if (uniqueId && !PRINTABLE_ASCII.test(uniqueId)) {
      throw new Error('Unique ID must be 1 to 255 plain characters: letters, numbers, spaces, and punctuation.');
    }

    const template = await inklyClient.getTemplate({ apiKey, templateId });
    const inputs = inklyTemplateInputs.read({ template, values: context.propsValue.template_inputs ?? {} });
    if (inputs.missingRoleLabel) {
      throw new Error(`Add an email address for ${inputs.missingRoleLabel}.`);
    }

    const idempotencyKey = uniqueId
      ? `activepieces-${createHash('sha256')
          .update([context.flows.current.id, context.step.name, templateId, uniqueId].join('\n'))
          .digest('hex')}`
      : `activepieces-${randomUUID()}`;

    const response = await inklyClient.sendFromTemplate({
      apiKey,
      idempotencyKey,
      body: {
        template_id: templateId,
        recipients: inputs.roles,
        prefilled_values: inputs.prefilled,
        automatic_reminders: context.propsValue.automatic_reminders === true,
        ...(title ? { title } : {}),
        ...(message ? { message } : {}),
        ...(uniqueId ? { external_id: uniqueId } : {}),
      },
    });

    return {
      document_id: response.document.id,
      title: response.document.title,
      status: response.document.status,
      external_id: response.document.external_id,
      template_id: response.document.template_id,
      created_at: response.document.created_at,
      recipients: response.recipients.map((recipient) => ({
        id: recipient.id,
        role_id: recipient.role_id,
        role: recipient.role,
        name: recipient.name,
        email: recipient.email,
        status: recipient.status,
      })),
    };
  },
});

const PRINTABLE_ASCII = /^[\x20-\x7e]{1,255}$/;
