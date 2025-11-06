import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth, CopperAuthType, toUnix } from '../common/constants';
import { MultiActivityTypesDropdown } from '../common/props';
import { CopperApiService } from '../common/requests';

export const searchForAnActivity = createAction({
  auth: CopperAuth,
  name: 'searchForAnActivity',
  displayName: 'Search for an Activity',
  description: 'Find an existing activity by type/criteria.',
  props: {
    entity: Property.StaticDropdown({
      displayName: 'Parent Entity',
      description: 'Select parent entity',
      required: false,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Company', value: 'company' },
          { label: 'Lead', value: 'lead' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Project', value: 'project' },
          { label: 'Task', value: 'task' },
        ],
      },
    }),
    entityItemId: Property.Dropdown({
      displayName: 'Parent Entity Resource',
      description: 'Select Resource',
      required: false,
      refreshers: ['auth', 'entity'],
      async options(propsValue: Record<string, unknown>) {
        const auth = propsValue['auth'] as CopperAuthType | undefined;
        const entity = propsValue['entity'] as
          | 'person'
          | 'company'
          | 'lead'
          | 'opportunity'
          | 'project'
          | 'task';

        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Copper account first',
            options: [],
          };
        }

        if (!entity) {
          return {
            disabled: true,
            placeholder: 'Select a Parent Entity first',
            options: [],
          };
        }

        const fetchFnMap = {
          person: CopperApiService.fetchPeople,
          company: CopperApiService.fetchCompanies,
          lead: CopperApiService.fetchLeads,
          opportunity: CopperApiService.fetchOpportunities,
          task: CopperApiService.fetchTasks,
          project: CopperApiService.fetchProjects,
        };

        const fetchFn = fetchFnMap[entity];

        try {
          const items = await fetchFn(auth);

          return {
            options: items.map((item: any) => ({
              label: item.name,
              value: item.id,
            })),
          };
        } catch (e) {
          console.error('Failed to fetch entity items', e);
          return {
            options: [],
            placeholder: 'Unable to load entity items',
          };
        }
      },
    }),
    activity_types: MultiActivityTypesDropdown({}),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Default 50. Max 200.',
      required: false,
      defaultValue: 50,
    }),
    page_number: Property.Number({
      displayName: 'Page Number',
      required: false,
      defaultValue: 1,
    }),
    minimum_activity_date: Property.DateTime({
      displayName: 'Minimum Activity Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 11:40. The timestamp of the earliest activity date.',
    }),
    maximum_activity_date: Property.DateTime({
      displayName: 'Maximum Activity Date',
      required: false,
      description:
        '24-hour format, e.g. 2025-09-10 13:00. The timestamp of the latest activity date.',
    }),
    full_result: Property.Checkbox({
      displayName: 'Full Result',
      description:
        '(Optional) If set, search performance improves but duplicate activity logs may be returned',
      required: false,
      defaultValue: false,
    }),
  },
  async run(ctx) {
    const {
      page_size,
      page_number,
      activity_types,
      entity,
      entityItemId,
      minimum_activity_date,
      maximum_activity_date,
      full_result,
    } = ctx.propsValue;

    const parsed_activity_types = (activity_types || []).map(
      (activity: any) => {
        const parsed_activity = JSON.parse(activity);
        return {
          id: parsed_activity.id,
          category: parsed_activity.category,
        };
      }
    );

    const payload = {
      ...(entity &&
        entityItemId && {
          parent: { id: entityItemId, type: entity },
        }),
      activity_types: parsed_activity_types,
      page_number,
      page_size,
      minimum_activity_date: toUnix(minimum_activity_date),
      maximum_activity_date: toUnix(maximum_activity_date),
      full_result,
    };

    return await CopperApiService.fetchActivities(ctx.auth, payload);
  },
});
