import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { kustomerUtils } from '../common/utils';

export const getCustomObjectsAction = createAction({
  auth: kustomerAuth,
  name: 'get-custom-objects',
  displayName: 'Get Custom Objects',
  description: 'Gets custom objects for a KObject klass in Kustomer.',
  props: {
    klassName: Property.ShortText({
      displayName: 'Klass Name',
      description: 'The KObject klass name to fetch.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = kustomerUtils.parseAuthToken({
      value: context.auth,
    });
    const klassName = kustomerUtils.parseRequiredString({
      value: context.propsValue.klassName,
      fieldName: 'Klass Name',
    });

    return kustomerClient.getCustomObjects({
      apiKey,
      klassName,
    });
  },
});
