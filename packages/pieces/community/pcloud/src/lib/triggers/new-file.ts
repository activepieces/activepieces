import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from '../common/constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const newFile = createTrigger({
  name: 'new-file',
  displayName: 'New File Uploaded',
  description: 'Triggers when a new file is uploaded to a specific folder',
  type: TriggerStrategy.POLLING,
  props: {
    path: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Path to the folder to monitor (e.g., /Documents)',
      required: false,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'ID of the folder to monitor',
      required: false,
    }),
  },
  sampleData: {
    "result": 0,
    "metadata": {
      "name": "example.txt",
      "created": "Wed, 02 Oct 2013 14:29:11 +0000",
      "modified": "Wed, 02 Oct 2013 14:29:11 +0000",
      "size": 1234,
      "fileid": 12345,
      "path": "/Documents/example.txt"
    }
  },
  async onEnable(context) {
    if (!context.propsValue.path && !context.propsValue.folderId) {
      throw new Error('Either path or folderId must be provided');
    }
  },
  async onDisable(context) {
    // Cleanup if needed
  },
  async run(context) {
    const { path, folderId } = context.propsValue;
    const lastRun = await context.store.get<number>('lastRun') || 0;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${PCLOUD_API_URL}${API_ENDPOINTS.LIST_FOLDER}`,
      queryParams: {
        ...(path ? { path } : {}),
        ...(folderId ? { folderid: folderId.toString() } : {}),
        timeformat: 'timestamp',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as OAuth2PropertyValue).access_token,
      },
    });

    if (response.status === 200) {
      const files = response.body.metadata.filter((file: any) => {
        return !file.isfolder && new Date(file.created).getTime() > lastRun;
      });

      if (files.length > 0) {
        await context.store.put('lastRun', new Date().getTime());
        return files;
      }
    }

    return [];
  },
}); 