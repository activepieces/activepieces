import { createAction, Property } from '@activepieces/pieces-framework';
import { duneAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface ExecuteQueryResponse {
  execution_id: string;
  state: string;
}

export const executeQuery = createAction({
  name: 'execute_query',
  displayName: 'Execute a Query',
  description: 'Trigger a fresh execution of a Dune query.',
  auth: duneAuth,
  requireAuth: true,
  props: {
    query_id: Property.ShortText({
      displayName: 'Query ID',
      description: 'The Dune query ID to execute.',
      required: true,
    }),
    performance: Property.StaticDropdown({
      displayName: 'Performance',
      description: 'Execution performance tier.',
      required: false,
      defaultValue: 'medium',
      options: {
        disabled: false,
        options: [
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const performance = propsValue.performance ?? 'medium';
    const data = await duneRequest<ExecuteQueryResponse>(
      auth as string,
      `/query/${propsValue.query_id}/execute`,
      'POST',
      { performance_tier: performance }
    );

    return {
      execution_id: data.execution_id,
      state: data.state,
    };
  },
});
