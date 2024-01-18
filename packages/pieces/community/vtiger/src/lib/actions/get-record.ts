import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import { instanceLogin, recordIdProperty } from '../common';
import { elementTypeProperty } from '../common';

//Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/-/wikis/Webservice-Docs
//Extra: https://help.vtiger.com/article/147111249-Rest-API-Manual

export const getRecord = createAction({
  name: 'get_record',
  auth: vtigerAuth,
  displayName: 'Get Record',
  description: 'Get a Record by value',
  props: {
    elementType: elementTypeProperty,
    record: recordIdProperty(),
  },
  async run({
    propsValue: { elementType, record },
    auth: { instance_url, username, password },
  }) {
    const instance = await instanceLogin(instance_url, username, password);

    if (instance !== null) {
      const response = await httpClient.sendRequest<Record<string, unknown>[]>({
        method: HttpMethod.GET,
        url: `${instance_url}/webservice.php`,
        queryParams: {
          operation: 'retrieve',
          sessionName: instance.sessionId ?? instance.sessionName,
          elementType: elementType as unknown as string,
          ...record,
        },
      });

      return response.body;
    }

    return null;
  },
});
