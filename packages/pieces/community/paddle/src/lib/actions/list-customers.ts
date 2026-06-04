import { createAction, Property } from '@activepieces/pieces-framework';

import { paddleAuth } from '../auth';
import { paddleClient } from '../common/client';
import { paddleUtils } from '../common/utils';

const listCustomersAction = createAction({
  auth: paddleAuth,
  name: 'list-customers',
  displayName: 'List Customers',
  description: 'Lists customers from your Paddle account.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Optionally filter customers by exact email address.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Optionally filter customers by status.',
      required: false,
      options: {
        options: [
          {
            label: 'Active',
            value: 'active',
          },
          {
            label: 'Archived',
            value: 'archived',
          },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of customers to return.',
      required: false,
    }),
  },
  async run(context) {
    const email = paddleUtils.getOptionalString({
      value: context.propsValue.email,
    });
    const statusValue = paddleUtils.getOptionalString({
      value: context.propsValue.status,
    });
    const limit =
      paddleUtils.getOptionalPositiveInteger({
        value: context.propsValue.limit,
        fieldName: 'Limit',
      }) ?? DEFAULT_LIMIT;
    const status = getCustomerStatus({
      statusValue,
    });

    return paddleClient.listCustomers({
      auth: context.auth,
      email,
      limit,
      ...(status ? { status } : {}),
    });
  },
});

function getCustomerStatus({
  statusValue,
}: {
  statusValue?: string;
}): 'active' | 'archived' | undefined {
  if (!statusValue) {
    return undefined;
  }

  if (statusValue === 'active' || statusValue === 'archived') {
    return statusValue;
  }

  throw new Error('Status must be active or archived.');
}

const DEFAULT_LIMIT = 100;

export { listCustomersAction };
