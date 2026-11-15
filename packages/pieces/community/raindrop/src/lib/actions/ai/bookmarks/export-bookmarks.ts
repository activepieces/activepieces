import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropDownloadBackupOutputSchema } from '../../../output-schemas';

export const raindropExportBookmarksAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_export_bookmarks',
  outputSchema: raindropDownloadBackupOutputSchema,
  displayName: 'Export Bookmarks',
  description: 'Exports the bookmarks of a collection as a CSV, HTML or ZIP file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Exports all bookmarks of a collection (0 = all), optionally filtered by search, as a CSV, HTML or ZIP file and returns the file. Use List Bookmarks to read bookmarks as data instead.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: false,
      description:
        'Collection ID from List Collections. Defaults to 0 (all bookmarks); -1 = Unsorted, -99 = Trash.',
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'File format of the export.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'CSV', value: 'csv' },
          { label: 'HTML', value: 'html' },
          { label: 'ZIP', value: 'zip' },
        ],
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only export bookmarks matching this Raindrop search query, e.g. "#ai".',
      required: false,
    }),
    sort: raindropAiProps.bookmarkSort({ required: false }),
  },
  async run({ auth, propsValue, files }) {
    const collectionId = propsValue.collectionId ?? '0';
    const response = await raindropClient.request<Buffer>({
      auth,
      method: HttpMethod.GET,
      path: `/raindrops/${encodeURIComponent(collectionId)}/export.${encodeURIComponent(
        propsValue.format,
      )}`,
      query: {
        ...(propsValue.search !== undefined ? { search: propsValue.search } : {}),
        ...(propsValue.sort !== undefined ? { sort: propsValue.sort } : {}),
      },
      responseType: 'arraybuffer',
    });
    const fileName = `raindrop-export-${collectionId}.${propsValue.format}`;
    const file = await files.write({ fileName, data: Buffer.from(response) });
    return { file, fileName };
  },
});
