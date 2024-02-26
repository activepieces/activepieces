import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { acumbamailAuth } from '../../';
import { acumbamailCommon } from '../common';

export const addUpdateSubscriberAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_add_update_subscriber',
  displayName: 'Add/Update Subscriber',
  description:
    'Adds a new subscriber to a subscriber list of your choosing.Can be used to update an existing subscriber too.',
  props: {
    listId: acumbamailCommon.listId,
    listMergeFields: acumbamailCommon.listMergeFields,
    update_subscriber: Property.Checkbox({
      displayName: 'Update Existing Subscriber Data',
      description:
        'Updates the merge fields over the existent ones if the subscriber exists on the subscriber list.',
      required: false,
    }),
    double_optin: Property.Checkbox({
      displayName: 'Double Optin',
      description:
        'Activates the send of a confirmation email when the subscriber is added.',
      required: false,
    }),
  },
  async run(context) {
    const { listId, listMergeFields, update_subscriber, double_optin } =
      context.propsValue;

    const formData = new FormData();

    Object.entries(listMergeFields).forEach(([key, value]) => {
      formData.append(`merge_fields[${key}]`, value.toString());
    });

    formData.append('auth_token', context.auth);
    formData.append('list_id', listId.toString());
    formData.append('double_optin', double_optin ? '1' : '0');
    formData.append('update_subscriber', update_subscriber ? '1' : '0');
    formData.append('complete_json ', '1');

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: acumbamailCommon.baseUrl + '/addSubscriber/',
      headers: { ...formData.getHeaders() },
      body: formData,
    };

    const res = await httpClient.sendRequest(request);
    return res.body;
  },
});
