import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooListRecordAttachments = createAction({
  auth: odooAuth,
  name: 'odoo_list_record_attachments',
  classification: 'SEARCH',
  displayName: 'List Record Attachments',
  description: 'List the files attached to an Odoo record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the attachments linked to one Odoo record (name, type, size, id) without downloading them; pass an id to odoo_download_attachment to get the file. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.attachments,
  props: {
    model: atomicProps.modelProp(),
    record_id: atomicProps.idProp({ displayName: 'Record ID', description: 'ID of the record whose attachments to list.' }),
    limit: atomicProps.limitProp({ fallback: 50, max: 200 }),
    offset: atomicProps.offsetProp(),
  },
  async run(context) {
    const p = context.propsValue;
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooRecords.findApp({
      client,
      model: odooApps.attachment.model,
      wanted: odooApps.attachment.fields,
      domain: [
        ['res_model', '=', odooInput.toModelName(p.model)],
        ['res_id', '=', odooInput.toId({ value: p.record_id, label: 'Record ID' })],
      ],
      limit: odooInput.clampLimit({ value: p.limit, fallback: 50, max: 200 }),
      offset: odooInput.toOffset(p.offset),
      order: 'id desc',
    });
  },
});
