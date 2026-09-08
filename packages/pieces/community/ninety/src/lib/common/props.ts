import { isNil, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from './client';

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function teamDropdown<R extends boolean>({
  required,
  description,
}: {
  required: R;
  description: string;
}) {
  return Property.Dropdown({
    auth: ninetyAuth,
    displayName: 'Team',
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Ninety account first',
        };
      }
      try {
        const teams = await ninetyCommon.listTeams({ token: auth.secret_text });
        if (teams.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'This token owner is not on any Ninety team',
          };
        }
        return {
          disabled: false,
          options: teams.map((team) => ({
            label: team.name,
            value: team._id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: loadFailure({ error, noun: 'teams' }),
        };
      }
    },
  });
}

function userDropdown<R extends boolean>({
  displayName,
  description,
  required,
}: {
  displayName: string;
  description: string;
  required: R;
}) {
  return Property.Dropdown({
    auth: ninetyAuth,
    displayName,
    description,
    required,
    refreshers: ['teamId'],
    options: async ({ auth, teamId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Ninety account first',
        };
      }
      try {
        const users = await ninetyCommon.listUsers({
          token: auth.secret_text,
          teamId: asOptionalString(teamId),
        });
        if (users.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No users visible to this token',
          };
        }
        return {
          disabled: false,
          options: users.map((user) => ({
            label: ninetyCommon.userLabel(user),
            value: user.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: loadFailure({ error, noun: 'users' }),
        };
      }
    },
  });
}

function triStateDropdown({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Any', value: 'any' },
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function setterDropdown({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Leave unchanged', value: 'any' },
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function triStateToBoolean(value: string | undefined): boolean | undefined {
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  return undefined;
}

function toOptionalNumber(
  value: string | number | undefined
): number | undefined {
  if (isNil(value)) {
    return undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function usersDropdown({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.MultiSelectDropdown({
    auth: ninetyAuth,
    displayName,
    description,
    required: false,
    refreshers: ['teamId'],
    options: async ({ auth, teamId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Ninety account first',
        };
      }
      try {
        const users = await ninetyCommon.listUsers({
          token: auth.secret_text,
          teamId: asOptionalString(teamId),
        });
        return {
          disabled: false,
          options: users.map((user) => ({
            label: ninetyCommon.userLabel(user),
            value: user.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: loadFailure({ error, noun: 'users' }),
        };
      }
    },
  });
}

function loadFailure({ error, noun }: { error: unknown; noun: string }): string {
  const message = error instanceof Error ? error.message.trim() : '';
  return message.length === 0
    ? `Could not load ${noun} from Ninety`
    : message;
}

export const ninetyProps = {
  teamIdRequired: teamDropdown({
    required: true,
    description: 'The Ninety team this record belongs to',
  }),

  teamIdOptional: teamDropdown({
    required: false,
    description: 'Leave empty to cover every team the token can see',
  }),

  teamIdForTodo: teamDropdown({
    required: false,
    description: 'Leave empty to create a personal to-do instead of a team one',
  }),

  teamIdMove: teamDropdown({
    required: false,
    description: 'Move the record to this team. Leave empty to keep it where it is.',
  }),

  ownerId: userDropdown({
    displayName: 'Owner',
    description: 'Defaults to the token owner when left empty',
    required: false,
  }),

  ownerIdKeep: userDropdown({
    displayName: 'Owner',
    description: 'Hand the record to this person. Leave empty to keep the current owner.',
    required: false,
  }),

  ownerIdFilter: userDropdown({
    displayName: 'Owner',
    description: 'Only return records owned by this person',
    required: false,
  }),

  intervalCode: Property.StaticDropdown({
    displayName: 'Term',
    description: 'Short term issues sit on the weekly list, long term on the parking lot',
    required: false,
    options: {
      options: [
        { label: 'Short term', value: 'SHORT_TERM' },
        { label: 'Long term', value: 'LONG_TERM' },
      ],
    },
  }),

  issuePriority: Property.StaticDropdown({
    displayName: 'Priority',
    description: 'Ninety rates issues 0 to 5, where 0 is unrated and 5 is highest',
    required: false,
    options: {
      options: [
        { label: '0 — unrated', value: '0' },
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5 — highest', value: '5' },
      ],
    },
  }),

  rockStatusCode: Property.StaticDropdown({
    displayName: 'Status',
    required: true,
    defaultValue: 'ON_TRACK',
    options: {
      options: [
        { label: 'On track', value: 'ON_TRACK' },
        { label: 'Off track', value: 'OFF_TRACK' },
        { label: 'Done', value: 'DONE' },
        { label: 'Canceled', value: 'CANCELED' },
        { label: 'Draft', value: 'DRAFT' },
      ],
    },
  }),

  rockLevelCode: Property.StaticDropdown({
    displayName: 'Level',
    description: 'Who the rock belongs to',
    required: true,
    defaultValue: 'USER',
    options: {
      options: [
        { label: 'Individual', value: 'USER' },
        { label: 'Department', value: 'DEPARTMENT' },
        { label: 'Company', value: 'COMPANY' },
        { label: 'Company and department', value: 'COMPANY_AND_DEPARTMENT' },
      ],
    },
  }),

  rockQuarter: Property.StaticDropdown({
    displayName: 'Quarter',
    required: true,
    defaultValue: 'Q1',
    options: {
      options: [
        { label: 'Q1', value: 'Q1' },
        { label: 'Q2', value: 'Q2' },
        { label: 'Q3', value: 'Q3' },
        { label: 'Q4', value: 'Q4' },
        { label: 'None', value: 'None' },
      ],
    },
  }),

  rockFutureScope: Property.StaticDropdown({
    displayName: 'Planning Horizon',
    required: false,
    options: {
      options: [
        { label: 'Current', value: 'Current' },
        { label: 'Next', value: 'Next' },
        { label: 'Later', value: 'Later' },
        { label: 'Future', value: 'Future' },
      ],
    },
  }),

  rockId: Property.Dropdown({
    auth: ninetyAuth,
    displayName: 'Rock',
    description: 'The rock this milestone belongs to',
    required: true,
    refreshers: ['teamId'],
    options: async ({ auth, teamId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Ninety account first',
        };
      }
      if (isNil(asOptionalString(teamId))) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Pick a team first',
        };
      }
      try {
        const { items } = await ninetyCommon.queryRocks({
          token: auth.secret_text,
          query: {
            teamId: asOptionalString(teamId),
            pageIndex: 0,
            pageSize: 200,
            archived: false,
          },
        });
        if (items.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'This team has no active rocks',
          };
        }
        return {
          disabled: false,
          options: items.map((rock) => ({
            label: rock.title,
            value: rock._id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: loadFailure({ error, noun: 'rocks' }),
        };
      }
    },
  }),

  measurableId: Property.Dropdown({
    auth: ninetyAuth,
    displayName: 'Measurable',
    description: 'The scorecard measurable to score',
    required: true,
    refreshers: ['teamId'],
    options: async ({ auth, teamId }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Ninety account first',
        };
      }
      try {
        const { items } = await ninetyCommon.queryMeasurables({
          token: auth.secret_text,
          query: {
            pageIndex: 0,
            pageSize: 100,
            ...spreadIfDefined('teamId', asOptionalString(teamId)),
          },
        });
        if (items.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No measurables found for this team',
          };
        }
        return {
          disabled: false,
          options: items.map((measurable) => ({
            label: measurable.title,
            value: measurable._id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: loadFailure({ error, noun: 'measurables' }),
        };
      }
    },
  }),

  additionalTeamIds: Property.MultiSelectDropdown({
    auth: ninetyAuth,
    displayName: 'Additional Teams',
    description: 'Other teams that should see this rock',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Ninety account first',
        };
      }
      try {
        const teams = await ninetyCommon.listTeams({ token: auth.secret_text });
        return {
          disabled: false,
          options: teams.map((team) => ({
            label: team.name,
            value: team._id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: loadFailure({ error, noun: 'teams' }),
        };
      }
    },
  }),

  ownerIds: usersDropdown({
    displayName: 'Owners',
    description: 'Only return records owned by these people',
  }),

  completedFilter: triStateDropdown({
    displayName: 'Completed',
    description: 'Leave on Any to return both completed and open records',
  }),

  archivedFilter: triStateDropdown({
    displayName: 'Archived',
    description: 'Leave on Any to let Ninety apply its own default',
  }),

  completedSetter: setterDropdown({
    displayName: 'Completed',
    description: 'Marking this Yes is how a record is finished in Ninety',
  }),

  archivedSetter: setterDropdown({
    displayName: 'Archived',
    description: 'Archiving takes the record off the active list',
  }),

  pageIndex: Property.Number({
    displayName: 'Page',
    description: 'Zero based. Leave empty for the first page.',
    required: false,
    min: 0,
  }),

  page: Property.Number({
    displayName: 'Page',
    description: 'One based. Leave empty for the first page.',
    required: false,
    min: 1,
  }),


  searchText: Property.ShortText({
    displayName: 'Search Text',
    description: 'Matches the title and description',
    required: false,
  }),
};

export const ninetyPropUtils = { triStateToBoolean, toOptionalNumber };
