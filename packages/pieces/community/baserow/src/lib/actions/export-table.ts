import { createAction, Property } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { baserowAiProps } from '../common/ai-props';
import { baserowAiHelpers } from '../common/ai-helpers';
import { exportTableOutputSchema } from '../output-schemas';

export const exportTableAction = createAction({
  name: 'baserow_export_table',
  classification: 'WRITE',
  outputSchema: exportTableOutputSchema,
  displayName: 'Export Table',
  description: 'Starts a CSV export of a table or view.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts an asynchronous export of a Baserow table (or one of its views) to CSV and returns the export job ID. The file is not ready yet — call Get Export Job with the job ID until its state is "finished" to get the download URL. Requires an Email & Password connection. Not idempotent — each call starts a new export job.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowAiProps.tableIdProp(),
    view_id: Property.Number({
      displayName: 'View ID',
      description: 'Export only the rows and fields visible in this view. Leave empty for the whole table.',
      required: false,
    }),
  },
  async run(context) {
    const { table_id, view_id } = context.propsValue;
    baserowAiHelpers.assertJwt({ auth: context.auth, actionName: 'Export Table' });
    const client = await makeClient(context.auth);
    const job = await baserowAiHelpers.execute(() =>
      client.exportTable({
        tableId: table_id,
        body: { exporter_type: 'csv', ...(view_id ? { view_id } : {}) },
      })
    );
    return { job_id: job['id'], state: job['state'] };
  },
});
