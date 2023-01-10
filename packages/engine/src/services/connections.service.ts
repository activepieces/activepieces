import axios from 'axios';
import { AppConnection, SeekPage } from 'shared';
import { globals } from '../globals';

export const connectionService = {
    async obtain(appName: string, connectionName: string): Promise<null | AppConnection> {
        try {
            const result: SeekPage<AppConnection> = (await axios({
                method: 'GET',
                url: globals.apiUrl + `/v1/app-connections?projectId=${globals.projectId}&appName=${appName}&name=${connectionName}`,
                headers: {
                    Authorization: 'Bearer ' + globals.workerToken
                }
            })).data;
            if(result.data.length === 0){
                return null;
            }
            return result.data[0];
        } catch (e) {
            throw new Error("Connection information failed to load" + e);
        }
    }

}