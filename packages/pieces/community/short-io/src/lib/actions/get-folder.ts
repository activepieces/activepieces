import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';

export const getFolderAction = createAction({
  auth: shortIoAuth,
  name: 'get_folder',
  displayName: 'Get Folder',
  description: 'Get a link folder by its ID.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one link folder (ID and name) on a Short.io domain, given the domain and the folder ID from List Folders or a link’s FolderId. Use to turn a link’s folder ID into its name. Returns found=false when no folder has that ID. Read-only.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.folderLookup,
  props: {
    domain: shortIoAiProps.domain(),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The folder ID, e.g. the FolderId field of a link.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const folderSeg = shortIoClient.seg({ value: propsValue.folderId, label: 'Folder ID' });
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.GET,
        path: `/links/folders/${shortIoClient.domainIdSeg(domain.id)}/${folderSeg}`,
      });
      if (!shortIoLinks.isRecord(response)) {
        return { found: false, folder: null };
      }
      return { found: true, folder: { id: response['id'], name: response['name'], domainId: domain.id } };
    } catch (error) {
      if (shortIoClient.errorStatus(error) === 404) {
        return { found: false, folder: null };
      }
      return shortIoClient.rethrowWithHint({ error, hints: {} });
    }
  },
});
