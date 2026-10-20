import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_EFFORT_TYPE_OPTIONS, ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';

export const asanaCreateAllocationAction = createAction({
  auth: asanaAuth,
  name: 'create_allocation',
  classification: 'WRITE',
  displayName: 'Create Allocation',
  description: 'Allocate a person\'s time to an Asana project for a date range (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a resource-management allocation: a user (or placeholder) assigned to a project from Start Date to End Date, optionally with an effort as hours or a percentage of their time, and returns it. Check List Allocations first to avoid a duplicate for the same person, project and dates. Allocations need an Advanced or higher Asana plan with resource management; lower plans get a paid-plan error. Not idempotent: each call creates another allocation.',
    idempotent: false,
  },
  props: {
    parent: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project the time is allocated to. Obtain it from List Projects.',
      required: true,
    }),
    assignee: Property.ShortText({
      displayName: 'Assignee GID',
      description: 'Gid of the user or placeholder whose time is allocated. Obtain a user gid from List Users or Get Current User.',
      required: true,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'First day of the allocation, YYYY-MM-DD.',
      required: true,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Last day of the allocation, YYYY-MM-DD, on or after Start Date.',
      required: true,
    }),
    effort_type: Property.StaticDropdown({
      displayName: 'Effort Unit',
      description: 'Unit of Effort Value. Set together with Effort Value, or leave both empty.',
      required: false,
      options: { disabled: false, options: ASANA_EFFORT_TYPE_OPTIONS },
    }),
    effort_value: Property.Number({
      displayName: 'Effort Value',
      description: 'Amount of effort in the chosen unit, for example 20 (hours) or 50 (percent).',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const startDate = asanaUtils.assertDate({ value: props.start_date, field: 'Start Date' });
    const endDate = asanaUtils.assertDate({ value: props.end_date, field: 'End Date' });
    if (endDate < startDate) {
      throw new Error(`End Date (${endDate}) must be on or after Start Date (${startDate}).`);
    }
    const effort = asanaUtils.buildAllocationEffort({ type: props.effort_type, value: props.effort_value });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/allocations',
      operation: 'Create Allocation',
      query: { opt_fields: ASANA_FIELDS.allocation },
      data: {
        parent: props.parent.trim(),
        assignee: props.assignee.trim(),
        start_date: startDate,
        end_date: endDate,
        ...(effort === undefined ? {} : { effort }),
      },
    });
  },
});
