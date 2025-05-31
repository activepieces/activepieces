import { OAuth2PropertyValue, Property, StoreScope, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { ticktickAuth } from "../../index";
import { Task, fetchTasksFromProjectData, TICKTICK_TASK_STATUS_INCOMPLETE, TICKTICK_TASK_STATUS_COMPLETED, fetchAllProjects } from "../common";

const TASK_STATUS_STORE_KEY = 'ticktick_task_completed_trigger_statuses';

export const taskCompleted = createTrigger({
    auth: ticktickAuth,
    name: 'task_completed',
    displayName: 'Task Completed',
    description: 'Triggers when a task is marked as completed in a selected project.',
    props: {
        projectId: Property.Dropdown({
            displayName: 'Project',
            description: 'The project to monitor for completed tasks.',
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
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: "63b7bebb91c0a5474805fcd4",
        projectId: "6226ff9877acee87727f6bca",
        title: "Sample Completed Task Title",
        status: TICKTICK_TASK_STATUS_COMPLETED,
        completedTime: "2019-11-13T03:00:00+0000"
    },

    async onEnable(context): Promise<void> {
        const { store, auth, propsValue } = context;
        const initialTasks = await fetchTasksFromProjectData(auth as OAuth2PropertyValue, propsValue.projectId as string);
        const taskStatuses = initialTasks.reduce((acc, task) => {
            acc[task.id] = task.status || TICKTICK_TASK_STATUS_INCOMPLETE;
            return acc;
        }, {} as Record<string, number>);
        await store.put(TASK_STATUS_STORE_KEY, taskStatuses, StoreScope.FLOW);
        console.log(`Initialized with statuses for ${initialTasks.length} tasks in project ${propsValue.projectId}`);
    },

    async onDisable(context): Promise<void> {
        await context.store.delete(TASK_STATUS_STORE_KEY, StoreScope.FLOW);
        console.log('Cleaned up stored task statuses on disable');
    },

    async run(context): Promise<Task[]> {
        const { store, auth, propsValue } = context;
        const currentTasks = await fetchTasksFromProjectData(auth as OAuth2PropertyValue, propsValue.projectId as string);
        const storedStatuses = await store.get<Record<string, number>>(TASK_STATUS_STORE_KEY, StoreScope.FLOW) || {};

        const newlyCompletedTasks: Task[] = [];
        const latestStatuses: Record<string, number> = {};

        for (const task of currentTasks) {
            const currentStatus = task.status || TICKTICK_TASK_STATUS_INCOMPLETE;
            latestStatuses[task.id] = currentStatus;
            const previousStatus = storedStatuses[task.id] || TICKTICK_TASK_STATUS_INCOMPLETE;

            if (previousStatus === TICKTICK_TASK_STATUS_INCOMPLETE && currentStatus === TICKTICK_TASK_STATUS_COMPLETED) {
                newlyCompletedTasks.push(task);
            }
        }

        await store.put(TASK_STATUS_STORE_KEY, latestStatuses, StoreScope.FLOW);

        console.log(`Found ${newlyCompletedTasks.length} newly completed tasks in project ${propsValue.projectId}`);
        return newlyCompletedTasks;
    },

    async test(context): Promise<Task[]> {
        const { auth, propsValue } = context;
        const tasks = await fetchTasksFromProjectData(auth as OAuth2PropertyValue, propsValue.projectId as string);
        const completedTasks = tasks.filter(task => task.status === TICKTICK_TASK_STATUS_COMPLETED);
        return completedTasks.slice(0, 3);
    },
});
