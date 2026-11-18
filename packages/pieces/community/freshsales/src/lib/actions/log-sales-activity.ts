import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { freshsalesProps } from '../common/props';
import { salesActivityOutputSchema } from '../output-schemas';

export const logSalesActivity = createAction({
  auth: freshsalesAuth,
  name: 'log_sales_activity',
  displayName: 'Log Sales Activity',
  description: 'Log a call, meeting or other sales activity',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Logs a Freshsales sales activity (type from List Field Options with sales_activity_types) on a contact, account or deal, with start and end time and owner. Returns the activity with its ID. Not idempotent: each call logs another activity.',
    idempotent: false,
  },
  outputSchema: salesActivityOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the activity',
      placeholder: 'Discovery call',
      required: true,
    }),
    sales_activity_type_id: freshsalesProps.salesActivityType(),
    sales_activity_outcome_id: freshsalesProps.salesActivityOutcome(),
    start_date: Property.DateTime({
      displayName: 'Start',
      description: 'Start date and time',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End',
      description: 'End date and time',
      required: true,
    }),
    owner_id: freshsalesProps.owner({ required: true, description: 'User who did the activity' }),
    targetable_type: freshsalesProps.targetableType({ required: true }),
    targetable_id: freshsalesProps.targetableId({ required: true }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes about the activity',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Where it took place',
      placeholder: 'Office',
      required: false,
    }),
  },
  async run(context) {
    const startDate = freshsalesClient.toIsoDate(context.propsValue.start_date);
    const endDate = freshsalesClient.toIsoDate(context.propsValue.end_date);
    if (startDate && endDate && endDate < startDate) {
      throw new Error('End must be after Start.');
    }
    const salesActivity = freshsalesClient.pickDefined({
      title: context.propsValue.title,
      sales_activity_type_id: freshsalesClient.requireId({
        value: context.propsValue.sales_activity_type_id,
        field: 'Activity Type',
      }),
      sales_activity_outcome_id: freshsalesClient.toId({
        value: context.propsValue.sales_activity_outcome_id,
        field: 'Outcome',
      }),
      start_date: startDate,
      end_date: endDate,
      owner_id: freshsalesClient.requireId({ value: context.propsValue.owner_id, field: 'Owner' }),
      targetable_type: context.propsValue.targetable_type,
      targetable_id: freshsalesClient.requireId({
        value: context.propsValue.targetable_id,
        field: 'Related Record ID',
      }),
      notes: context.propsValue.notes,
      location: context.propsValue.location,
    });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/api/sales_activities',
      body: { sales_activity: salesActivity },
    });
    return freshsalesRecords.shapeTargetable(
      freshsalesClient.unwrap({ body: response, key: 'sales_activity' })
    );
  },
});
