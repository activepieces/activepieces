import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { Task, fetchTasksFromProjectData, fetchAllProjects } from "../common";
import { ticktickAuth } from "../../index";

export const findTaskByTitle = createAction({
    auth: ticktickAuth,
    name: 'find_task_by_title',
    displayName: 'Find Task by Title',
    description: 'Finds tasks in a specific project by their title.',
    props: {
        projectId: Property.Dropdown({
            displayName: 'Project',
            description: 'The project to search within.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return { disabled: true, placeholder: 'Please authenticate first', options: [] };
                const projects = await fetchAllProjects(auth as OAuth2PropertyValue);
                if (projects.length === 0) return { disabled: true, placeholder: 'No projects found.', options: [] };
                return {
                    disabled: false,
                    options: projects.map(p => ({ label: p.name, value: p.id })),
                };
            }
        }),
        title: Property.ShortText({
            displayName: 'Task Title',
            description: 'The title (or part of the title) of the task to find.',
            required: true,
        }),
        matchType: Property.StaticDropdown({
            displayName: 'Match Type',
            description: 'Select how the title should be matched.',
            required: true,
            options: {
                options: [
                    { label: 'Contains (case-insensitive)', value: 'contains' },
                    { label: 'Exact Match (case-insensitive)', value: 'exact' },
                ]
            },
            defaultValue: 'contains'
        })
    },
    async run(context) {
        const { projectId, title, matchType } = context.propsValue;
        const auth = context.auth as OAuth2PropertyValue;

        if (!projectId || !title) {
            return [];
        }

        const allTasksInProject = await fetchTasksFromProjectData(auth, projectId as string);

        const lowerCaseSearchTitle = (title as string).toLowerCase();
        const foundTasks: Task[] = [];

        for (const task of allTasksInProject) {
            const lowerCaseTaskTitle = task.title.toLowerCase();
            if (matchType === 'exact') {
                if (lowerCaseTaskTitle === lowerCaseSearchTitle) {
                    foundTasks.push(task);
                }
            } else { // Default to 'contains'
                if (lowerCaseTaskTitle.includes(lowerCaseSearchTitle)) {
                    foundTasks.push(task);
                }
            }
        }
        // This action could return multiple tasks if titles are not unique
        return foundTasks;
    },
});
