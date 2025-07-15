import { Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const resourceTypeDropdown = Property.Dropdown({
    displayName: 'Resource Type',
    description: 'Select the type of resource to upload to Cloudinary.',
    required: true,
    refreshers: [],
    options: async () => {
        return {
            disabled: false,
            options: [
                { label: 'Image', value: 'image' },
                { label: 'Video', value: 'video' },
                { label: 'Raw', value: 'raw' },
            ],
        };
    },
});

export const resourceDropdown = Property.Dropdown({
    displayName: 'Resource ID',
    description: 'Select the team containing the database',
    required: true,
    refreshers: ['auth', 'resource_type'],
    options: async ({ auth, resource_type }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const resources = await makeRequest(auth, HttpMethod.GET, `/resources/${resource_type}`);
            return {
                disabled: false,
                options: resources.resources.map((resource: any) => ({
                    label: resource.public_id,
                    value: resource.asset_id,
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

export const resourceAssetIdsDropdown = Property.MultiSelectDropdown({
    displayName: 'Resource Ids',
    description: 'Select the Resource',
    required: true,
    refreshers: ['auth', 'resource_type'],
    options: async ({ auth, resource_type }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        try {
            const resources = await makeRequest(auth, HttpMethod.GET, `/resources/${resource_type}`);
            return {
                disabled: false,
                options: resources.resources.map((resource: any) => ({
                    label: resource.public_id,
                    value: resource.asset_id,
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