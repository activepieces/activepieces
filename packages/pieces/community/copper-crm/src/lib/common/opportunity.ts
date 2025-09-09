import { Property } from '@activepieces/pieces-framework';

export const opportunityId = Property.ShortText({
    displayName: 'Opportunity ID',
    description: 'Unique identifier for the Opportunity (e.g., for fetching, updating, or deleting)',
    required: true,
});

export const opportunityName = Property.ShortText({
    displayName: 'Opportunity Name',
    description: 'The name of the Opportunity',
    required: true,
});

export const opportunityAssigneeId = Property.Number({
    displayName: 'Assignee ID',
    description: 'Unique identifier of the User that will be the owner of the Opportunity',
    required: false,
});

export const opportunityCloseDate = Property.DateTime({
    displayName: 'Close Date',
    description: 'The expected close date of the Opportunity',
    required: false,
});

export const opportunityCompanyId = Property.Number({
    displayName: 'Company ID',
    description: 'The unique identifier of the primary Company with which the Opportunity is associated',
    required: false,
});

export const opportunityCompanyName = Property.ShortText({
    displayName: 'Company Name',
    description: 'The name of the primary Company with which the Opportunity is associated',
    required: false,
});

export const opportunityCustomerSourceId = Property.Number({
    displayName: 'Customer Source ID',
    description: 'Unique identifier of the Customer Source that generated this Opportunity',
    required: false,
});

export const opportunityDetails = Property.LongText({
    displayName: 'Details',
    description: 'Description of the Opportunity',
    required: false,
});

export const opportunityLossReasonId = Property.Number({
    displayName: 'Loss Reason ID',
    description: 'If the Opportunity\'s status is "Lost", the unique identifier of the loss reason',
    required: false,
});

export const opportunityMonetaryValue = Property.Number({
    displayName: 'Monetary Value',
    description: 'The monetary value of the Opportunity',
    required: false,
});

export const opportunityPipelineId = Property.Number({
    displayName: 'Pipeline ID',
    description: 'The unique identifier of the Pipeline in which this Opportunity is',
    required: false,
});

export const opportunityPrimaryContactId = Property.Number({
    displayName: 'Primary Contact ID',
    description: 'The unique identifier of the Person who is the primary contact for this Opportunity',
    required: true,
});

export const opportunityPriority = Property.StaticDropdown({
    displayName: 'Priority',
    description: 'The priority of the Opportunity',
    required: false,
    options: {
        options: [
            { label: 'None', value: 'None' },
            { label: 'Low', value: 'Low' },
            { label: 'Medium', value: 'Medium' },
            { label: 'High', value: 'High' },
        ],
    },
});

export const opportunityPipelineStageId = Property.Number({
    displayName: 'Pipeline Stage ID',
    description: 'The unique identifier of the Pipeline Stage of the Opportunity',
    required: false,
});

export const opportunityStatus = Property.StaticDropdown({
    displayName: 'Status',
    description: 'The status of the Opportunity',
    required: false,
    options: {
        options: [
            { label: 'Open', value: 'Open' },
            { label: 'Won', value: 'Won' },
            { label: 'Lost', value: 'Lost' },
            { label: 'Abandoned', value: 'Abandoned' },
        ],
    },
});

export const opportunityTags = Property.Array({
    displayName: 'Tags',
    description: 'An array of tags associated with the Opportunity',
    required: false,
    defaultValue: [],
});

export const opportunityWinProbability = Property.Number({
    displayName: 'Win Probability',
    description: 'The expected probability of winning the Opportunity (0-100)',
    required: false,
});

export const opportunityCustomFields = Property.Array({
    displayName: 'Custom Fields',
    description: 'An array of custom field values belonging to the Opportunity',
    required: false,
    properties: {
        custom_field_definition_id: Property.Number({
            displayName: 'Custom Field Definition ID',
            description: 'The ID of the Custom Field Definition',
            required: true,
        }),
        value: Property.ShortText({
            displayName: 'Custom Field Value',
            description: 'The value of this Custom Field',
            required: true,
        }),
    },
    defaultValue: [],
});