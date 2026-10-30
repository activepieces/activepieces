import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_EFFORT_TYPE_OPTIONS, ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaUpdateAllocationAction = createAction({
  auth: asanaAuth,
  name: 'update_allocation',
  classification: 'WRITE',
  displayName: 'Update Allocation',
  description: 'Change the dates, effort or assignee of an Asana allocation (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the allocation fields you set (start date, end date, effort, assignee); everything else is left unchanged, and it returns the updated allocation. Effort Unit and Effort Value go together. When you change only one date, make sure the range stays valid against the other date (read it with Get Allocation). Allocations need an Advanced or higher Asana plan. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  props: {
    allocation: Property.ShortText({
      displayName: 'Allocation GID',
      description: 'Gid of the allocation to update. Obtain it from List Allocations.',
      required: true,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'New first day, YYYY-MM-DD. Leave empty to keep it.',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'New last day, YYYY-MM-DD. Leave empty to keep it.',
      required: false,
    }),
    effort_type: Property.StaticDropdown({
      displayName: 'Effort Unit',
      description: 'Unit of Effort Value. Set together with Effort Value, or leave both empty to keep the effort.',
      required: false,
      options: { disabled: false, options: ASANA_EFFORT_TYPE_OPTIONS },
    }),
    effort_value: Property.Number({
      displayName: 'Effort Value',
      description: 'New amount of effort in the chosen unit.',
      required: false,
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee GID',
      description: 'Gid of the user or placeholder to move the allocation to. Leave empty to keep it.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const startDate = asanaUtils.hasValue(props.start_date) ? asanaUtils.assertDate({ value: String(props.start_date), field: 'Start Date' }) : undefined;
    const endDate = asanaUtils.hasValue(props.end_date) ? asanaUtils.assertDate({ value: String(props.end_date), field: 'End Date' }) : undefined;
    if (startDate !== undefined && endDate !== undefined && endDate < startDate) {
      throw new Error(`End Date (${endDate}) must be on or after Start Date (${startDate}).`);
    }
    const effort = asanaUtils.buildAllocationEffort({ type: props.effort_type, value: props.effort_value });
    const data: Record<string, unknown> = {
      ...(startDate === undefined ? {} : { start_date: startDate }),
      ...(endDate === undefined ? {} : { end_date: endDate }),
      ...(effort === undefined ? {} : { effort }),
      ...(asanaUtils.hasValue(props.assignee) ? { assignee: String(props.assignee).trim() } : {}),
    };
    asanaUtils.assertNotEmpty({ patch: data, fields: 'Start Date, End Date, Effort Unit with Effort Value, or Assignee GID' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/allocations/${asanaUtils.pathSegment(props.allocation)}`,
      operation: 'Update Allocation',
      query: { opt_fields: ASANA_FIELDS.allocation },
      data,
    });
  },
});
