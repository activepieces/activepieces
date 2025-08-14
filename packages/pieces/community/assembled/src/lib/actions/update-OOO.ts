import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateOOO = createAction({
  name: 'update_OOO',
  displayName: 'Update OOO Request',
  description: 'Update an existing OOO request',
  props: {
    OOO_id: Property.ShortText({
      displayName: 'OOO ID',
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    reason: Property.LongText({
      displayName: 'Reason',
      required: false,
    }),
  },
  async run(context) {
    const { OOO_id, start_date, end_date, status, reason } = context.propsValue;
    
    const updateData: any = {};
    if (start_date) updateData.start_date = assembledCommon.formatDateTime(start_date);
    if (end_date) updateData.end_date = assembledCommon.formatDateTime(end_date);
    if (status) updateData.status = status;
    if (reason) updateData.reason = reason;

    const response = await assembledCommon.makeRequest(
      context.auth as string,
      HttpMethod.PUT,
      `/OOO-requests/${OOO_id}`,
      updateData
    );

    return response.body;
  },
});