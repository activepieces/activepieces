import { OAuth2PropertyValue, Property, StoreScope, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { ticktickAuth } from "../../index";
import { Task, fetchTasksFromProjectData, TICKTICK_TASK_STATUS_INCOMPLETE, fetchAllProjects } from "../common";

const TRIGGER_DATA_STORE_KEY = 'ticktick_new_task_trigger_data';

export const newTaskCreated = createTrigger({
    auth: ticktickAuth,
    name: 'new_task_created',
    displayName: 'New Task Created',
    description: 'Triggers when a new task is created in a selected project.',
    props: {
        projectId: Property.Dropdown({
            displayName: 'Project',
            description: 'The project to monitor for new tasks.',
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
        id: "6247ee29630c800f064fd145",
        projectId: "6226ff9877acee87727f6bca",
        title: "Sample New Task Title",
        content: "This is a sample task content.",
        status: TICKTICK_TASK_STATUS_INCOMPLETE // Corrected usage
    },

    async onEnable(context): Promise<void> {
        const { store, auth, propsValue } = context;
        // Use common fetch function
        const initialTasks = await fetchTasksFromProjectData(auth as OAuth2PropertyValue, propsValue.projectId as string);
        await store.put(TRIGGER_DATA_STORE_KEY, { taskIds: initialTasks.map(task => task.id) }, StoreScope.FLOW);
        console.log(`Initialized with ${initialTasks.length} tasks for project ${propsValue.projectId}`);
    },

    async onDisable(context): Promise<void> {
        await context.store.delete(TRIGGER_DATA_STORE_KEY, StoreScope.FLOW);
        console.log('Cleaned up stored task IDs on disable');
    },

    async run(context): Promise<Task[]> { // Use common Task interface
        const { store, auth, propsValue } = context;
        // Use common fetch function
        const currentTasks = await fetchTasksFromProjectData(auth as OAuth2PropertyValue, propsValue.projectId as string);
        const storedData = await store.get<{ taskIds: string[] }>(TRIGGER_DATA_STORE_KEY, StoreScope.FLOW);

        const newTasks: Task[] = []; // Use common Task interface
        const allCurrentTaskIds = currentTasks.map(task => task.id);

        if (!storedData || !storedData.taskIds) {
            await store.put(TRIGGER_DATA_STORE_KEY, { taskIds: allCurrentTaskIds }, StoreScope.FLOW);
            return [];
        }

        const storedTaskIds = new Set(storedData.taskIds);
        for (const task of currentTasks) {
            if (!storedTaskIds.has(task.id)) {
                newTasks.push(task);
            }
        }

        if (newTasks.length > 0) {
            await store.put(TRIGGER_DATA_STORE_KEY, { taskIds: allCurrentTaskIds }, StoreScope.FLOW);
        }

        console.log(`Found ${newTasks.length} new tasks in project ${propsValue.projectId}`);
        return newTasks;
    },

    async test(context): Promise<Task[]> { // Use common Task interface
        const { auth, propsValue } = context;
        // Use common fetch function
        const tasks = await fetchTasksFromProjectData(auth as OAuth2PropertyValue, propsValue.projectId as string);
        return tasks.slice(0, 3);
    },
});

// Removed local fetchTasks function and interfaces as they are now in common/index.ts
