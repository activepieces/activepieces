import { DropdownState, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { NiftyApiError, NiftyAuth, niftyClient, NiftyRecord } from './client';

export const niftyProps = {
  portfolio<R extends boolean>({ required, description }: { required: R; description?: string }) {
    return Property.Dropdown<string, R, typeof niftyAuth>({
      auth: niftyAuth,
      displayName: 'Portfolio',
      description: description ?? 'Optional. Narrows the project list to one portfolio. Leave empty to pick from all your projects.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return disabled('Connect your Nifty account first');
        }
        return loadOptions({
          what: 'portfolios',
          load: async () => {
            const { items } = await niftyClient.listAll({ auth, path: 'subteams', key: 'subteams' });
            return items.map((team) => ({ label: niftyClient.text({ record: team, key: 'name' }), value: niftyClient.text({ record: team, key: 'id' }) }));
          },
          onForbidden: 'Portfolios are not available on this connection. Leave this empty to pick from all your projects.',
        });
      },
    });
  },
  project<R extends boolean>({ required, description, includeArchived = false }: { required: R; description?: string; includeArchived?: boolean }) {
    return Property.Dropdown<string, R, typeof niftyAuth>({
      auth: niftyAuth,
      displayName: 'Project',
      description,
      required,
      refreshers: ['portfolio'],
      options: async ({ auth, portfolio }) => {
        if (!auth) {
          return disabled('Connect your Nifty account first');
        }
        const portfolioId = typeof portfolio === 'string' && portfolio.length > 0 ? portfolio : undefined;
        return loadOptions({
          what: 'projects',
          load: async () => {
            const items = await listProjects({ auth, portfolioId, includeArchived });
            return items
              .filter((project) => portfolioId === undefined || niftyClient.text({ record: project, key: 'subteam' }) === portfolioId)
              .map((project) => ({
                label: projectLabel(project),
                value: niftyClient.text({ record: project, key: 'id' }),
              }));
          },
        });
      },
    });
  },
  status<R extends boolean>({ required, description }: { required: R; description?: string }) {
    return Property.Dropdown<string, R, typeof niftyAuth>({
      auth: niftyAuth,
      displayName: 'Status',
      description,
      required,
      refreshers: ['project'],
      options: async ({ auth, project }) => {
        if (!auth) {
          return disabled('Connect your Nifty account first');
        }
        if (typeof project !== 'string' || project.length === 0) {
          return disabled('Select a project first');
        }
        return loadOptions({
          what: 'statuses',
          load: async () => {
            const items = await listStatuses({ auth, projectId: project, includeArchived: false });
            return items.map((status) => ({ label: niftyClient.text({ record: status, key: 'name' }), value: niftyClient.text({ record: status, key: 'id' }) }));
          },
        });
      },
    });
  },
  milestone<R extends boolean>({ required, description }: { required: R; description?: string }) {
    return Property.Dropdown<string, R, typeof niftyAuth>({
      auth: niftyAuth,
      displayName: 'Milestone',
      description,
      required,
      refreshers: ['project'],
      options: async ({ auth, project }) => {
        if (!auth) {
          return disabled('Connect your Nifty account first');
        }
        if (typeof project !== 'string' || project.length === 0) {
          return disabled('Select a project first');
        }
        return loadOptions({
          what: 'milestones',
          load: async () => {
            const items = await listMilestones({ auth, projectId: project });
            return items.map((milestone) => ({
              label: milestone['is_list'] === true ? `${niftyClient.text({ record: milestone, key: 'name' })} (list)` : niftyClient.text({ record: milestone, key: 'name' }),
              value: niftyClient.text({ record: milestone, key: 'id' }),
            }));
          },
        });
      },
    });
  },
  task<R extends boolean>({ required, displayName, description }: { required: R; displayName?: string; description?: string }) {
    return Property.Dropdown<string, R, typeof niftyAuth>({
      auth: niftyAuth,
      displayName: displayName ?? 'Task',
      description,
      required,
      refreshers: ['project'],
      options: async ({ auth, project }) => {
        if (!auth) {
          return disabled('Connect your Nifty account first');
        }
        if (typeof project !== 'string' || project.length === 0) {
          return disabled('Select a project first');
        }
        return loadOptions({
          what: 'tasks',
          load: async () => {
            const { items } = await niftyClient.listAll({
              auth,
              path: 'tasks',
              key: 'tasks',
              query: { project_id: project, include_subtasks: true },
            });
            return items.map((task) => ({ label: taskLabel(task), value: niftyClient.text({ record: task, key: 'id' }) }));
          },
        });
      },
    });
  },
  members<R extends boolean>({ required, displayName, description }: { required: R; displayName: string; description?: string }) {
    return Property.MultiSelectDropdown<string, R, typeof niftyAuth>({
      auth: niftyAuth,
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return disabled('Connect your Nifty account first');
        }
        return loadOptions({
          what: 'members',
          load: async () => {
            const items = await listMembers({ auth, includeRemoved: false });
            return items.map((member) => ({ label: memberLabel(member), value: niftyClient.text({ record: member, key: 'id' }) }));
          },
        });
      },
    });
  },
};

export async function listProjects({
  auth,
  portfolioId,
  includeArchived,
}: {
  auth: NiftyAuth;
  portfolioId: string | undefined;
  includeArchived: boolean;
}): Promise<NiftyRecord[]> {
  const active = await niftyClient.listAll({ auth, path: 'projects', key: 'projects', query: { subteam_id: portfolioId } });
  if (!includeArchived) {
    return active.items;
  }
  const archived = await niftyClient.listAll({
    auth,
    path: 'projects',
    key: 'projects',
    query: { subteam_id: portfolioId, archived: true },
  });
  return [...active.items, ...archived.items];
}

export async function listStatuses({ auth, projectId, includeArchived }: { auth: NiftyAuth; projectId: string; includeArchived: boolean }): Promise<NiftyRecord[]> {
  const { items } = await niftyClient.listAll({
    auth,
    path: 'taskgroups',
    key: 'items',
    query: { project_id: projectId, archived: includeArchived ? undefined : false },
  });
  return items;
}

export async function listMilestones({ auth, projectId }: { auth: NiftyAuth; projectId: string }): Promise<NiftyRecord[]> {
  const { items } = await niftyClient.listAll({
    auth,
    path: 'milestones',
    key: 'items',
    query: { project_id: projectId, is_list: true },
  });
  return items;
}

export async function listMembers({ auth, includeRemoved }: { auth: NiftyAuth; includeRemoved: boolean }): Promise<NiftyRecord[]> {
  const { items } = await niftyClient.listAll({ auth, path: 'members', key: 'items' });
  return items.filter((member) => includeRemoved || member['removed'] !== true).map(niftyClient.cleanMember);
}

function disabled(placeholder: string): DropdownState<string> {
  return { disabled: true, placeholder, options: [] };
}

async function loadOptions({
  what,
  load,
  onForbidden,
}: {
  what: string;
  load: () => Promise<{ label: string; value: string }[]>;
  onForbidden?: string;
}): Promise<DropdownState<string>> {
  try {
    const options = await load();
    if (options.length === 0) {
      return { disabled: false, placeholder: `No ${what} found`, options: [] };
    }
    return { disabled: false, options };
  } catch (error) {
    if (onForbidden && error instanceof NiftyApiError && error.status === 403) {
      return disabled(onForbidden);
    }
    const reason = error instanceof Error ? error.message : String(error);
    return disabled(`Could not load ${what}: ${reason.slice(0, 200)}`);
  }
}

function projectLabel(project: NiftyRecord): string {
  const name = niftyClient.text({ record: project, key: 'name' });
  return project['archived'] === true ? `${name} (archived)` : name;
}

function taskLabel(task: NiftyRecord): string {
  const niceId = niftyClient.text({ record: task, key: 'nice_id' });
  const name = niftyClient.text({ record: task, key: 'name' });
  const base = niceId.length > 0 ? `${niceId} ${name}` : name;
  return task['completed'] === true ? `${base} (completed)` : base;
}

function memberLabel(member: NiftyRecord): string {
  const name = niftyClient.text({ record: member, key: 'name' });
  const email = niftyClient.text({ record: member, key: 'email' });
  return email.length > 0 ? `${name} (${email})` : name;
}
