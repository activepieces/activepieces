import { Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../auth';
import { zeroCodeKitApi } from './client';

export const zeroCodeKitScheduler = {
    listTasks,
    taskId,
    parseSchedule,
    stringifyData,
    toTask,
};

export const ONE_TIME = '1';

export const MULTIPLE_TIMES = '2';

export const CRON = '3';

export const RECURRING = '4';

async function listTasks(apiKey: string): Promise<SchedulerTask[]> {
    const response = await zeroCodeKitApi.post<ListTasksResponse>({
        apiKey,
        path: '/operator/scheduler/list',
    });
    return response.tasks ?? [];
}

function taskId({ description }: { description: string }) {
    return Property.Dropdown({
        auth: zeroCodeKitAuth,
        displayName: 'Scheduler',
        description,
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, options: [], placeholder: 'Connect your 0CodeKit account first.' };
            }
            try {
                const tasks = await listTasks(auth.secret_text);
                if (tasks.length === 0) {
                    return { disabled: true, options: [], placeholder: 'No schedulers found. Create one first.' };
                }
                return {
                    disabled: false,
                    options: tasks.map((task) => ({
                        label: `${task.webhook} (next run ${task.nextExecution})`,
                        value: task.taskId,
                    })),
                };
            } catch (error) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: zeroCodeKitApi.describe({ error, fallback: 'Could not load schedulers.' }),
                };
            }
        },
    });
}

function parseSchedule({ intervalType, schedule }: { intervalType: string; schedule: string }): ScheduleValue {
    const trimmed = schedule.trim();
    if (trimmed === '') {
        throw new Error('Enter a Schedule for the selected Schedule Type.');
    }
    if (intervalType === ONE_TIME) {
        return toDateValue(trimmed);
    }
    if (intervalType === MULTIPLE_TIMES) {
        const parts = trimmed
            .split(/[\n,]/)
            .map((part) => part.trim())
            .filter((part) => part !== '');
        const values = parts.map(toDateValue);
        const numbers = values.filter((value): value is number => typeof value === 'number');
        return numbers.length === values.length ? numbers : parts;
    }
    return trimmed;
}

function toDateValue(value: string): string | number {
    return /^\d+$/.test(value) ? Number(value) : value;
}

function stringifyData(data: unknown): string {
    if (data === undefined || data === null || data === '') {
        return '{}';
    }
    return typeof data === 'string' ? data : JSON.stringify(data);
}

function toTask(task: SchedulerTask): SchedulerTaskOutput {
    return {
        task_id: task.taskId,
        webhook: task.webhook,
        next_execution: task.nextExecution,
        data: task.data ?? null,
    };
}

export type SchedulerTask = {
    taskId: string;
    webhook: string;
    nextExecution: string;
    data?: string;
};

export type ListTasksResponse = {
    tasks?: SchedulerTask[];
};

export type SchedulerTaskOutput = {
    task_id: string;
    webhook: string;
    next_execution: string;
    data: string | null;
};

type ScheduleValue = string | number | string[] | number[];
