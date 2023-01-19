import axios from 'axios';
import { AppConnection, SeekPage } from '@activepieces/shared';
import { globals } from '../globals';

export const connectionService = {
    async obtain(connectionName: string): Promise<null | AppConnection> {
        const url = globals.apiUrl + `/v1/app-connections?projectId=${globals.projectId}&name=${connectionName}`;
        try {
            const result: SeekPage<AppConnection> = (await axios({
                method: 'GET',
                url: url,
                headers: {
                    Authorization: 'Bearer ' + globals.workerToken
                }
            })).data;
            if (result.data.length === 0) {
                return null;
            }
            return result.data[0];
        } catch (e) {
            throw new Error("Connection information failed to load" + e + " url " + url);
        }
    }

}
