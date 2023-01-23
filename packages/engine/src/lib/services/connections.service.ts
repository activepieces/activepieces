import axios from 'axios';
import { AppConnection, SeekPage } from '@activepieces/shared';
import { globals } from '../globals';

export const connectionService = {
    async obtain(connectionName: string): Promise<null | AppConnection> {
        const url = globals.apiUrl + `/v1/app-connections/${connectionName}?projectId=${globals.projectId}`;
        try {
            const result: AppConnection = (await axios({
                method: 'GET',
                url: url,
                headers: {
                    Authorization: 'Bearer ' + globals.workerToken
                }
            })).data;
            return result;
        } catch (e) {
            throw new Error("Connection information failed to load" + e + " url " + url);
        }
    }

}
