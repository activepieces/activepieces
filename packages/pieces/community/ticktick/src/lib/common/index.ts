import { OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, HttpRequest } from "@activepieces/pieces-common";

export interface ChecklistItem {
    id?: string; // Not always present in create, but present in responses
    title: string;
    status?: 0 | 1; // 0: Normal (Incomplete), 1: Completed
    completedTime?: string; // "yyyy-MM-dd'T'HH:mm:ssZ"
    isAllDay?: boolean;
    sortOrder?: number;
    startDate?: string; // "yyyy-MM-dd'T'HH:mm:ssZ"
    timeZone?: string;
}

export interface Task {
    id: string;
    projectId: string;
    title: string;
    content?: string;
    desc?: string; // Description of checklist
    isAllDay?: boolean;
    startDate?: string; // "yyyy-MM-dd'T'HH:mm:ssZ"
    dueDate?: string; // "yyyy-MM-dd'T'HH:mm:ssZ"
    timeZone?: string;
    priority?: 0 | 1 | 3 | 5; // 0: None, 1: Low, 3: Medium, 5: High
    status?: 0 | 2; // 0: Normal (Incomplete), 2: Completed
    completedTime?: string; // "yyyy-MM-dd'T'HH:mm:ssZ"
    sortOrder?: number;
    items?: ChecklistItem[];
    reminders?: string[]; // e.g., [ "TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S" ]
    repeatFlag?: string; // e.g., "RRULE:FREQ=DAILY;INTERVAL=1"
}

export interface ProjectDataResponse {
    project: any; // Define more strictly if needed, based on Project definition
    tasks: Task[];
    columns?: any[]; // Define more strictly if needed, based on Column definition
}

/**
 * Fetches all tasks from a project using the /data endpoint.
 * @param auth The OAuth2 authentication property value.
 * @param projectId The ID of the project to fetch tasks from.
 * @returns A promise that resolves to an array of tasks, or an empty array on error.
 */
export async function fetchTasksFromProjectData(auth: OAuth2PropertyValue, projectId: string): Promise<Task[]> {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.ticktick.com/open/v1/project/${projectId}/data`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.access_token,
        },
        headers: {
            'Content-Type': 'application/json',
        }
    };
    try {
        const response = await httpClient.sendRequest<ProjectDataResponse>(request);
        return response.body?.tasks || [];
    } catch (error) {
        console.error(`Error fetching tasks for project ${projectId}:`, error);
        return [];
    }
}

// Task Statuses
export const TICKTICK_TASK_STATUS_INCOMPLETE = 0;
export const TICKTICK_TASK_STATUS_COMPLETED = 2;

// ChecklistItem (Subtask) Statuses
export const TICKTICK_SUBTASK_STATUS_INCOMPLETE = 0;
export const TICKTICK_SUBTASK_STATUS_COMPLETED = 1;

// Task Priorities
export const TICKTICK_PRIORITY_NONE = 0;
export const TICKTICK_PRIORITY_LOW = 1;
export const TICKTICK_PRIORITY_MEDIUM = 3;
export const TICKTICK_PRIORITY_HIGH = 5;

export interface Project {
    id: string;
    name: string;
    color?: string;
    closed?: boolean;
    groupId?: string;
    viewMode?: string; // "list", "kanban", "timeline"
    permission?: string; // "read", "write", "comment"
    kind?: string; // "TASK", "NOTE"
    sortOrder?: number;
}

/**
 * Fetches all projects for the authenticated user.
 * @param auth The OAuth2 authentication property value.
 * @returns A promise that resolves to an array of projects, or an empty array on error.
 */
export async function fetchAllProjects(auth: OAuth2PropertyValue): Promise<Project[]> {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.ticktick.com/open/v1/project`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.access_token,
        },
        headers: {
            'Content-Type': 'application/json',
        }
    };
    try {
        const response = await httpClient.sendRequest<Project[]>(request); // Expecting an array of Project
        return response.body || [];
    } catch (error) {
        console.error(`Error fetching all projects:`, error);
        return [];
    }
}
