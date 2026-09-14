import { isNil, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { ninetyCommon, NinetyTodo } from '../common/client';
import { ninetyProps } from '../common/props';
import { todoTriggerOutputSchema } from '../common/output-schemas';
import { SAMPLE_TODO } from '../common/samples';
import { createNinetyPollingTrigger } from './create-polling-trigger';

const TODO_PAGE_SIZE = 100;
const TODO_MAX_PAGES = 5;

export const newTodo = createNinetyPollingTrigger({
  name: 'new_todo',
  displayName: 'New To-Do',
  description: 'Fires when a to-do is created in Ninety',
  aiDescription:
    'Fires once for each new Ninety to-do, carrying the whole to-do: its id, title, due date, owner, team and whether it is personal. Ninety has no webhooks, so this polls and only sees to-dos created since the last check. Ninety cannot order to-dos by creation date, so this reads the open to-dos and reports the ones created since then.',
  props: {
    teamId: ninetyProps.teamIdOptional,
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description:
        'Ninety cannot return personal and team to-dos in one call, so a flow watches one or the other',
      required: false,
      options: {
        options: [
          { label: 'Team to-dos', value: 'team' },
          { label: 'Personal to-dos', value: 'personal' },
        ],
      },
    }),
  },
  outputSchema: todoTriggerOutputSchema,
  sampleData: SAMPLE_TODO,
  fetchRecords: async ({ token, propsValue }) => {
    const filters = {
      archived: false,
      pageSize: TODO_PAGE_SIZE,
      ...spreadIfDefined('teamId', propsValue.teamId),
      ...spreadIfDefined(
        'isPersonal',
        isNil(propsValue.scope) ? undefined : propsValue.scope === 'personal'
      ),
    };
    const collected = new Map<string, NinetyTodo>();
    for (let page = 1; page <= TODO_MAX_PAGES; page++) {
      const { items } = await ninetyCommon.queryTodos({
        token,
        query: { ...filters, page },
      });
      for (const item of items) {
        collected.set(item._id, item);
      }
      if (items.length < TODO_PAGE_SIZE) {
        break;
      }
    }
    return [...collected.values()];
  },
});
