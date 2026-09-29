import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooAttachFile = createAction({
  auth: odooAuth,
  name: 'odoo_attach_file',
  classification: 'WRITE',
  displayName: 'Attach File',
  description: 'Attach a file to an Odoo record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a file (URL or base64) as an Odoo attachment (ir.attachment) linked to one record, for example a PDF on a sale order or invoice. Not idempotent: each call adds another attachment.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.attachment,
  props: {
    model: atomicProps.modelProp(),
    record_id: atomicProps.idProp({ displayName: 'Record ID', description: 'ID of the record to attach the file to.' }),
    file: Property.File({ displayName: 'File', description: 'A file URL or base64 content.', required: true }),
    file_name: Property.ShortText({ displayName: 'File Name', description: 'For example contract.pdf. Defaults to the source name.', required: false }),
    mimetype: Property.ShortText({ displayName: 'MIME Type', description: 'For example application/pdf. Odoo guesses it when empty.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.attachFile({
      client,
      model: odooInput.toModelName(p.model),
      recordId: odooInput.toId({ value: p.record_id, label: 'Record ID' }),
      file: p.file,
      name: odooInput.optionalText(p.file_name),
      mimetype: odooInput.optionalText(p.mimetype),
    });
  },
});
