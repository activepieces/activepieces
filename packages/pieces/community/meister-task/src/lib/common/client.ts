import { httpClient, HttpMethod, HttpRequest, QueryParams } from "@activepieces/pieces-common";

export const meisterTaskApiUrl = 'https://www.meistertask.com/api';

export interface MeisterTaskProject {
    id: number;
    name: string;
}
export interface MeisterTaskTask {
    id: number;
    name: string;
}
export interface MeisterTaskLabel {
    id: number;
    name: string;
    color: string;
}
export interface MeisterTaskSection {
    id: number;
    name: string;
}
export interface MeisterTaskPerson {
    id: number;
    fullname: string; 
    email: string;
}
interface MeisterTaskProjectRight {
    id: number;
    person_id: number;
    role_id: number;
}
export interface MeisterTaskMember extends MeisterTaskPerson {}
export interface MeisterTaskAttachment {
    id: number;
    name: string;
    size: number;
    url: string;
    task_id: number;
    user_id: number;
    created_at: string;
}

export class MeisterTaskClient {
    private authHeader: string;

    constructor(token: string) {
        this.authHeader = `Bearer ${token}`;
    }

    async makeRequest<T>(
        method: HttpMethod,
        endpoint: string,
        body?: object,
        query?: QueryParams
    ): Promise<T> {
        const request: HttpRequest<object> = {
            method,
            url: `${meisterTaskApiUrl}${endpoint}`,
            body: body,
            queryParams: query,
            headers: {
                'Authorization': this.authHeader,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        };
        const { body: responseBody } = await httpClient.sendRequest<T>(request);
        return responseBody;
    }

    async getProjects(): Promise<MeisterTaskProject[]> {
        try { 
            return await this.makeRequest<MeisterTaskProject[]>(HttpMethod.GET, '/projects');
        } catch (e) { 
            console.error("Failed to fetch MeisterTask projects", e); 
            return []; 
        }
    }

    async getTasks(projectId: number): Promise<MeisterTaskTask[]> {
        try { 
            return await this.makeRequest<MeisterTaskTask[]>(HttpMethod.GET, `/projects/${projectId}/tasks`);
        } catch (e) { 
            console.error(`Failed to fetch tasks for project ${projectId}`, e); 
            return []; 
        }
    }

    async getLabels(projectId: number): Promise<MeisterTaskLabel[]> {
        try { 
            return await this.makeRequest<MeisterTaskLabel[]>(HttpMethod.GET, `/projects/${projectId}/labels`);
        } catch (e) { 
            console.error(`Failed to fetch labels for project ${projectId}`, e); 
            return []; 
        }
    }

    async findLabelsByName(projectId: number, name: string): Promise<MeisterTaskLabel[]> {
        try {
            const query: QueryParams = { name: name };
            return await this.makeRequest<MeisterTaskLabel[]>(HttpMethod.GET, `/projects/${projectId}/labels`, undefined, query);
        } catch (e) { 
            console.error(`Failed to find labels for project ${projectId}`, e); 
            return []; 
        }
    }

    async getSections(projectId: number): Promise<MeisterTaskSection[]> {
        try { 
            return await this.makeRequest<MeisterTaskSection[]>(HttpMethod.GET, `/projects/${projectId}/sections`);
        } catch (e) { 
            console.error(`Failed to fetch sections for project ${projectId}`, e); 
            return []; 
        }
    }

    async getAttachments(taskId: number): Promise<MeisterTaskAttachment[]> {
        try { 
            return await this.makeRequest<MeisterTaskAttachment[]>(HttpMethod.GET, `/tasks/${taskId}/attachments`);
        } catch (e) { 
            console.error(`Failed to fetch attachments for task ${taskId}`, e); 
            return []; 
        }
    }

    async getPersonById(personId: number): Promise<MeisterTaskPerson> {
        try {
            return await this.makeRequest<MeisterTaskPerson>(HttpMethod.GET, `/persons/${personId}`);
        } catch (e) {
            console.error(`Failed to fetch person ${personId}`, e);
            return { id: personId, fullname: "Unknown User", email: "Error" };
        }
    }

    async getProjectMembers(projectId: number): Promise<MeisterTaskMember[]> {
        try {
            const membersResponse = await this.makeRequest<{ project_rights: MeisterTaskProjectRight[] }>(
                HttpMethod.GET,
                `/projects/${projectId}/members`
            );

            if (!membersResponse || !Array.isArray(membersResponse.project_rights)) {
                return [];
            }

            const personIds = membersResponse.project_rights.map(right => right.person_id);
            const memberPromises = personIds.map(id => this.getPersonById(id));
            const members = await Promise.all(memberPromises);
            return members.filter(m => m.email !== "Error");
        } catch (e) {
            console.error(`Failed to fetch members for project ${projectId}`, e);
            return [];
        }
    }
}
