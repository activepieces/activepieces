import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../..';
import { instanceLogin, recordIdProperty } from '../common';
import { elementTypeProperty } from '../common';

//Docs: https://code.vtiger.com/vtiger/vtigercrm-manual/-/wikis/Webservice-Docs
//Extra: https://help.vtiger.com/article/147111249-Rest-API-Manual

export const deleteRecord = createAction({
  name: 'delete_record',
  auth: vtigerAuth,
  displayName: 'Delete Record',
  description: 'Delete a Record',
  props: {
    elementType: elementTypeProperty,
    record: recordIdProperty(),
  },
  async run({
    propsValue: { elementType, record },
    auth
  }) {
    const instance = await instanceLogin(auth.props.instance_url, auth.props.username, auth.props.password);

    if (instance !== null) {
      const response = await httpClient.sendRequest<Record<string, unknown>[]>({
        method: HttpMethod.POST,
        url: `${auth.props.instance_url}/webservice.php`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          operation: 'delete',
          sessionName: instance.sessionId ?? instance.sessionName,
          elementType,
          id: record['id'],
        },
      });

      return response.body;
    }

    return null;
  },
});
