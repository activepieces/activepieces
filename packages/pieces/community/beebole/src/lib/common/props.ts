import { Property } from '@activepieces/pieces-framework';
import { beeboleClient } from './client';
import { beeboleAuth } from './auth';

type BeeboleCompany = { id: number; name: string; corporate?: boolean; active?: boolean };
type BeeboleProject = { id: number; name: string; active?: boolean; company?: { id: number; name?: string } };
type BeeboleSubproject = { id: number; name: string; active?: boolean; project?: { id: number; name?: string } };
type BeebolePerson = { id: number; name: string; email?: string; active?: boolean };
type BeeboleAbsence = { id: number; name: string; active?: boolean };

async function listCompanies(token: string) {
  const response = await beeboleClient.call<{ status: string; companies?: BeeboleCompany[] }>({
    token,
    body: { service: 'company.list' },
  });
  return response.body.companies ?? [];
}

async function listProjects(token: string, companyId: number) {
  const response = await beeboleClient.call<{ status: string; projects?: BeeboleProject[] }>({
    token,
    body: { service: 'project.list', company: { id: companyId } },
  });
  return response.body.projects ?? [];
}

async function listSubprojects(token: string, projectId: number) {
  const response = await beeboleClient.call<{ status: string; subprojects?: BeeboleSubproject[] }>({
    token,
    body: { service: 'subproject.list', project: { id: projectId } },
  });
  return response.body.subprojects ?? [];
}

async function listPeople(token: string, companyId: number) {
  const response = await beeboleClient.call<{ status: string; people?: BeebolePerson[]; persons?: BeebolePerson[] }>({
    token,
    body: { service: 'person.list', company: { id: companyId } },
  });
  return response.body.people ?? response.body.persons ?? [];
}

async function listAbsences(token: string) {
  const response = await beeboleClient.call<{ status: string; absences?: BeeboleAbsence[] }>({
    token,
    body: { service: 'absence.list' },
  });
  return response.body.absences ?? [];
}

export const beeboleProps = {
  companyDropdown: (params: { required: boolean; description?: string }) =>
    Property.Dropdown({
      auth: beeboleAuth,
      displayName: 'Company',
      description: params.description ?? 'Select the company (customer).',
      required: params.required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your Beebole account first.' };
        }
        try {
          const companies = await listCompanies(auth.secret_text );
          return {
            disabled: false,
            options: companies
              .filter((c) => c.active !== false)
              .map((c) => ({ label: c.name, value: c.id })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load companies. Check your API token.' };
        }
      },
    }),

  projectDropdown: (params: { required: boolean; description?: string }) =>
    Property.Dropdown({
      auth: beeboleAuth,
      displayName: 'Project',
      description: params.description ?? 'Select the project. Choose a company first.',
      required: params.required,
      refreshers: ['company'],
      options: async ({ auth, company }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your Beebole account first.' };
        }
        if (!company) {
          return { disabled: true, options: [], placeholder: 'Please select a company first.' };
        }
        try {
          const projects = await listProjects(auth.secret_text, company as number);
          return {
            disabled: false,
            options: projects
              .filter((p) => p.active !== false)
              .map((p) => ({ label: p.name, value: p.id })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load projects. Check your API token.' };
        }
      },
    }),

  subprojectDropdown: (params: { required: boolean; description?: string }) =>
    Property.Dropdown({
      auth: beeboleAuth,
      displayName: 'Subproject',
      description: params.description ?? 'Select the subproject. Choose a project first.',
      required: params.required,
      refreshers: ['project'],
      options: async ({ auth, project }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your Beebole account first.' };
        }
        if (!project) {
          return { disabled: true, options: [], placeholder: 'Please select a project first.' };
        }
        try {
          const subprojects = await listSubprojects(auth.secret_text
            , project as number);
          return {
            disabled: false,
            options: subprojects
              .filter((s) => s.active !== false)
              .map((s) => ({ label: s.name, value: s.id })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load subprojects. Check your API token.' };
        }
      },
    }),

  personDropdown: (params: { required: boolean; description?: string }) =>
    Property.Dropdown({
      auth: beeboleAuth,
      displayName: 'Person',
      description: params.description ?? 'Select the person. Choose a company first.',
      required: params.required,
      refreshers: ['company'],
      options: async ({ auth, company }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your Beebole account first.' };
        }
        if (!company) {
          return { disabled: true, options: [], placeholder: 'Please select a company first.' };
        }
        try {
          const people = await listPeople(auth.secret_text, company as number);
          return {
            disabled: false,
            options: people
              .filter((p) => p.active !== false)
              .map((p) => ({
                label: p.email ? `${p.name} (${p.email})` : p.name,
                value: p.id,
              })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load people. Check your API token.' };
        }
      },
    }),

  absenceDropdown: (params: { required: boolean; description?: string }) =>
    Property.Dropdown({
      auth: beeboleAuth,
      displayName: 'Absence Type',
      description: params.description ?? 'Select the absence type (e.g. Vacation, Sick Leave).',
      required: params.required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your Beebole account first.' };
        }
        try {
          const absences = await listAbsences(auth.secret_text);
          return {
            disabled: false,
            options: absences
              .filter((a) => a.active !== false)
              .map((a) => ({ label: a.name, value: a.id })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load absence types.' };
        }
      },
    }),
};
