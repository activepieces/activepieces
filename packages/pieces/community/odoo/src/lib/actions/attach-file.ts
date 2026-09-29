import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooOperations } from '../common/operations';
import { odooProps } from '../common/props';
import { odooInput } from '../common/values';
import { createdAttachmentOutputSchema } from '../output-schemas';

export const attachFileAction = createAction({
  auth: odooAuth,
  name: 'attach_file',
  classification: 'WRITE',
  displayName: 'Attach File to Record',
  description: 'Attach a file to a record, for example a signed PDF to a sales order.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a file as an attachment (ir.attachment) linked to one Odoo record, shown in its chatter attachments. Not idempotent: each call adds another attachment. If read_back_error is set, the record was created but could not be read back: do not create it again; open it with Get Record using the returned id.',
    idempotent: false,
  },
  outputSchema: createdAttachmentOutputSchema,
  props: {
    model: odooProps.modelDropdown(),
    record_id: odooProps.recordDropdown(),
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Optional. For example contract.pdf. Leave empty to keep the original name.',
      required: false,
    }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const recordId = odooInput.toId({ value: context.propsValue.record_id, label: 'Record' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.attachFile({
      client,
      model,
      recordId,
      file: context.propsValue.file,
      name: odooInput.optionalText(context.propsValue.file_name),
    });
  },
});
