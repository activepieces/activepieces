import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const updateFileAction = createAction({
  auth: simplyprintAuth,
  name: 'update_file',
  displayName: 'Update File',
  description:
    'Rename a user file and / or update its compatible-printer assignments. (Thumbnail upload is not exposed here — multipart isn\'t supported on this endpoint over OAuth via the AP HTTP client.)',
  props: {
    fileUid: Property.ShortText({
      displayName: 'File UID',
      description: 'UID string of the file to update (10-36 chars). Look up via "List Files".',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New name',
      description: 'New display name (max 256 chars). Keep the existing extension — backend infers file type from it.',
      required: false,
    }),
    printerIds: Property.Array({
      displayName: 'Restrict to printer IDs',
      description: 'Numeric printer IDs the file is allowed to print on. Leave empty to clear printer-restriction.',
      required: false,
    }),
    printerModelIds: Property.Array({
      displayName: 'Restrict to printer model IDs',
      description: 'Numeric model IDs the file is allowed to print on. Leave empty to clear model-restriction.',
      required: false,
    }),
    removeThumbnail: Property.Checkbox({
      displayName: 'Remove existing thumbnail',
      description: 'When true, deletes any thumbnail currently stored on the file.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const v = context.propsValue;
    const csv = (a: unknown) => ((a as unknown[] | undefined) ?? []).map(Number).filter((n) => n > 0).join(',');

    const body: Record<string, unknown> = {};
    if (v.name?.trim()) body['name'] = v.name.trim();
    const printers = csv(v.printerIds);
    if (printers || v.printerIds !== undefined) body['printers'] = printers;
    const models = csv(v.printerModelIds);
    if (models || v.printerModelIds !== undefined) body['printer_models'] = models;
    if (v.removeThumbnail) body['remove_thumbnail'] = true;

    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one field to update (name, printer assignments, or remove thumbnail).');
    }

    // files/UpdateFile reads `id` (UID) from $this->GET.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'files/UpdateFile',
      queryParams: { id: String(v.fileUid).trim() },
      body,
    });
  },
});
