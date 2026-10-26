import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieCreateTimeEntryAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_time_entry',
  classification: 'WRITE',
  displayName: 'Log Time',
  description: 'Log a time entry against a client, project and task.',
  audience: 'human',
  aiMetadata: {
    description:
      'Logs a Moxie time entry with client, project, task and user picked from lists. For agents use moxie_time_entry_create. Not idempotent: each run logs another entry.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.timeEntry,
  props: {
    timerStart: Property.DateTime({
      displayName: 'Start Time',
      required: true,
    }),
    timerEnd: Property.DateTime({
      displayName: 'End Time',
      required: true,
    }),
    clientName: moxieDropdowns.clientName({ required: false }),
    projectName: moxieDropdowns.projectByClientName({ required: false, valueKey: 'name' }),
    deliverableName: moxieDropdowns.taskNameByProjectName({ required: false }),
    userEmail: moxieDropdowns.userEmail({ required: false, description: 'The workspace user the time is logged for.' }),
    ...moxieProps.fromSpecs({ specs: moxieFields.timeEntry, audience: 'human' }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createTimeEntry({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
