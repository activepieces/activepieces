import { createAction, Property } from "@activepieces/pieces-framework";
import { copperAuth } from "../common/auth";
import { makeCopperRequest } from "../common/request";
import { HttpMethod } from "@activepieces/pieces-common";
import { projectAssigneeId, projectCustomFields, projectDetails, projectId, projectName, projectRelatedResourceId, projectStatus, projectTags } from "../common/project";
import { PROJECTS_API_ENDPOINT } from "../common/constants";

export const createProject = createAction({
    auth: copperAuth,
    name: 'create_project',
    displayName: 'Create Project',
    description: 'Create a new Project in Copper.',
    props: {
        name: projectName,
        related_resource: projectRelatedResourceId,
        assignee_id: projectAssigneeId,
        status: projectStatus,
        details: projectDetails,
        tags: projectTags,
        custom_fields: projectCustomFields,
    },
    async run(context) {
        const { auth, propsValue } = context;

        const payload = Object.fromEntries(
            Object.entries(propsValue).filter(([, value]) => {
                if (Array.isArray(value)) {
                    return value.length > 0;
                }
                return value != null;
            })
        );

        return await makeCopperRequest(
            HttpMethod.POST,
            `${PROJECTS_API_ENDPOINT}`,
            auth,
            payload
        );
    },
});

export const updateProject = createAction({
    auth: copperAuth,
    name: 'update_project',
    displayName: 'Update Project',
    description: 'Update an existing Project in Copper.',
    props: {
        id: projectId,
        name: { ...projectName, required: false },
        related_resource: { ...projectRelatedResourceId, required: false },
        assignee_id: { ...projectAssigneeId, required: false },
        status: { ...projectStatus, required: false },
        details: { ...projectDetails, required: false },
        tags: { ...projectTags, required: false },
        custom_fields: { ...projectCustomFields, required: false },
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { id, ...updateProps } = propsValue;

        const payload = Object.fromEntries(
            Object.entries(updateProps).filter(([, value]) => value !== undefined)
        );

        if (Object.keys(payload).length === 0) {
            // The API handles empty payloads gracefully, so we can return early
            // or fetch and return the existing project to show the user no changes were made.
            // For simplicity, we'll just return a success message or the result of a GET request.
            // Returning the result of a GET is often more useful.
            return await makeCopperRequest(HttpMethod.GET, `projects/${id}`, auth);
        }

        return await makeCopperRequest(
            HttpMethod.PUT,
            `${PROJECTS_API_ENDPOINT}/${id}`,
            auth,
            payload
        );
    },
});

export const searchProject = createAction({
    auth: copperAuth,
    name: 'search_project',
    displayName: 'Search Project',
    description: 'Search for a Project in Copper and return the first matching result.',
    props: {
        name: { ...projectName, required: false },
        assignee_ids: { ...projectAssigneeId, required: false },
        statuses: { ...projectStatus, required: false },
        tags: { ...projectTags, required: false },
        custom_fields: { ...projectCustomFields, required: false },
        minimum_created_date: Property.DateTime({
            displayName: 'Minimum Created Date',
            description: 'Search for Projects created on or after this date.',
            required: false,
        }),
        maximum_created_date: Property.DateTime({
            displayName: 'Maximum Created Date',
            description: 'Search for Projects created on or before this date.',
            required: false,
        }),
        minimum_modified_date: Property.DateTime({
            displayName: 'Minimum Modified Date',
            description: 'Search for Projects modified on or after this date.',
            required: false,
        }),
        maximum_modified_date: Property.DateTime({
            displayName: 'Maximum Modified Date',
            description: 'Search for Projects modified on or before this date.',
            required: false,
        }),
        sort_by: Property.StaticDropdown({
            displayName: 'Sort By',
            description: 'The field on which to sort the results.',
            required: false,
            options: {
                options: [
                    { label: 'Name', value: 'name' },
                    { label: 'Assigned To', value: 'assigned_to' },
                    { label: 'Related To', value: 'related_to' },
                    { label: 'Status', value: 'status' },
                    { label: 'Date Modified', value: 'date_modified' },
                    { label: 'Date Created', value: 'date_created' },
                ],
            },
        }),
        sort_direction: Property.StaticDropdown({
            displayName: 'Sort Direction',
            description: 'The direction in which to sort the results.',
            required: false,
            options: {
                options: [
                    { label: 'Ascending', value: 'asc' },
                    { label: 'Descending', value: 'desc' },
                ],
            },
        }),
    },

    async run(context) {
        const { auth, propsValue } = context;

        const searchFilters = {
            name: propsValue.name,
            assignee_ids: propsValue.assignee_ids ? [propsValue.assignee_ids] : undefined,
            statuses: propsValue.statuses ? [propsValue.statuses] : undefined,
            tags: propsValue.tags,
            custom_fields: propsValue.custom_fields,
            minimum_created_date: propsValue.minimum_created_date,
            maximum_created_date: propsValue.maximum_created_date,
            minimum_modified_date: propsValue.minimum_modified_date,
            maximum_modified_date: propsValue.maximum_modified_date,
            sort_by: propsValue.sort_by,
            sort_direction: propsValue.sort_direction,
        };

        const activeFilters = Object.fromEntries(
            Object.entries(searchFilters).filter(([, value]) => {
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'string') return value.trim() !== '';
                return value != null;
            })
        );
        
        if (activeFilters['custom_fields']) {
            const cleanedCustomFields = (activeFilters['custom_fields'] as any[]).filter(
                (cf) => cf.custom_field_definition_id != null && cf.value != null
            );
            
            if (cleanedCustomFields.length > 0) {
                activeFilters['custom_fields'] = cleanedCustomFields;
            } else {
                delete activeFilters['custom_fields'];
            }
        }

        const payload = {
            page_size: 1,
            ...activeFilters,
        };

        const response = await makeCopperRequest<any[]>(
            HttpMethod.POST,
            `${PROJECTS_API_ENDPOINT}/search`,
            auth,
            payload
        );

        return response?.length > 0 ? response[0] : null;
    },
});