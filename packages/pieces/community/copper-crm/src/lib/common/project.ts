import { Property } from '@activepieces/pieces-framework';

export const projectId = Property.ShortText({
    displayName: 'Project ID',
    description: 'Unique identifier for the Project. Required for operations targeting a specific project.',
    required: true,
});

export const projectName = Property.ShortText({
    displayName: 'Project Name',
    description: 'The name of the Project. This is a required field when creating a new project.',
    required: true,
});

export const projectRelatedResourceId = Property.ShortText({
    displayName: 'Related Resource ID',
    description: 'The unique identifier of the primary related resource for the Project.',
    required: false,
});

export const projectAssigneeId = Property.ShortText({
    displayName: 'Assignee ID',
    description: 'Unique identifier of the User who will be the owner of the Project.',
    required: false,
});

export const projectStatus = Property.StaticDropdown({
    displayName: 'Status',
    description: 'The current status of the Project. Valid values are "Open" or "Completed".',
    required: false,
    options: {
        options: [
            { label: 'Open', value: 'Open' },
            { label: 'Completed', value: 'Completed' },
        ],
    },
});

export const projectDetails = Property.LongText({
    displayName: 'Project Description',
    description: 'A detailed description of the Project.',
    required: false,
});

export const projectTags = Property.Array({
    displayName: 'Tags',
    description: 'An array of tags associated with the Project.',
    required: false,
});

export const projectCustomFields = Property.Array({
    displayName: 'Custom Fields',
    description: 'An array of custom field values belonging to the Project. Each item requires a definition ID and a value.',
    required: false,
    properties: {
        custom_field_definition_id: Property.ShortText({
            displayName: 'Custom Field Definition ID',
            description: 'The ID of the Custom Field Definition.',
            required: true,
        }),
        value: Property.ShortText({
            displayName: 'Custom Field Value',
            description: 'The value for this Custom Field (e.g., number, string, option ID, or timestamp).',
            required: true,
        }),
    },
});

export const projectDateCreated = Property.DateTime({
    displayName: 'Date Created',
    description: 'A Unix timestamp representing the time