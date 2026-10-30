import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { acumbamailAuth } from '../auth';
import { acumbamailCommon } from '../common';

export const addUpdateSubscriberAction = createAction({
  auth: acumbamailAuth,
  name: 'acumbamail_add_update_subscriber',
  classification: 'WRITE',
  displayName: 'Add or Update Subscriber',
  description: 'Adds a subscriber to a list, or updates one already on it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a contact to an Acumbamail subscriber list, or updates that contact\'s merge fields if it already exists when the update-existing option is enabled. Use to enroll or refresh a single contact in a list; requires the target list id and a merge-fields object that must include the email. Optionally sends a double-opt-in confirmation email. Idempotent: the subscriber is keyed on email within the list, so repeating the same input converges on the same membership.',
    idempotent: true,
  },
  props: {
    listId: acumbamailCommon.listId,
    listMergeFields: acumbamailCommon.listMergeFields,
    update_subscriber: Property.Checkbox({
      displayName: 'Update Existing Subscriber',
      description:
        'If the email is already on the list, overwrite its fields.',
      required: false,
      defaultValue: false,
    }),
    double_option: Property.Checkbox({
      displayName: 'Double Opt-In',
      description:
        'Send a confirmation email the subscriber must accept first.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { listId, listMergeFields, update_subscriber, double_option } =
      context.propsValue;

    const formData = new FormData();

    Object.entries(listMergeFields).forEach(([key, value]) => {
      formData.append(`merge_fields[${key}]`, value.toString());
    });

    formData.append('auth_token', context.auth.secret_text);
    formData.append('list_id', listId.toString());
    formData.append('double_optin', double_option ? '1' : '0');
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
