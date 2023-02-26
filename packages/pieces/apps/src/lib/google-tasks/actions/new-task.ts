import { createAction } from "@activepieces/framework";
import { createTask, googleTasksCommon, Task, TaskStatus } from "../common";

export const googleTasksAddNewTaskAction = createAction({
    name: 'add_task',
    description: 'Add a new task to a specified task list',
    displayName: 'Add Task',
    props: {
        authentication: googleTasksCommon.authentication,
        tasks_list: googleTasksCommon.tasksList,
        title: googleTasksCommon.title,
        notes: googleTasksCommon.notes,
        completed: googleTasksCommon.completed,
    },
    async run({ propsValue }) {
        const task: Task = {
            kind: 'tasks#task',
            status: propsValue.completed ? TaskStatus.COMPLETED : TaskStatus.NEEDS_ACTION,
            title: propsValue.title,
            completed: propsValue.completed ? new Date().toISOString() : '',
            notes: propsValue.notes,
        };

        return createTask(propsValue.authentication, propsValue.tasks_list!, task);
    },
});