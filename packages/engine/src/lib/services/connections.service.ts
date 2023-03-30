import axios from 'axios';
import { AppConnection, AppConnectionType, CloudOAuth2ConnectionValue, BasicAuthConnectionValue, OAuth2ConnectionValueWithApp } from '@activepieces/shared';
import { globals } from '../globals';

export const connectionService = {
    async obtain(connectionName: string): Promise<null | OAuth2ConnectionValueWithApp | CloudOAuth2ConnectionValue | BasicAuthConnectionValue | string | Record<string, unknown> > {
        const url = globals.apiUrl + `/v1/app-connections/${connectionName}?projectId=${globals.projectId}`;
        try {
            const result: AppConnection = (await axios({
                method: 'GET',
                url: url,
                headers: {
                    Authorization: 'Bearer ' + globals.workerToken
                }
            })).data;
            if(result === null){
                return null;
            }
            if(result.value.type === AppConnectionType.SECRET_TEXT){
                return result.value.secret_text;
            }
            if(result.value.type === AppConnectionType.CUSTOM_AUTH){
                return result.value.props;
            }
            return result.value;
        } catch (e) {
            throw new Error("Connection information failed to load" + e + " url " + url);
        }
    }

}
