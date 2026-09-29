import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

function maxFileSizeMb(): number {
  const configured = Number(process.env['AP_MAX_FILE_SIZE_MB']);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_FILE_SIZE_MB;
}

export const odooDownloadAttachment = createAction({
  auth: odooAuth,
  name: 'odoo_download_attachment',
  classification: 'READ',
  displayName: 'Download Attachment',
  description: 'Download an Odoo attachment as a file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Downloads one Odoo attachment (ir.attachment) by ID and returns it as a file reference usable by later steps; link-type attachments return their URL and no file. Files larger than the instance file limit (AP_MAX_FILE_SIZE_MB, default 25 MB) are refused before download. Get IDs from odoo_list_record_attachments. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: atomicSchemas.download,
  props: {
    attachment_id: atomicProps.idProp({ displayName: 'Attachment ID', description: 'From odoo_list_record_attachments.' }),
  },
  async run(context) {
    const id = odooInput.toId({ value: context.propsValue.attachment_id, label: 'Attachment ID' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const rows = await client.call<Record<string, unknown>[]>({
      model: 'ir.attachment',
      method: 'read',
      args: [[id]],
      kwargs: { fields: ['name', 'mimetype', 'file_size', 'type', 'url'] },
    });
    const row = rows[0];
    if (!row) throw new Error(`Attachment ${id} was not found.`);
    const name = typeof row['name'] === 'string' && row['name'] ? row['name'] : `attachment-${id}`;
    const base = {
      id,
      name,
      mimetype: typeof row['mimetype'] === 'string' ? row['mimetype'] : null,
      file_size: typeof row['file_size'] === 'number' ? row['file_size'] : null,
      type: typeof row['type'] === 'string' ? row['type'] : null,
      url: typeof row['url'] === 'string' ? row['url'] : null,
    };
    const maxMb = maxFileSizeMb();
    if (base.file_size !== null && base.file_size > maxMb * BYTES_PER_MB) {
      throw new Error(
        `Attachment ${id} (${name}) is ${(base.file_size / BYTES_PER_MB).toFixed(1)} MB, larger than the ${maxMb} MB file limit of this Activepieces instance. It was not downloaded.`,
      );
    }
    const [content] = await client.call<Record<string, unknown>[]>({
      model: 'ir.attachment',
      method: 'read',
      args: [[id]],
      kwargs: { fields: ['datas'] },
    });
    const datas = content?.['datas'];
    if (typeof datas !== 'string' || datas.length === 0) {
      return { ...base, file: null };
    }
    const file = await context.files.write({ fileName: name, data: Buffer.from(datas, 'base64') });
    return { ...base, file };
  },
});

const DEFAULT_MAX_FILE_SIZE_MB = 25;
const BYTES_PER_MB = 1024 * 1024;
