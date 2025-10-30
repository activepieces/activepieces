import { Property } from '@activepieces/pieces-framework';
import { MeisterTaskClient } from './client';

export const meisterTaskProps = {
    projectId: (required = true) => Property.Dropdown({
        displayName: 'Project',
        description: 'The project to use.',
        required: required,
        refreshers: [],
        options: async (context) => {
            const auth = context['auth'] as string | undefined;
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            const client = new MeisterTaskClient(auth);
            const projects = await client.getProjects();
            return {
                disabled: false,
                options: projects.map((project) => ({
                    label: project.name,
                    value: project.id,
                })),
            };
        },
    }),

    taskId: (required = true) => Property.Dropdown({
        displayName: 'Task',
        description: 'The task to which the label will be added.',
        required: required,
        refreshers: ['project_id'],
        options: async (context) => {
            const auth = context['auth'] as string | undefined;
            const propsValue = context['propsValue'] as Record<string, unknown>;
            const projectId = propsValue['project_id'] as number | undefined;
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            if (!projectId) {
                return { disabled: true, placeholder: 'Select a project first', options: [] };
            }
            const client = new MeisterTaskClient(auth);
            const tasks = await client.getTasks(projectId);
            return {
                disabled: false,
                options: tasks.map((task) => ({
                    label: task.name,
                    value: task.id,
                })),
            };
        },
    }),

    labelId: (required = true) => Property.Dropdown({
        displayName: 'Label',
        description: 'The label to add to the task.',
        required: required,
        refreshers: ['project_id'],
        options: async (context) => {
            const auth = context['auth'] as string | undefined;
            const propsValue = context['propsValue'] as Record<string, unknown>;
            const projectId = propsValue['project_id'] as number | undefined;
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            if (!projectId) {
                return { disabled: true, placeholder: 'Select a project first', options: [] };
            }
            const client = new MeisterTaskClient(auth);
            const labels = await client.getLabels(projectId);
            return {
                disabled: false,
                options: labels.map((label) => ({
                    label: label.name,
                    value: label.id,
                })),
            };
        },
    }),

    sectionId: (required = true) => Property.Dropdown({
        displayName: 'Section',
        description: 'The section to create the task in.',
        required: required,
        refreshers: ['project_id'],
        options: async (context) => {
            const auth = context['auth'] as string | undefined;
            const propsValue = context['propsValue'] as Record<string, unknown>;
            const projectId = propsValue['project_id'] as number | undefined;
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            if (!projectId) {
                return { disabled: true, placeholder: 'Select a project first', options: [] };
            }
            const client = new MeisterTaskClient(auth);
            const sections = await client.getSections(projectId);
            return {
                disabled: false,
                options: sections.map((section) => ({
                    label: section.name,
                    value: section.id,
                })),
            };
        },
    }),

    assigneeId: (required = true) => Property.Dropdown({
        displayName: 'Assignee',
        description: 'The user to assign this task to.',
        required: required,
        refreshers: ['project_id'],
        options: async (context) => {
            const auth = context['auth'] as string | undefined;
            const propsValue = context['propsValue'] as Record<string, unknown>;
            const projectId = propsValue['project_id'] as number | undefined;
            if (!auth) {
                return { disabled: true, placeholder: 'Connect your account first', options: [] };
            }
            if (!projectId) {
                return { disabled: true, placeholder: 'Select a project first', options: [] };
            }
            const client = new MeisterTaskClient(auth);
            const members = await client.getProjectMembers(projectId);
            return {
                disabled: false,
                options: members.map((member) => ({
                    label: `${member.fullname} (${member.email})`,
                    value: member.id,
                })),
            };
        },
    }),
};
