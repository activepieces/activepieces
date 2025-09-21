import { createAction, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client'; 
import { whatConvertsProps } from '../common/props'; 

export const createExportAction = createAction({
  auth: whatConvertsAuth,
  name: 'create_export',
  displayName: 'Create Export',
  description: 'Generate a new CSV export of leads for a specified date range.',
  props: {
    profile_id: whatConvertsProps.profile_id(),
    from_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'The start date for the export range in YYYY-MM-DD format.',
      required: true,
    }),
    to_date: Property.ShortText({
      displayName: 'End Date',
      description: 'The end date for the export range in YYYY-MM-DD format.',
      required: true,
    }),
    export_type: Property.ShortText({
      displayName: 'Export Type',
      description:
        'The type of data to export. Defaults to "leads" if left blank.',
      required: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    if (propsValue.profile_id === undefined) {
      throw new Error('Profile ID is required for creating an export.');
    }

    return await whatConvertsClient.createExport(auth, {
      profile_id: propsValue.profile_id,
      from_date: propsValue.from_date,
      to_date: propsValue.to_date,
      export_type: propsValue.export_type,
    });
  },
});
