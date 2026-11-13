import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

export const listFoldersAction = createAction({
  auth: shortIoAuth,
  name: 'list_folders',
  displayName: 'List Folders',
  description: 'List the link folders on a domain.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the link folders of a Short.io domain with their IDs and names, to use as Folder ID in other steps. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.folderList,
  props: {
    domain: shortIoAiProps.domain(),
  },
  async run({ auth, propsValue }) {
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.GET,
        path: `/links/folders/${shortIoClient.domainIdSeg(domain.id)}`,
      });
      const folders = shortIoLinks.isRecord(response) && Array.isArray(response['linkFolders']) ? response['linkFolders'].filter(shortIoLinks.isRecord) : [];
      const items = folders.map((folder) => ({ ...folder, id: folder['id'], name: folder['name'] }));
      return { items, count: items.length };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: {} });
    }
  },
});
