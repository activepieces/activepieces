import { Property } from '@activepieces/pieces-framework';
import { teamworkClient } from './client';
import { TeamworkAuth } from './auth';

export const teamworkProps = {
  project_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Project',
      description: 'The project to which the file will be uploaded.',
      required: required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const projects = await teamworkClient.getProjects(auth as TeamworkAuth);
        return {
          disabled: false,
          options: projects.map((project) => ({
            label: project.name,
            value: project.id,
          })),
        };
      },
    }),

  message_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Message',
      description: 'The message thread to post a reply in.',
      required: required,
      refreshers: ['auth', 'project_id'],
      options: async ({ auth, project_id }) => {
        if (!auth || !project_id) {
          return {
            disabled: true,
            placeholder: 'Please select a project first.',
            options: [],
          };
        }
        const messages = await teamworkClient.getMessages(auth as TeamworkAuth, project_id as string);
        return {
          disabled: false,
          options: messages.map((message) => ({
            label: message.title, 
            value: message.id,
          })),
        };
      },
    }),
  notebook_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Notebook',
      description: 'The notebook to add the comment to.',
      required: required,
      refreshers: ['auth', 'project_id'],
      options: async ({ auth, project_id }) => {
        if (!auth || !project_id) {
          return {
            disabled: true,
            placeholder: 'Please select a project first.',
            options: [],
          };
        }
        const notebooks = await teamworkClient.getNotebooks(auth as TeamworkAuth, project_id as string);
        return {
          disabled: false,
          options: notebooks.map((notebook) => ({
            label: notebook.name,
            value: notebook.id,
          })),
        };
      },
    }),

    company_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Company',
      description: 'The company the new user will be associated with.',
      required: required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const companies = await teamworkClient.getCompanies(auth as TeamworkAuth);
        return {
          disabled: false,
          options: companies.map((company) => ({
            label: company.name,
            value: company.id,
          })),
        };
      },
    }),

    project_owner_id: (required = false) =>
    Property.Dropdown({
      displayName: 'Project Owner',
      description: 'The person who will be the project owner.',
      required: required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const people = await teamworkClient.getPeople(auth as TeamworkAuth);
        return {
          disabled: false,
          options: people.map((person) => ({
            label: `${person['first-name']} ${person['last-name']}`,
            value: person.id,
          })),
        };
      },
    }),

    workflow_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Workflow',
      description: 'The workflow to add a stage to.',
      required: required,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first.',
            options: [],
          };
        }
        const workflows = await teamworkClient.getWorkflows(auth as TeamworkAuth);
        return {
          disabled: false,
          options: workflows.map((workflow) => ({
            label: workflow.name,
            value: workflow.id,
          })),
        };
      },
    }),

    task_list_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Task List',
      description: 'The task list that contains the task.',
      required: required,
      refreshers: ['auth', 'project_id'],
      options: async ({ auth, project_id }) => {
        if (!auth || !project_id) {
          return {
            disabled: true,
            placeholder: 'Please select a project first.',
            options: [],
          };
        }
        const taskLists = await teamworkClient.getTaskLists(auth as TeamworkAuth, project_id as string);
        return {
          disabled: false,
          options: taskLists.map((tasklist) => ({
            label: tasklist.name,
            value: tasklist.id,
          })),
        };
      },
    }),

  task_id: (required = true) =>
    Property.Dropdown({
      displayName: 'Task',
      description: 'The task to add a comment to.',
      required: required,
      refreshers: ['auth', 'task_list_id'],
      options: async ({ auth, task_list_id }) => {
        if (!auth || !task_list_id) {
          return {
            disabled: true,
            placeholder: 'Please select a task list first.',
            options: [],
          };
        }
        const tasks = await teamworkClient.getTasksInTaskList(auth as TeamworkAuth, task_list_id as string);
        return {
          disabled: false,
          options: tasks.map((task) => ({
            label: task.content, 
            value: task.id,
          })),
        };
      },
    }),
};