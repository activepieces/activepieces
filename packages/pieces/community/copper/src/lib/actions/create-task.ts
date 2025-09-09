import { createAction, Property } from '@activepieces/pieces-framework';
import { CopperAuth, CopperAuthType, toUnix } from '../common/constants';
import { CopperApiService } from '../common/requests';
import { ActivityTypesDropdown, usersDropdown } from '../common/props';

export const createTask = createAction({
  auth: CopperAuth,
  name: 'createTask',
  displayName: 'Create Task',
  description: 'Adds a new task under a person, lead, or opportunity.',
  props: {
    name: Property.ShortText({ displayName: 'Task Name', required: true }),
    details: Property.ShortText({
      displayName: 'Details',
      description: 'Details fo this task',
      required: false,
    }),
    custom_activity_type_id: ActivityTypesDropdown('user'),
    assigneeId: usersDropdown({ refreshers: ['auth'] }),
    entity: Property.StaticDropdown({
      displayName: 'Related Record Type',
      description:
        'Choose the type of Copper record this task should be linked to (e.g. Person, Company, Lead, Opportunity, or Project).',
      required: false,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Company', value: 'company' },
          { label: 'Lead', value: 'lead' },
          { label: 'Opportunity', value: 'opportunity' },
          { label: 'Project', value: 'project' },
        ],
      },
    }),

    entityItemId: Property.Dropdown({
      displayName: 'Related Record',
      description:
        'Select the specific record (from the chosen type above) that this task should be attached to. For example, pick the Person or Opportunity the task relates to.',
      required: false,
      refreshers: ['auth', 'entity'],
      async options(propsValue: Record<string, unknown>) {
        const auth = propsValue['auth'] as CopperAuthType | undefined;
        const entity = propsValue['entity'] as
          | 'person'
          | 'company'
          | 'lead'
          | 'opportunity'
          | 'project';

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
          project: CopperApiService.fetchProjects,
        } as const;

        const fetchFn = fetchFnMap[entity];
        try {
          const items = await fetchFn(auth);
          return {
            options: items.map((item: any) => ({
              label: item.name ?? item.title ?? `#${item.id}`,
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
    due_date: Property.DateTime({
      displayName: 'Due Date/Time',
      required: false,
      description:
        'Enter date and time in 24-hour format, e.g. `2025-09-09 11:40` (11:40 AM) or `2025-09-09 13:00` (1:00 PM).',
    }),
    reminder_date: Property.DateTime({
      displayName: 'Reminder Date/Time',
      required: false,
      description:
        'Enter date and time in 24-hour format, e.g. `2025-09-09 11:40` (11:40 AM) or `2025-09-09 13:00` (1:00 PM)',
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'None' },
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      properties: {
        tag: Property.ShortText({ displayName: 'Tag', required: true }),
      },
      defaultValue: [],
    }),
  },
  async run(context) {
    const {
      name,
      details,
      custom_activity_type_id,
      assigneeId,
      priority,
      tags,
      due_date,
      reminder_date,
      entity,
      entityItemId,
    } = context.propsValue;

    const custom_activity_type = JSON.parse(custom_activity_type_id as string);

    const tagList: string[] = Array.isArray(tags)
      ? tags.map((t: any) => String(t?.tag ?? '').trim()).filter(Boolean)
      : [];

    const payload = {
      name,
      details,
      custom_activity_type_id: custom_activity_type.id,
      ...(assigneeId ? {assignee_id: assigneeId}: {}),
      due_date: toUnix(due_date),
      reminder_date: toUnix(reminder_date),
      priority,
      tags: tagList,
      ...(entity &&
        entityItemId && {
          related_resource: {
            type: entity,
            id: entityItemId,
          },
        }),
    };

    return await CopperApiService.createTask(context.auth, payload);
  },
});
