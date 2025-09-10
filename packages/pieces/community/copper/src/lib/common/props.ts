import { Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

// Helper function to call the search API for people
export async function searchPeople(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/people/search',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        },
        body: {
            page_size: 50,
            sort_by: "name"
        }
    });
    return response.body;
}

// Helper function to fetch customer sources
export async function getCustomerSources(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.GET,
        url: 'https://api.copper.com/developer_api/v1/customer_sources',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        }
    });
    return response.body;
}


export async function searchLeads(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/leads/search',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        },
        body: {
            page_size: 50,
            sort_by: "name"
        }
    });
    return response.body;
}



export async function getPipelines(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.GET,
        url: 'https://api.copper.com/developer_api/v1/pipelines',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        }
    });
    return response.body;
}


export async function getPipelineStages(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.GET,
        url: 'https://api.copper.com/developer_api/v1/pipeline_stages',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        }
    });
    return response.body;
}

export async function searchCompanies(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/companies/search',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        },
        body: {
            page_size: 50,
            sort_by: "name"
        }
    });
    return response.body;
}

export async function searchOpportunities(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/opportunities/search',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        },
        body: {
            page_size: 50,
            sort_by: "name"
        }
    });
    return response.body;
}

export async function getUsers(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.GET,
        url: 'https://api.copper.com/developer_api/v1/users',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        }
    });
    return response.body;
}

export async function searchTasks(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/tasks/search',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        },
        body: { page_size: 50, sort_by: "name" }
    });
    return response.body;
}

export async function searchProjects(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.POST,
        url: 'https://api.copper.com/developer_api/v1/projects/search',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        },
        body: {
            page_size: 50,
            sort_by: "name"
        }
    });
    return response.body;
}

export async function getActivityTypes(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.GET,
        url: 'https://api.copper.com/developer_api/v1/activity_types',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        }
    });
    return response.body;
}

export async function getLeadStatuses(auth: { email: string, token: string }) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.GET,
        url: 'https://api.copper.com/developer_api/v1/lead_statuses',
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        }
    });
    return response.body;
}

export const copperProps = {
    personId: Property.Dropdown({
        displayName: 'Person',
        description: 'The person to update.',
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true, options: [],
                    placeholder: 'Please connect your Copper account first.',
                };
            }
            const people = await searchPeople(auth as { email: string, token: string });
            return {
                options: people.map((person: any) => ({
                    label: person.name,
                    value: person.id,
                })),
            };
        },
    }),
    customerSourceId: Property.Dropdown({
        displayName: "Customer Source",
        description: "The source of the lead.",
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true, options: [],
                    placeholder: "Please connect your Copper account first.",
                };
            }
            const sources = await getCustomerSources(auth as { email: string, token: string });
            return {
                options: sources.map((source: any) => ({
                    label: source.name,
                    value: source.id,
                })),
            };
        },
    }),

    leadId: Property.Dropdown({
        displayName: "Lead",
        description: "The lead to update.",
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true, options: [],
                    placeholder: "Please connect your Copper account first.",
                };
            }
            const leads = await searchLeads(auth as { email: string, token: string });
            return {
                options: leads.map((lead: any) => ({
                    label: lead.name,
                    value: lead.id,
                })),
            };
        },
    }),


    pipelineId: Property.Dropdown({
        displayName: "Pipeline",
        description: "The pipeline for the new opportunity.",
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: "Please connect your account first." };
            const pipelines = await getPipelines(auth as { email: string, token: string });
            return {
                options: pipelines.map((pipeline: any) => ({
                    label: pipeline.name,
                    value: pipeline.id,
                })),
            };
        },
    }),
    
    pipelineStageId: Property.Dropdown({
        displayName: "Pipeline Stage",
        description: "The stage within the selected pipeline.",
        required: true,
        refreshers: ['pipeline_id'], // This makes it refresh when pipeline_id changes
        options: async ({ auth, pipeline_id }) => {
            if (!auth || !pipeline_id) return { disabled: true, options: [], placeholder: "Please select a pipeline first." };
            const stages = await getPipelineStages(auth as { email: string, token: string });
            const pipelineStages = stages.filter((stage: any) => stage.pipeline_id === pipeline_id);
            return {
                options: pipelineStages.map((stage: any) => ({
                    label: stage.name,
                    value: stage.id,
                })),
            };
        },
    }),

    primaryContactId: Property.Dropdown({
        displayName: "Primary Contact",
        description: "The primary contact person for this company.",
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true, options: [],
                    placeholder: 'Please connect your Copper account first.',
                };
            }
            const people = await searchPeople(auth as { email: string, token: string });
            return {
                options: people.map((person: any) => ({
                    label: person.name,
                    value: person.id,
                })),
            };
        },
    }),

   
    companyId: Property.Dropdown({
        displayName: "Company",
        description: "The company to update.",
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true, options: [],
                    placeholder: "Please connect your Copper account first.",
                };
            }
            const companies = await searchCompanies(auth as { email: string, token: string });
            return {
                options: companies.map((company: any) => ({
                    label: company.name,
                    value: company.id,
                })),
            };
        },
    }),

    optionalCompanyId: Property.Dropdown({
        displayName: "Company",
        description: "The company associated with this opportunity.",
        required: false, // Optional
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true, options: [],
                    placeholder: "Please connect your Copper account first.",
                };
            }
            const companies = await searchCompanies(auth as { email: string, token: string });
            return {
                options: companies.map((company: any) => ({
                    label: company.name,
                    value: company.id,
                })),
            };
        },
    }),

    opportunityId: Property.Dropdown({
        displayName: "Opportunity",
        description: "The opportunity to update.",
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: "Please connect your account first." };
            const opportunities = await searchOpportunities(auth as { email: string, token: string });
            return {
                options: opportunities.map((opp: any) => ({
                    label: opp.name,
                    value: opp.id,
                })),
            };
        },
    }),
    
    // 👇 NEW OPTIONAL PIPELINE PROPS FOR UPDATES
    optionalPipelineId: Property.Dropdown({
        displayName: "Pipeline",
        description: "The pipeline for the opportunity.",
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: "Please connect your account first." };
            const pipelines = await getPipelines(auth as { email: string, token: string });
            return {
                options: pipelines.map((pipeline: any) => ({
                    label: pipeline.name,
                    value: pipeline.id,
                })),
            };
        },
    }),
    optionalPipelineStageId: Property.Dropdown({
        displayName: "Pipeline Stage",
        description: "The stage within the selected pipeline.",
        required: false,
        refreshers: ['pipeline_id'],
        options: async ({ auth, pipeline_id }) => {
            if (!auth || !pipeline_id) return { disabled: true, options: [], placeholder: "Please select a pipeline first." };
            const stages = await getPipelineStages(auth as { email: string, token: string });
            const pipelineStages = stages.filter((stage: any) => stage.pipeline_id === pipeline_id);
            return {
                options: pipelineStages.map((stage: any) => ({
                    label: stage.name,
                    value: stage.id,
                })),
            };
        },
    }),

    assigneeId: Property.Dropdown({
        displayName: "Assignee",
        description: "The user to assign the record to.",
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: "Please connect your account first." };
            const users = await getUsers(auth as { email: string, token: string });
            return {
                options: users.map((user: any) => ({
                    label: user.name,
                    value: user.id,
                })),
            };
        },
    }),

    projectId: Property.Dropdown({
        displayName: "Project",
        description: "The project to update.",
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: "Please connect your account first." };
            const projects = await searchProjects(auth as { email: string, token: string });
            return {
                options: projects.map((project: any) => ({
                    label: project.name,
                    value: project.id,
                })),
            };
        },
    }),
    
    activityTypeId: Property.Dropdown({
        displayName: "Activity Type",
        description: "The type of activity to log.",
        required: true,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: "Please connect your account first." };
            const types = await getActivityTypes(auth as { email: string, token: string });
            // We need to store both id and category, so we stringify an object in the value.
            return {
                options: types.map((type: any) => ({
                    label: type.name,
                    value: JSON.stringify({ id: type.id, category: type.category })
                })),
            };
        },
    }),

    optionalActivityTypeId: Property.Dropdown({
        displayName: "Activity Type",
        description: "The type of activity to filter by.",
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: "Please connect your account first." };
            const types = await getActivityTypes(auth as { email: string, token: string });
            return {
                options: types.map((type: any) => ({
                    label: type.name,
                    value: JSON.stringify({ id: type.id, category: type.category })
                })),
            };
        },
    }),

    leadStatusId: Property.Dropdown({
        displayName: "To Status",
        description: "Optionally, trigger only when a lead moves to this specific status.",
        required: false,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) return { disabled: true, options: [], placeholder: "Please connect your account first." };
            const statuses = await getLeadStatuses(auth as { email: string, token: string });
            return {
                options: statuses.map((status: any) => ({
                    label: status.name,
                    value: status.id,
                })),
            };
        },
    }),
   
};