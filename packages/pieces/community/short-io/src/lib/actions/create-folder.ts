import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

export const createFolderAction = createAction({
  auth: shortIoAuth,
  name: 'create_folder',
  displayName: 'Create Folder',
  description: 'Create a link folder on a domain.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a new link folder on a Short.io domain and returns its ID. Not idempotent: a repeat call may create a second folder with the same name.',
    idempotent: false,
  },
  outputSchema: shortIoSchemas.folder,
  props: {
    domain: shortIoAiProps.domain(),
    name: Property.ShortText({
      displayName: 'Folder Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const name = propsValue.name.trim();
    if (!name) {
      throw new Error('Folder name is required.');
    }
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.POST,
        path: '/links/folders',
        body: { domainId: domain.id, name },
      });
      const record = shortIoLinks.isRecord(response) ? response : {};
      const folder = shortIoLinks.isRecord(record['linkFolder']) ? record['linkFolder'] : record;
      return { ...folder, id: folder['id'] ?? null, name: folder['name'] ?? name, domainId: domain.id };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 409: 'A folder with this name already exists.' } });
    }
  },
});
