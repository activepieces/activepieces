import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieTimeEntryCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_time_entry_create',
  classification: 'WRITE',
  displayName: 'Log Time',
  description: 'Logs a time entry in Moxie.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Logs a time entry between two ISO 8601 timestamps, optionally against a client, project and task matched by exact name and for a given workspace user. The Create options make Moxie create a missing client, project or task instead of failing. Use to sync time from another tracker. Not idempotent: each call logs another entry.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.timeEntry,
  props: {
    timerStart: Property.ShortText({
      displayName: 'Start Time',
      description: 'ISO 8601 start, for example 2026-10-01T09:00:00Z.',
      required: true,
    }),
    timerEnd: Property.ShortText({
      displayName: 'End Time',
      description: 'ISO 8601 end, after the start.',
      required: true,
    }),
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact client name, from Search Clients.',
      required: false,
    }),
    projectName: Property.ShortText({
      displayName: 'Project Name',
      description: 'Exact project name, from Search Projects.',
      required: false,
    }),
    deliverableName: Property.ShortText({
      displayName: 'Task Name',
      description: 'Exact task name, from Search Tasks.',
      required: false,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      description: 'Email of the workspace user the time is logged for, from List Workspace Users. Leave empty to let Moxie use its default user.',
      required: false,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.timeEntry, audience: 'ai' }),
    createClient: Property.Checkbox({ displayName: 'Create Client if Missing', required: false, defaultValue: false }),
    createProject: Property.Checkbox({ displayName: 'Create Project if Missing', required: false, defaultValue: false }),
    createDeliverable: Property.Checkbox({ displayName: 'Create Task if Missing', required: false, defaultValue: false }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createTimeEntry({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
