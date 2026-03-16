import { createAction, Property } from '@activepieces/pieces-framework';
import { duneAuth } from '../..';
import { duneRequest } from '../common/dune-api';

interface ExecutionStatusResponse {
  execution_id: string;
  query_id: number;
  state: string;
  submitted_at: string;
  expires_at: string;
  execution_started_at: string;
  execution_ended_at: string;
  result_set_bytes: number;
  cancelled_at: string | null;
}

export const getExecutionStatus = createAction({
  name: 'get_execution_status',
  displayName: 'Get Execution Status',
  description:
    'Check the status of a running or completed query execution.',
  auth: duneAuth,
  requireAuth: true,
  props: {
    execution_id: Property.ShortText({
      displayName: 'Execution ID',
      description: 'The execution ID returned from Execute a Query.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const data = await duneRequest<ExecutionStatusResponse>(
      auth as string,
      `/execution/${propsValue.execution_id}/status`
    );

    return {
      execution_id: data.execution_id,
      query_id: data.query_id,
      state: data.state,
      submitted_at: data.submitted_at,
      execution_started_at: data.execution_started_at,
      execution_ended_at: data.execution_ended_at,
      cancelled_at: data.cancelled_at,
    };
  },
});
