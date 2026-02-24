import { HttpMethod } from "@activepieces/pieces-common";
import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { videoaskAuth } from "./auth";

export const organizationIdDropdown = Property.Dropdown({
    displayName: 'Organization ID',
    auth: videoaskAuth,
    description: 'Select the organization',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const access_token = (auth as any).access_token;
            const organizations = await makeRequest('', access_token, HttpMethod.GET, '/organizations');
            return {
                disabled: false,
                options: organizations.results.map((organization: any) => ({
                    label: organization.name || organization.organization_id,
                    value: organization.organization_id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading organizations',
            };
        }
    },
});

export const videoaskIdDropdown = Property.Dropdown({
    auth: videoaskAuth,
    displayName: 'Team ID',
    description: 'Select the team containing the database',
    required: true,
    refreshers: ['auth', 'organizationId'],
    options: async ({ auth, organizationId }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }
        if (!organizationId) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please select organization first',
            };
        }

        try {
            const videoasks = await makeRequest(organizationId as string, auth.access_token, HttpMethod.GET, '/forms');
            return {
                disabled: false,
                options: videoasks.results.map((videoask: any) => ({
                    label: videoask.title,
                    value: videoask.form_id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading teams',
            };
        }
    },
});

export const tagIdDropdown = Property.Dropdown({
    displayName: 'Tag ID',
    auth: videoaskAuth,
    description: 'Select the tag',
    required: true,
    refreshers: ['auth', 'organizationId'],
    options: async ({ auth, organizationId }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }
        if (!organizationId) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please select organization first',
            };
        }

        try {
            const tags = await makeRequest(organizationId as string, (auth as any).access_token, HttpMethod.GET, '/tags');
            return {
                disabled: false,
                options: tags.results.map((tag: any) => ({
                    label: tag.title,
                    value: tag.tag_id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading tags',
            };
        }
    },
});