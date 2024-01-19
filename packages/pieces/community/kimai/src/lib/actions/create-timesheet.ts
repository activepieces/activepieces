import { Property, createAction } from '@activepieces/pieces-framework';
import { kimaiCommon, makeClient } from '../common';
import { kimaiAuth } from '../..';

export const kimaiCreateTimesheetAction = createAction({
  auth: kimaiAuth,
  name: 'create_timesheet',
  description: 'Create a new timesheet',
  displayName: 'Create Timesheet',
  props: {
    project: kimaiCommon.project,
    activity: kimaiCommon.activity,
    begin: Property.DateTime({
      description: 'Begin Date of Timesheet',
      displayName: 'Begin Date',
      required: true,
    }),
    end: Property.DateTime({
      description: 'End Date of Timesheet',
      displayName: 'End Date',
      required: false,
    }),
    description: Property.LongText({
      description: 'Description of Timesheet',
      displayName: 'Description',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { project, activity, begin, end, description } = propsValue;

    const client = await makeClient(auth);
    return await client.createTimesheet({
      project,
      activity,
      begin,
      end,
      description,
    });
  },
});
