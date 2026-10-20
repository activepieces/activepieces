import { createAction } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

export const listFiles = createAction({
  auth: netlifyAuth,
  name: 'list_files',
  classification: 'SEARCH',
  displayName: 'List Files',
  description: 'List the files of the published deploy of a site.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists every file served by the currently published deploy of one Netlify site, with path, MIME type, size and SHA-1. Use it to check whether a page or asset is live. Read-only.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.fileList,
  props: { siteId: netlifyProps.siteDropdown({ description: 'The site whose files to list.' }) },
  async run({ auth, propsValue }) {
    return netlifyOperations.listFiles({ auth, siteId: propsValue.siteId });
  },
});

export const listFilesById = createAction({
  auth: netlifyAuth,
  name: 'list_files_by_id',
  classification: 'SEARCH',
  displayName: 'List Files by Site ID',
  description: 'List the files of the published deploy of a site given its ID or domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every file served by the currently published deploy of one Netlify site, with path, MIME type, size and SHA-1. Use it to check whether a page or asset is live. Read-only. Get the site ID from List Sites.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.fileList,
  props: { siteId: netlifyProps.siteId() },
  async run({ auth, propsValue }) {
    return netlifyOperations.listFiles({ auth, siteId: propsValue.siteId });
  },
});
