import {
  createAction,
  InputPropertyMap,
  Property,
} from '@activepieces/pieces-framework';
import { CopperAuth, CopperAuthType } from '../common/constants';
import { CopperApiService } from '../common/requests';
import { ActivityTypesDropdown } from '../common/props';

export const createActivity = createAction({
  auth: CopperAuth,
  name: 'createActivity',
  displayName: 'Create Activity',
  description: 'Logs an activity related to CRM entities.',
  props: {
    entity: Property.StaticDropdown({
      displayName: 'Parent Entity',
      description: 'Select parent entity',
      required: true,
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
      required: true,
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
    details: Property.ShortText({
      displayName: 'Details',
      description: 'The details of the project',
      required: false,
    }),
    type: ActivityTypesDropdown("user"),
  },
  async run(context) {
    const { type, entity, entityItemId, details } = context.propsValue;

    const activityType = JSON.parse(type as string);

    const payload = {
      parent: {
        type: entity,
        id: entityItemId,
      },
      type: {
        category: activityType.category,
        id: activityType.id,
      },
      details,
    };

    return await CopperApiService.createActivity(context.auth, payload);
  },
});
