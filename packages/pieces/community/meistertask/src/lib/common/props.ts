import { Property } from '@activepieces/pieces-framework';
import { getProjects, getSections, getTasks, getPersons, getLabels } from '../api';

export const projectDropdown = Property.Dropdown({
  displayName: 'Project',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    try {
      const projects = await getProjects(auth as any);
      return {
        disabled: false,
        options: projects.map((p: any) => ({ label: p.name, value: p.id })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching projects',
      };
    }
  },
});

export const sectionDropdown = Property.Dropdown({
  displayName: 'Section',
  required: true,
  refreshers: ['auth', 'project_id'],
  options: async ({ auth, project_id }) => {
    if (!auth || !project_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a project first',
      };
    }
    try {
      const sections = await getSections(auth as any, project_id as string);
      return {
        disabled: false,
        options: sections.map((s: any) => ({ label: s.name, value: s.id })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching sections',
      };
    }
  },
});

export const taskDropdown = Property.Dropdown({
  displayName: 'Task',
  required: true,
  refreshers: ['auth', 'project_id'],
  options: async ({ auth, project_id }) => {
    if (!auth || !project_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a project first',
      };
    }
    try {
      const tasks = await getTasks(auth as any, project_id as string);
      return {
        disabled: false,
        options: tasks.map((t: any) => ({ label: t.name, value: t.id })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching tasks',
      };
    }
  },
});

export const personDropdown = Property.Dropdown({
  displayName: 'Person',
  required: false,
  refreshers: ['auth', 'project_id'],
  options: async ({ auth, project_id }) => {
    if (!auth || !project_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a project first',
      };
    }
    try {
      const persons = await getPersons(auth as any, project_id as string);
      return {
        disabled: false,
        options: persons.map((p: any) => ({ label: `${p.firstname} ${p.lastname}`, value: p.id })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching persons',
      };
    }
  },
});

export const labelDropdown = Property.Dropdown({
  displayName: 'Label',
  required: false,
  refreshers: ['auth', 'project_id'],
  options: async ({ auth, project_id }) => {
    if (!auth || !project_id) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select a project first',
      };
    }
    try {
      const labels = await getLabels(auth as any, project_id as string);
      return {
        disabled: false,
        options: labels.map((l: any) => ({ label: l.name, value: l.id })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error fetching labels',
      };
    }
  },
});