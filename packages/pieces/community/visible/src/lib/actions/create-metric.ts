import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { visibleAuth } from '../..';
import { visibleMakeRequest } from '../common';

export const createMetric = createAction({
  name: 'create_metric',
  displayName: 'Create Metric',
  description: 'Create a new metric for a company.',
  auth: visibleAuth,
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    frequency: Property.StaticDropdown({
      displayName: 'Frequency',
      required: true,
      options: {
        options: [
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' },
          { label: 'Quarterly', value: 'quarterly' },
        ],
      },
    }),
    unit: Property.ShortText({
      displayName: 'Unit',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await visibleMakeRequest({
      accessToken: auth.secret_text,
      method: HttpMethod.POST,
      path: '/metrics',
      body: {
        metric: {
          name: propsValue.name,
          frequency: propsValue.frequency,
          unit: propsValue.unit,
          company_id: propsValue.companyId,
        },
      },
    });
  },
});
