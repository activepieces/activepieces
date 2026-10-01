import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownState, Property } from '@activepieces/pieces-framework';
import { jsmOpsAuth } from '../auth';
import { jsmOps } from './client';
import {
    AccountRoute,
    ApiEscalation,
    ApiJiraUser,
    ApiPage,
    ApiSchedule,
    ApiTeamList,
    JsmAuthValue,
    ResponderType,
} from './types';

export const jsmOpsProps = {
    alert,
    identifierType,
    priority,
    teams,
    team,
    schedule,
    schedules,
    escalation,
    escalations,
    user,
    users,
    responderType,
    responder,
};

export const jsmOpsOptions = {
    listTeams,
    listSchedules,
    listEscalations,
    listUsers,
    listResponders,
};

export const PRIORITY_OPTIONS = [
    { label: 'P1 - Critical', value: 'P1' },
    { label: 'P2 - High', value: 'P2' },
    { label: 'P3 - Moderate', value: 'P3' },
    { label: 'P4 - Low', value: 'P4' },
    { label: 'P5 - Informational', value: 'P5' },
];

function alert() {
    return Property.ShortText({
        displayName: 'Alert ID or Alias',
        description: 'The alert ID, or its alias if you pick Alias below.',
        placeholder: 'e.g. 70413a06-38d6-4c85-92b8-5ebc900d42e2',
        required: true,
    });
}

function identifierType() {
    return Property.StaticDropdown({
        displayName: 'Identify Alert By',
        description: 'Whether the value above is the alert ID or its alias.',
        required: true,
        defaultValue: 'id',
        options: {
            options: [
                { label: 'Alert ID', value: 'id' },
                { label: 'Alias', value: 'alias' },
            ],
        },
    });
}

function priority({ required, defaultValue }: { required: boolean; defaultValue?: string }) {
    return Property.StaticDropdown({
        displayName: 'Priority',
        description: 'P1 is the most urgent, P5 the least.',
        required,
        defaultValue,
        options: { options: PRIORITY_OPTIONS },
    });
}

function teams({ displayName, description }: LabelParams) {
    return Property.MultiSelectDropdown({
        auth: jsmOpsAuth,
        displayName,
        description,
        required: false,
        refreshers: [],
        options: async ({ auth }) => withAccount({ auth, load: (route) => listTeams({ route }) }),
    });
}

function team({ displayName, description, required }: LabelParams & { required: boolean }) {
    return Property.Dropdown({
        auth: jsmOpsAuth,
        displayName,
        description,
        required,
        refreshers: [],
        options: async ({ auth }) => withAccount({ auth, load: (route) => listTeams({ route }) }),
    });
}

function schedule({ displayName, description }: LabelParams) {
    return Property.Dropdown({
        auth: jsmOpsAuth,
        displayName,
        description,
        required: true,
        refreshers: [],
        options: async ({ auth }) => withAccount({ auth, load: (route) => listSchedules({ route }) }),
    });
}

function schedules({ displayName, description }: LabelParams) {
    return Property.MultiSelectDropdown({
        auth: jsmOpsAuth,
        displayName,
        description,
        required: false,
        refreshers: [],
        options: async ({ auth }) => withAccount({ auth, load: (route) => listSchedules({ route }) }),
    });
}

function escalation({ displayName, description }: LabelParams) {
    return Property.Dropdown({
        auth: jsmOpsAuth,
        displayName,
        description,
        required: true,
        refreshers: [],
        options: async ({ auth }) => withAccount({ auth, load: (route) => listEscalations({ route }) }),
    });
}

function escalations({ displayName, description }: LabelParams) {
    return Property.MultiSelectDropdown({
        auth: jsmOpsAuth,
        displayName,
        description,
        required: false,
        refreshers: [],
        options: async ({ auth }) => withAccount({ auth, load: (route) => listEscalations({ route }) }),
    });
}

function user({ displayName, description }: LabelParams) {
    return Property.Dropdown({
        auth: jsmOpsAuth,
        displayName,
        description,
        required: true,
        refreshers: [],
        refreshOnSearch: true,
        options: async ({ auth }, { searchValue }) =>
            withAccount({ auth, load: (route) => listUsers({ route, search: searchValue }) }),
    });
}

function users({ displayName, description }: LabelParams) {
    return Property.MultiSelectDropdown({
        auth: jsmOpsAuth,
        displayName,
        description,
        required: false,
        refreshers: [],
        refreshOnSearch: true,
        options: async ({ auth }, { searchValue }) =>
            withAccount({ auth, load: (route) => listUsers({ route, search: searchValue }) }),
    });
}

function responderType() {
    return Property.StaticDropdown({
        displayName: 'Responder Type',
        description: 'What kind of responder to add.',
        required: true,
        defaultValue: 'team',
        options: {
            options: [
                { label: 'Team', value: 'team' },
                { label: 'User', value: 'user' },
                { label: 'Schedule', value: 'schedule' },
                { label: 'Escalation', value: 'escalation' },
            ],
        },
    });
}

function responder() {
    return Property.Dropdown({
        auth: jsmOpsAuth,
        displayName: 'Responder',
        description: 'The team, user, schedule or escalation to add.',
        required: true,
        refreshers: ['responderType'],
        refreshOnSearch: true,
        options: async ({ auth, responderType }, { searchValue }) => {
            if (!isResponderType(responderType)) {
                return { disabled: true, options: [], placeholder: 'Pick a responder type first.' };
            }
            return withAccount({ auth, load: (route) => listResponders({ route, type: responderType, search: searchValue }) });
        },
    });
}

async function listTeams({ route }: { route: AccountRoute }): Promise<Option[]> {
    const body = await jsmOps.send<ApiTeamList>({ route, method: HttpMethod.GET, path: '/teams' });
    const teams = Array.isArray(body) ? body : body.platformTeams ?? [];
    return teams.flatMap((item) =>
        typeof item.teamId === 'string' ? [{ label: item.teamName ?? item.teamId, value: item.teamId }] : [],
    );
}

async function listSchedules({ route }: { route: AccountRoute }): Promise<Option[]> {
    const found: ApiSchedule[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
        const body = await jsmOps.send<ApiPage<ApiSchedule>>({
            route,
            method: HttpMethod.GET,
            path: '/schedules',
            queryParams: { size: String(SCHEDULE_PAGE_SIZE), offset: String(page * SCHEDULE_PAGE_SIZE) },
        });
        const values = body.values ?? [];
        found.push(...values);
        if (values.length < SCHEDULE_PAGE_SIZE) {
            break;
        }
    }
    return found.flatMap((item) =>
        typeof item.id === 'string'
            ? [{ label: item.timezone ? `${item.name ?? item.id} (${item.timezone})` : item.name ?? item.id, value: item.id }]
            : [],
    );
}

async function listEscalations({ route }: { route: AccountRoute }): Promise<Option[]> {
    const teamOptions = await listTeams({ route });
    const found: Option[] = [];
    for (let start = 0; start < teamOptions.length; start += ESCALATION_TEAM_BATCH) {
        const batch = teamOptions.slice(start, start + ESCALATION_TEAM_BATCH);
        const perTeam = await Promise.all(batch.map((teamOption) => listTeamEscalations({ route, team: teamOption })));
        found.push(...perTeam.flat());
    }
    return found;
}

async function listTeamEscalations({ route, team }: { route: AccountRoute; team: Option }): Promise<Option[]> {
    const found: Option[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
        const body = await jsmOps.send<ApiPage<ApiEscalation>>({
            route,
            method: HttpMethod.GET,
            path: `/teams/${encodeURIComponent(team.value)}/escalations`,
            queryParams: { size: String(ESCALATION_PAGE_SIZE), offset: String(page * ESCALATION_PAGE_SIZE) },
        });
        const values = body.values ?? [];
        for (const item of values) {
            if (typeof item.id === 'string') {
                found.push({ label: `${item.name ?? item.id} (${team.label})`, value: item.id });
            }
        }
        if (values.length < ESCALATION_PAGE_SIZE) {
            break;
        }
    }
    return found;
}

async function listUsers({ route, search }: { route: AccountRoute; search?: string }): Promise<Option[]> {
    const query = search?.trim() ?? '';
    const found =
        query.length > 0
            ? await jsmOps.sendToSite<ApiJiraUser[]>({
                  route,
                  path: '/rest/api/3/user/search',
                  queryParams: { query, maxResults: '50' },
              })
            : await jsmOps.sendToSite<ApiJiraUser[]>({
                  route,
                  path: '/rest/api/3/users/search',
                  queryParams: { maxResults: '100' },
              });
    return (Array.isArray(found) ? found : []).flatMap((item) => {
        if (typeof item.accountId !== 'string' || item.accountType !== 'atlassian' || item.active === false) {
            return [];
        }
        const name = item.displayName ?? item.accountId;
        return [{ label: item.emailAddress ? `${name} (${item.emailAddress})` : name, value: item.accountId }];
    });
}

async function listResponders({ route, type, search }: { route: AccountRoute; type: ResponderType; search?: string }): Promise<Option[]> {
    if (type === 'team') {
        return listTeams({ route });
    }
    if (type === 'schedule') {
        return listSchedules({ route });
    }
    if (type === 'escalation') {
        return listEscalations({ route });
    }
    return listUsers({ route, search });
}

async function withAccount({ auth, load }: WithAccountParams): Promise<DropdownState<string>> {
    if (auth === undefined) {
        return { disabled: true, options: [], placeholder: 'Connect your account first.' };
    }
    if (jsmOps.isKeyConnection(auth)) {
        return { disabled: true, options: [], placeholder: 'Needs an Atlassian Account connection, not an API key.' };
    }
    try {
        const route = await jsmOps.requireAccountRoute({ auth, feature: 'This list' });
        const options = await load(route);
        return {
            disabled: false,
            options,
            placeholder: options.length === 0 ? 'Nothing found on this site.' : undefined,
        };
    } catch (error) {
        return { disabled: true, options: [], placeholder: `Could not load the list: ${jsmOps.describeError(error)}` };
    }
}

function isResponderType(value: unknown): value is ResponderType {
    return value === 'team' || value === 'user' || value === 'schedule' || value === 'escalation';
}

const MAX_PAGES = 5;
const SCHEDULE_PAGE_SIZE = 50;
const ESCALATION_PAGE_SIZE = 100;
const ESCALATION_TEAM_BATCH = 10;

type Option = { label: string; value: string };

type LabelParams = { displayName: string; description: string };

type WithAccountParams = {
    auth: JsmAuthValue | undefined;
    load: (route: AccountRoute) => Promise<Option[]>;
};
