import type { AppConnectionType } from '@activepieces/pieces-framework';

export type MongodbAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: {
    host: string;
    useAtlasUrl: boolean;
    database?: string;
    username: string;
    password: string;
    authSource?: string;
  };
};
