import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { adAccountIdDropdown, pinIdDropdown } from '../common/props';

export const deletePin = createAction({
  auth: pinterestAuth,
  name: 'deletePin',
  displayName: 'Delete Pin',
  description: 'Permanently delete a specific Pin.',
  props: {
    pin_id: pinIdDropdown,
    ad_account_id: adAccountIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { pin_id, ad_account_id } = propsValue;

    let path = `/pins/${pin_id}`;
    if (ad_account_id) {
      path = `/pins/${pin_id}?ad_account_id=${ad_account_id}`;
    }

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.DELETE,
      path
    );

    return {
      success: true,
      message: `Pin ${pin_id} has been successfully deleted.`,
      pin_id: pin_id,
    };
  },
});
