import { PieceAuth, createPiece, Property } from '@activepieces/pieces-framework';

export const copperAuth = PieceAuth.CustomAuth({
    displayName: 'Copper CRM Authentication',
    description: 'Provide your Copper CRM API Key and the email address associated with it.',
    props: {
        api_key: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'Enter your Copper CRM API key. You can generate one in the Copper web app under System settings > API Keys.',
            required: true,
        }),
        user_email: Property.ShortText({
            displayName: 'User Email',
            description: 'Enter the email address of the user who generated this API key.',
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        // Simple validation to check if both API key and user email are provided
        if (auth.api_key && auth.user_email) {
            return {
                valid: true,
            };
        }
        return {
            valid: false,
            error: 'API Key and User Email are required for authentication.',
        };
    },
    required: true,
});

export const copper = createPiece({
    displayName: 'Copper CRM',
    logoUrl: 'https://cdn.activepieces.com/pieces/copper.png',
    auth: copperAuth,
    authors: ['0xmoner'],
    actions: [
        // Placeholder for Copper CRM Write Actions [1, 2]:
        // createPersonAction, // Adds a new person/contact.
        // updatePersonAction, // Updates a person based on matching criteria.
        // createLeadAction,   // Adds a new lead.
        // updateLeadAction,   // Updates an existing lead.
        // convertLeadAction,  // Converts a lead into a person (optionally with company/opportunity).
        // createCompanyAction, // Adds a new company.
        // updateCompanyAction, // Updates a company record.
        // createOpportunityAction, // Adds a new opportunity.
        // updateOpportunityAction, // Updates an opportunity using match criteria.
        // createProjectAction, // Adds a new project.
        // updateProjectAction, // Updates a project record.
        // createTaskAction,    // Adds a new task under a person, lead, or opportunity.
        // createActivityAction, // Logs an activity related to CRM entities.

        // Placeholder for Copper CRM Search Actions [3, 4]:
        // searchActivityAction, // Find an existing activity by type/criteria.
        // searchPersonAction,   // Lookup a person using match criteria.
        // searchLeadAction,     // Lookup a lead using match criteria.
        // searchCompanyAction,  // Lookup a company.
        // searchOpportunityAction, // Lookup an opportunity.
        // searchProjectAction,  // Lookup a project.
    ],
    triggers: [
        // Placeholder for Copper CRM Triggers [5, 6]:
        // newActivityTrigger,         // Fires when a new activity is logged.
        // newPersonTrigger,           // Fires when a new person/contact is created.
        // newLeadTrigger,             // Fires when a new lead is created.
        // newTaskTrigger,             // Fires when a new task is created.
        // updatedLeadTrigger,         // Fires when a lead is modified.
        // updatedTaskTrigger,         // Fires when a task is updated.
        // updatedOpportunityTrigger,  // Fires when an opportunity changes.
        // updatedOpportunityStatusTrigger, // Fires when an opportunity's status changes.
        // updatedOpportunityStageTrigger, // Fires when the opportunity advances stages.
        // updatedProjectTrigger,      // Fires when a project is updated.
        // updatedLeadStatusTrigger,   // Fires when a lead’s status changes.
    ],
});