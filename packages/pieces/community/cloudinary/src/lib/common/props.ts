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

export const folderDropdown = Property.Dropdown({
    displayName: 'Folder',
    description: 'Select an existing folder or type a new folder path',
    required: false,
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
            const response = await makeRequest(auth, HttpMethod.GET, `/folders`);
            const folders = response.folders || [];
            
            return {
                disabled: false,
                options: [
                    { label: '(Root - no folder)', value: '' },
                    ...folders.map((folder: any) => ({
                        label: folder.path,
                        value: folder.path,
                    })),
                ],
                placeholder: 'Select a folder or type a new path',
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading folders - you can still type a folder path',
            };
        }
    },
});

export const tagsDropdown = Property.Dropdown({
    displayName: 'Tags',
    description: 'Select existing tags or type new ones (comma-separated)',
    required: false,
    refreshers: ['auth', 'resource_type'],
    options: async ({ auth, resource_type }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        const type = resource_type || 'image';

        try {
            const response = await makeRequest(auth, HttpMethod.GET, `/tags/${type}?max_results=100`);
            const tags = response.tags || [];
            
            return {
                disabled: false,
                options: tags.map((tag: string) => ({
                    label: tag,
                    value: tag,
                })),
                placeholder: 'Select existing tags or type new ones',
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading tags - you can still type tags manually',
            };
        }
    },
});

export const multiTagsDropdown = Property.MultiSelectDropdown({
    displayName: 'Tags',
    description: 'Select multiple existing tags',
    required: false,
    refreshers: ['auth', 'resource_type'],
    options: async ({ auth, resource_type }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        const type = resource_type || 'image';

        try {
            const response = await makeRequest(auth, HttpMethod.GET, `/tags/${type}?max_results=100`);
            const tags = response.tags || [];
            
            return {
                disabled: false,
                options: tags.map((tag: string) => ({
                    label: tag,
                    value: tag,
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

export const subfolderDropdown = Property.Dropdown({
    displayName: 'Subfolder',
    description: 'Select a subfolder within the parent folder',
    required: false,
    refreshers: ['auth', 'folder'],
    options: async ({ auth, folder }) => {
        if (!auth || !folder) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please select a parent folder first',
            };
        }

        try {
            const response = await makeRequest(auth, HttpMethod.GET, `/folders/${encodeURIComponent(folder as string)}`);
            const subfolders = response.folders || [];
            
            return {
                disabled: false,
                options: [
                    { label: '(No subfolder)', value: '' },
                    ...subfolders.map((folder: any) => ({
                        label: folder.name,
                        value: folder.path,
                    })),
                ],
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading subfolders',
            };
        }
    },
});

export const publicIdsDropdown = Property.MultiSelectDropdown({
    displayName: 'Public IDs',
    description: 'Select assets to delete by their public IDs',
    required: false,
    refreshers: ['auth', 'resource_type'],
    options: async ({ auth, resource_type }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        const type = resource_type || 'image';

        try {
            const response = await makeRequest(auth, HttpMethod.GET, `/resources/${type}?max_results=100`);
            const resources = response.resources || [];
            
            return {
                disabled: false,
                options: resources.map((resource: any) => ({
                    label: `${resource.public_id} (${resource.format || 'unknown'})`,
                    value: resource.public_id,
                })),
                placeholder: 'Select assets to delete',
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading assets - you can still type public IDs manually',
            };
        }
    },
});

// Single-select version for finding a specific resource
export const publicIdDropdown = Property.Dropdown({
    displayName: 'Public ID',
    description: 'Select an asset to find by its public ID',
    required: false,
    refreshers: ['auth', 'resource_type'],
    options: async ({ auth, resource_type }) => {
        if (!auth) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please connect your account first',
            };
        }

        const type = resource_type || 'image';

        try {
            const response = await makeRequest(auth, HttpMethod.GET, `/resources/${type}?max_results=100`);
            const resources = response.resources || [];
            
            return {
                disabled: false,
                options: resources.map((resource: any) => ({
                    label: `${resource.public_id} (${resource.format || 'unknown'})`,
                    value: resource.public_id,
                })),
                placeholder: 'Select an asset to find',
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Error loading assets - you can still type public ID manually',
            };
        }
    },
});