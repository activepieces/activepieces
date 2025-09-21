import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';


interface CapsuleParty {
    id: number;
    displayName: string;
    type: 'person' | 'organisation';
}
interface CapsuleOpportunity {
    id: number;
    name: string;
}
interface CapsuleKase {
    id: number;
    name: string;
}
interface CapsuleTag {
    id: number;
    name: string;
}
interface CapsuleMilestone {
    id: number;
    name: string;
}
interface CapsuleProjectStage {
    id: number;
    name: string;
}
interface CapsuleTaskCategory {
    id: number;
    name: string;
}

export const partyDropdown = Property.Dropdown({
    displayName: 'Party (Contact)',
    description: 'Select the person or organisation.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your account first',
                options: [],
            };
        }
        const response = await makeRequest<{ parties: CapsuleParty[] }>(
            auth as OAuth2PropertyValue,
            HttpMethod.GET,
            '/parties'
        );
        return {
            disabled: false,
            options: response.parties.map((party) => ({
                label: party.displayName,
                value: party.id,
            })),
        };
    },
});

export const organisationDropdown = Property.Dropdown({
    displayName: 'Link to Organisation',
    description: "Select the organisation to link this person to. (Only used for 'Person' type).",
    required: false,
    refreshers: ['type'],
    options: async (props) => {
        const { auth, type } = props as { auth: OAuth2PropertyValue, type: string | undefined };

        if (!auth || type !== 'person') {
            return {
                disabled: true,
                placeholder: 'Select contact type "Person" to see organisations',
                options: [],
            };
        }
        const response = await makeRequest<{ parties: CapsuleParty[] }>(
            auth,
            HttpMethod.GET,
            '/parties'
        );
        const organisations = response.parties.filter(p => p.type === 'organisation');
        return {
            disabled: false,
            options: organisations.map((org) => ({
                label: org.displayName,
                value: org.id,
            })),
        };
    },
});

export const milestoneDropdown = Property.Dropdown({
    displayName: 'Milestone',
    description: 'The current stage of the opportunity.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ milestones: CapsuleMilestone[] }>(
            auth as OAuth2PropertyValue,
            HttpMethod.GET,
            '/milestones'
        );
        return {
            disabled: false,
            options: response.milestones.map((milestone) => ({
                label: milestone.name,
                value: milestone.id,
            })),
        };
    },
});

export const projectStageDropdown = Property.Dropdown({
    displayName: 'Project Stage',
    description: 'The current stage of the project.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ stages: CapsuleProjectStage[] }>(
            auth as OAuth2PropertyValue,
            HttpMethod.GET,
            '/project-stages'
        );
        return {
            disabled: false,
            options: response.stages.map((stage) => ({
                label: stage.name,
                value: stage.id,
            })),
        };
    },
});

export const taskCategoryDropdown = Property.Dropdown({
    displayName: 'Category',
    description: 'The category for the task.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ categories: CapsuleTaskCategory[] }>(
            auth as OAuth2PropertyValue,
            HttpMethod.GET,
            '/task-categories'
        );
        return {
            disabled: false,
            options: response.categories.map((category) => ({
                label: category.name,
                value: category.id,
            })),
        };
    },
});

export const opportunityDropdown = Property.Dropdown({
    displayName: 'Opportunity',
    description: 'Select the opportunity.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ opportunities: CapsuleOpportunity[] }>(
            auth as OAuth2PropertyValue,
            HttpMethod.GET,
            '/opportunities'
        );
        return {
            disabled: false,
            options: response.opportunities.map((opportunity) => ({
                label: opportunity.name,
                value: opportunity.id,
            })),
        };
    },
});

export const kaseDropdown = Property.Dropdown({
    displayName: 'Project',
    description: 'Select the project.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ kases: CapsuleKase[] }>(
            auth as OAuth2PropertyValue,
            HttpMethod.GET,
            '/kases'
        );
        return {
            disabled: false,
            options: response.kases.map((kase) => ({
                label: kase.name,
                value: kase.id,
            })),
        };
    },
});

export const tagsMultiSelectDropdown = (props?: { displayName?: string, description?: string, required?: boolean }) => Property.MultiSelectDropdown({
    displayName: props?.displayName ?? 'Tags',
    description: props?.description ?? 'Select the tags.',
    required: props?.required ?? false,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }
        const response = await makeRequest<{ tags: CapsuleTag[] }>(
            auth as OAuth2PropertyValue,
            HttpMethod.GET,
            '/tags'
        );
        return {
            disabled: false,
            options: response.tags.map((tag) => ({
                label: tag.name,
                value: tag.id,
            })),
        };
    }
});