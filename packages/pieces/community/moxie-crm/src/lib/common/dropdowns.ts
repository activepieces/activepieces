import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { moxieRequest, responseStatusOf } from './client';
import { asArray, credentialsOf, disabledOptions, isRecord, safeOptions, stringField } from '.';
import { MoxieCredentials } from './models';

export const moxieDropdowns = {
  clientName({ required, displayName = 'Client', description }: DropdownParams) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName,
      description: description ?? 'The client, matched by its exact name.',
      required,
      refreshers: [],
      options: async ({ auth }) =>
        safeOptions({
          auth,
          emptyPlaceholder: 'No clients in this workspace yet.',
          load: async () =>
            (await listClients({ credentials: credentialsOf({ auth: requireAuth({ auth }) }) })).map((client) => ({
              label: client.name,
              value: client.name,
            })),
        }),
    });
  },

  clientId({ required, displayName = 'Client', description }: DropdownParams) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        safeOptions({
          auth,
          emptyPlaceholder: 'No clients in this workspace yet.',
          load: async () =>
            (await listClients({ credentials: credentialsOf({ auth: requireAuth({ auth }) }) })).map((client) => ({
              label: client.name,
              value: client.id,
            })),
        }),
    });
  },

  projectByClientName({ required, valueKey, displayName = 'Project', description }: ProjectDropdownParams) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName,
      description,
      required,
      refreshers: ['clientName'],
      options: async ({ auth, clientName }) => {
        if (typeof clientName !== 'string' || clientName === '') {
          return disabledOptions({ placeholder: 'Select a client first.' });
        }
        return safeOptions({
          auth,
          emptyPlaceholder: 'This client has no projects.',
          notFoundPlaceholder: 'This client has no projects.',
          load: async () =>
            (
              await listProjectsOfClient({
                credentials: credentialsOf({ auth: requireAuth({ auth }) }),
                clientName,
              })
            ).map((project) => ({ label: project.name, value: valueKey === 'id' ? project.id : project.name })),
        });
      },
    });
  },

  taskIdByProject({ required }: { required: boolean }) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName: 'Task',
      required,
      refreshers: ['projectId'],
      options: async ({ auth, projectId }) => {
        if (typeof projectId !== 'string' || projectId === '') {
          return disabledOptions({ placeholder: 'Select a project first.' });
        }
        return safeOptions({
          auth,
          emptyPlaceholder: 'This project has no tasks.',
          load: async () =>
            (await listTasks({ credentials: credentialsOf({ auth: requireAuth({ auth }) }), projectId })).map((task) => ({
              label: task.name,
              value: task.id,
            })),
        });
      },
    });
  },

  taskNameByProjectName({ required }: { required: boolean }) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName: 'Task',
      description: 'The task, matched by its exact name.',
      required,
      refreshers: ['clientName', 'projectName'],
      options: async ({ auth, clientName, projectName }) => {
        if (typeof clientName !== 'string' || clientName === '' || typeof projectName !== 'string' || projectName === '') {
          return disabledOptions({ placeholder: 'Select a client and a project first.' });
        }
        return safeOptions({
          auth,
          emptyPlaceholder: 'This project has no tasks.',
          notFoundPlaceholder: 'This client has no projects.',
          load: async () => {
            const credentials = credentialsOf({ auth: requireAuth({ auth }) });
            const projects = await listProjectsOfClient({ credentials, clientName });
            const project = projects.find((candidate) => candidate.name === projectName);
            if (project === undefined) {
              return [];
            }
            return (await listTasks({ credentials, projectId: project.id })).map((task) => ({
              label: task.name,
              value: task.name,
            }));
          },
        });
      },
    });
  },

  taskStageIdByProject({ required }: { required: boolean }) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName: 'Stage',
      description: 'Moves the task to this stage. Leave empty to keep the current stage.',
      required,
      refreshers: ['projectId'],
      options: async ({ auth, projectId }) => {
        if (typeof projectId !== 'string' || projectId === '') {
          return disabledOptions({ placeholder: 'Select a project first.' });
        }
        return safeOptions({
          auth,
          emptyPlaceholder: 'No task stages found for this project.',
          load: async () => {
            const credentials = credentialsOf({ auth: requireAuth({ auth }) });
            const projects = asArray({
              value: await moxieRequest<unknown>({
                credentials,
                method: HttpMethod.GET,
                path: '/action/projects/search',
                query: { id: projectId },
              }),
            });
            const projectTypeId = stringField({ record: projects[0], key: 'projectTypeId' });
            if (projectTypeId === undefined) {
              throw new Error('Project not found or it has no project type.');
            }
            const stages = asArray({
              value: await moxieRequest<unknown>({
                credentials,
                method: HttpMethod.GET,
                path: '/action/taskStages/list',
                query: { projectTypeId },
              }),
            });
            return idLabelOptions({ items: stages, labelKey: 'label' });
          },
        });
      },
    });
  },

  taskStageLabelByProjectName({ required, description }: { required: boolean; description?: string }) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName: 'Status',
      description,
      required,
      refreshers: ['clientName', 'projectName'],
      options: async ({ auth, clientName, projectName }) =>
        safeOptions({
          auth,
          emptyPlaceholder: 'No task stages found.',
          load: async () => {
            const credentials = credentialsOf({ auth: requireAuth({ auth }) });
            const projectTypeId =
              typeof clientName === 'string' && clientName !== '' && typeof projectName === 'string' && projectName !== ''
                ? (await listProjectsOfClient({ credentials, clientName }).catch((error: unknown) => ignoreNotFound({ error }))).find(
                    (project) => project.name === projectName,
                  )?.projectTypeId
                : undefined;
            const stages = asArray({
              value: await moxieRequest<unknown>({
                credentials,
                method: HttpMethod.GET,
                path: '/action/taskStages/list',
                query: { projectTypeId },
              }),
            });
            return stringOptions({ items: stages.map((stage) => stringField({ record: stage, key: 'label' })) });
          },
        }),
    });
  },

  contactId({ required }: { required: boolean }) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName: 'Contact',
      required,
      refreshers: [],
      options: async ({ auth }) =>
        safeOptions({
          auth,
          emptyPlaceholder: 'No contacts in this workspace yet.',
          load: async () => {
            const contacts = asArray({
              value: await moxieRequest<unknown>({
                credentials: credentialsOf({ auth: requireAuth({ auth }) }),
                method: HttpMethod.GET,
                path: '/action/contacts/search',
              }),
            });
            return contacts.filter(isRecord).flatMap((contact) => {
              const id = stringField({ record: contact, key: 'id' });
              if (id === undefined) {
                return [];
              }
              const name = [stringField({ record: contact, key: 'firstName' }), stringField({ record: contact, key: 'lastName' })]
                .filter((part) => part !== undefined && part !== '')
                .join(' ');
              const email = stringField({ record: contact, key: 'email' });
              const label = email === undefined || email === '' ? name || id : `${name || email} <${email}>`;
              return [{ label, value: id }];
            });
          },
        }),
    });
  },

  pipelineStage({ required, valueKey, displayName = 'Pipeline Stage', description }: StageDropdownParams) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        safeOptions({
          auth,
          emptyPlaceholder: 'No pipeline stages in this workspace.',
          load: async () => {
            const stages = asArray({
              value: await moxieRequest<unknown>({
                credentials: credentialsOf({ auth: requireAuth({ auth }) }),
                method: HttpMethod.GET,
                path: '/action/pipelineStages/list',
              }),
            });
            return valueKey === 'id'
              ? idLabelOptions({ items: stages, labelKey: 'label' })
              : stringOptions({ items: stages.map((stage) => stringField({ record: stage, key: 'label' })) });
          },
        }),
    });
  },

  stringList({ required, displayName, description, path, emptyPlaceholder }: StringListDropdownParams) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        safeOptions({
          auth,
          emptyPlaceholder,
          load: async () =>
            stringOptions({
              items: asArray({
                value: await moxieRequest<unknown>({
                  credentials: credentialsOf({ auth: requireAuth({ auth }) }),
                  method: HttpMethod.GET,
                  path,
                }),
              }),
            }),
        }),
    });
  },

  payableInvoice({ required }: { required: boolean }) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName: 'Invoice',
      description: 'An open (sent, not fully paid) invoice of the selected client.',
      required,
      refreshers: ['clientName'],
      options: async ({ auth, clientName }) => {
        if (typeof clientName !== 'string' || clientName === '') {
          return disabledOptions({ placeholder: 'Select a client first.' });
        }
        return safeOptions({
          auth,
          emptyPlaceholder: 'This client has no open invoices.',
          load: async () => {
            const invoices = asArray({
              value: await moxieRequest<unknown>({
                credentials: credentialsOf({ auth: requireAuth({ auth }) }),
                method: HttpMethod.GET,
                path: '/action/payableInvoices/search',
                query: { query: clientName },
              }),
            });
            return invoices.filter(isRecord).flatMap((invoice) => {
              const number = stringField({ record: invoice, key: 'invoiceNumberFormatted' });
              if (number === undefined) {
                return [];
              }
              const due = invoice['amountDue'];
              const currency = stringField({ record: invoice, key: 'currency' });
              const amount = currency === undefined ? `${due}` : `${due} ${currency}`;
              const label = typeof due === 'number' ? `${number} (${amount} due)` : number;
              return [{ label, value: number }];
            });
          },
        });
      },
    });
  },

  userEmail({ required, displayName = 'User', description }: DropdownParams) {
    return Property.Dropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        safeOptions({
          auth,
          load: async () =>
            (await listUsers({ credentials: credentialsOf({ auth: requireAuth({ auth }) }) })).flatMap((user) =>
              user.email === undefined ? [] : [{ label: user.label, value: user.email }],
            ),
        }),
    });
  },

  userIds({ required, displayName = 'Assignees', description }: DropdownParams) {
    return Property.MultiSelectDropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName,
      description,
      required,
      refreshers: [],
      options: async ({ auth }) =>
        safeOptions({
          auth,
          load: async () =>
            (await listUsers({ credentials: credentialsOf({ auth: requireAuth({ auth }) }) })).flatMap((user) =>
              user.userId === undefined ? [] : [{ label: user.label, value: String(user.userId) }],
            ),
        }),
    });
  },

  clientContactEmails({ required }: { required: boolean }) {
    return Property.MultiSelectDropdown<string, boolean, typeof moxieCRMAuth>({
      auth: moxieCRMAuth,
      displayName: 'Send To Contacts',
      description: 'Contacts of the selected client who receive the invoice email. Used only when Send Invoice is on.',
      required,
      refreshers: ['clientName'],
      options: async ({ auth, clientName }) => {
        if (typeof clientName !== 'string' || clientName === '') {
          return disabledOptions({ placeholder: 'Select a client first.' });
        }
        return safeOptions({
          auth,
          emptyPlaceholder: 'This client has no contacts with an email address.',
          load: async () => {
            const credentials = credentialsOf({ auth: requireAuth({ auth }) });
            const client = (await listClients({ credentials })).find((candidate) => candidate.name === clientName);
            if (client === undefined) {
              return [];
            }
            const contacts = asArray({
              value: await moxieRequest<unknown>({ credentials, method: HttpMethod.GET, path: '/action/contacts/search' }),
            });
            return contacts.filter(isRecord).flatMap((contact) => {
              const email = stringField({ record: contact, key: 'email' });
              if (stringField({ record: contact, key: 'clientId' }) !== client.id || email === undefined || email === '') {
                return [];
              }
              return [{ label: email, value: email }];
            });
          },
        });
      },
    });
  },
};

function ignoreNotFound({ error }: { error: unknown }): { id: string; name: string; projectTypeId: string | undefined }[] {
  if (responseStatusOf({ error }) === 404) {
    return [];
  }
  throw error;
}

function requireAuth<T>({ auth }: { auth: T | undefined }): T {
  if (auth === undefined) {
    throw new Error('Connect your Moxie account first.');
  }
  return auth;
}

async function listClients({ credentials }: { credentials: MoxieCredentials }): Promise<{ id: string; name: string }[]> {
  const clients = asArray({
    value: await moxieRequest<unknown>({ credentials, method: HttpMethod.GET, path: '/action/clients/list' }),
  });
  return clients.flatMap((client) => {
    const id = stringField({ record: client, key: 'id' });
    const name = stringField({ record: client, key: 'name' });
    return id === undefined || name === undefined ? [] : [{ id, name }];
  });
}

async function listProjectsOfClient({
  credentials,
  clientName,
}: {
  credentials: MoxieCredentials;
  clientName: string;
}): Promise<{ id: string; name: string; projectTypeId: string | undefined }[]> {
  const projects = asArray({
    value: await moxieRequest<unknown>({
      credentials,
      method: HttpMethod.GET,
      path: '/action/projects/search',
      query: { query: clientName },
    }),
  });
  return projects.flatMap((project) => {
    const id = stringField({ record: project, key: 'id' });
    const name = stringField({ record: project, key: 'name' });
    const projectTypeId = stringField({ record: project, key: 'projectTypeId' });
    return id === undefined || name === undefined ? [] : [{ id, name, projectTypeId }];
  });
}

async function listTasks({
  credentials,
  projectId,
}: {
  credentials: MoxieCredentials;
  projectId: string;
}): Promise<{ id: string; name: string }[]> {
  const tasks = asArray({
    value: await moxieRequest<unknown>({
      credentials,
      method: HttpMethod.GET,
      path: '/action/tasks/list',
      query: { projectId },
    }),
  });
  return tasks.flatMap((task) => {
    const id = stringField({ record: task, key: 'id' });
    const name = stringField({ record: task, key: 'name' });
    return id === undefined || name === undefined ? [] : [{ id, name }];
  });
}

async function listUsers({
  credentials,
}: {
  credentials: MoxieCredentials;
}): Promise<{ userId: number | undefined; email: string | undefined; label: string }[]> {
  const accounts = asArray({
    value: await moxieRequest<unknown>({ credentials, method: HttpMethod.GET, path: '/action/users/list' }),
  });
  return accounts.flatMap((account) => {
    const user = isRecord(account) ? account['user'] : undefined;
    if (!isRecord(user)) {
      return [];
    }
    const userId = typeof user['userId'] === 'number' ? user['userId'] : undefined;
    const email = stringField({ record: user, key: 'email' });
    const name = [stringField({ record: user, key: 'firstName' }), stringField({ record: user, key: 'lastName' })]
      .filter((part) => part !== undefined && part !== '')
      .join(' ');
    const label = email === undefined ? name : name === '' ? email : `${name} <${email}>`;
    return [{ userId, email, label: label === '' ? String(userId) : label }];
  });
}

function idLabelOptions({ items, labelKey }: { items: unknown[]; labelKey: string }): { label: string; value: string }[] {
  return items.flatMap((item) => {
    const id = stringField({ record: item, key: 'id' });
    const label = stringField({ record: item, key: labelKey });
    return id === undefined ? [] : [{ label: label ?? id, value: id }];
  });
}

function stringOptions({ items }: { items: unknown[] }): { label: string; value: string }[] {
  return items.flatMap((item) => (typeof item === 'string' && item !== '' ? [{ label: item, value: item }] : []));
}

type DropdownParams = {
  required: boolean;
  displayName?: string;
  description?: string;
};

type ProjectDropdownParams = DropdownParams & { valueKey: 'id' | 'name' };

type StageDropdownParams = DropdownParams & { valueKey: 'id' | 'label' };

type StringListDropdownParams = {
  required: boolean;
  displayName: string;
  description?: string;
  path: string;
  emptyPlaceholder?: string;
};
