import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from '../common/constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const newFolder = createTrigger({
  name: 'new-folder',
  displayName: 'Folder Created',
  description: 'Triggers when a new folder is created in a specific location',
  type: TriggerStrategy.POLLING,
  props: {
    path: Property.ShortText({
      displayName: 'Parent Folder Path',
      description: 'Path to the parent folder to monitor (e.g., /Projects)',
      required: false,
    }),
    folderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'ID of the parent folder to monitor',
      required: false,
    }),
  },
  sampleData: {
    "result": 0,
    "metadata": {
      "name": "New Project",
      "created": "Wed, 02 Oct 2013 14:29:11 +0000",
      "modified": "Wed, 02 Oct 2013 14:29:11 +0000",
      "folderid": 12345,
      "path": "/Projects/New Project"
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
      const folders = response.body.metadata.filter((folder: any) => {
        return folder.isfolder && new Date(folder.created).getTime() > lastRun;
      });

      if (folders.length > 0) {
        await context.store.put('lastRun', new Date().getTime());
        return folders;
      }
    }

    return [];
  },
}); 