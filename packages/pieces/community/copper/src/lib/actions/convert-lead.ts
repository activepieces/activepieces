import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';

export const convertLead = createAction({
  auth: copperAuth,
  name: 'convert_lead',
  displayName: 'Convert Lead',
  description: 'Converts a lead into a person (optionally with company/opportunity). The lead is removed after conversion.',
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to convert',
      required: true,
    }),
    // Person fields
    personName: Property.ShortText({
      displayName: 'Person Name',
      description: 'Name for the person to be created from the lead',
      required: false,
    }),
    personContactTypeId: Property.Number({
      displayName: 'Person Contact Type ID',
      description: 'Contact type ID for the person',
      required: false,
    }),
    personAssigneeId: Property.Number({
      displayName: 'Person Assignee ID',
      description: 'Assignee ID for the person',
      required: false,
    }),
    // Company fields
    createCompany: Property.Checkbox({
      displayName: 'Create Company',
      description: 'Whether to create a company during conversion',
      required: false,
      defaultValue: false,
    }),
    companyId: Property.Number({
      displayName: 'Company ID',
      description: 'ID of existing company to associate with the person (if not creating new company)',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company (creates new company or associates with existing one)',
      required: false,
    }),
    companyExactMatch: Property.Checkbox({
      displayName: 'Company Exact Match',
      description: 'Whether to use exact matching for company name (default is fuzzy matching)',
      required: false,
      defaultValue: false,
    }),
    // Opportunity fields
    createOpportunity: Property.Checkbox({
      displayName: 'Create Opportunity',
      description: 'Whether to create an opportunity during conversion',
      required: false,
      defaultValue: false,
    }),
    opportunityName: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'Name for the opportunity to be created',
      required: false,
    }),
    opportunityPipelineId: Property.Number({
      displayName: 'Opportunity Pipeline ID',
      description: 'Pipeline ID for the opportunity',
      required: false,
    }),
    opportunityPipelineStageId: Property.Number({
      displayName: 'Opportunity Pipeline Stage ID',
      description: 'Pipeline stage ID for the opportunity (defaults to first stage if not specified)',
      required: false,
    }),
    opportunityMonetaryValue: Property.Number({
      displayName: 'Opportunity Monetary Value',
      description: 'Monetary value for the opportunity',
      required: false,
    }),
    opportunityAssigneeId: Property.Number({
      displayName: 'Opportunity Assignee ID',
      description: 'Assignee ID for the opportunity',
      required: false,
    }),
  },
  async run(context) {
    const {
      leadId,
      personName,
      personContactTypeId,
      personAssigneeId,
      createCompany,
      companyId,
      companyName,
      companyExactMatch,
      createOpportunity,
      opportunityName,
      opportunityPipelineId,
      opportunityPipelineStageId,
      opportunityMonetaryValue,
      opportunityAssigneeId,
    } = context.propsValue;

    // Build the request body
    const requestBody: any = {
      details: {},
    };

    // Add person details
    const personDetails: any = {};
    if (personName) {
      personDetails.name = personName;
    }
    if (personContactTypeId) {
      personDetails.contact_type_id = personContactTypeId;
    }
    if (personAssigneeId) {
      personDetails.assignee_id = personAssigneeId;
    }

    if (Object.keys(personDetails).length > 0) {
      requestBody.details.person = personDetails;
    }

    // Add company details if creating company
    if (createCompany) {
      const companyDetails: any = {};
      
      if (companyId) {
        companyDetails.id = companyId;
      } else if (companyName !== undefined) {
        companyDetails.name = companyName;
        if (companyExactMatch) {
          companyDetails.exact_match = true;
        }
      }

      if (Object.keys(companyDetails).length > 0) {
        requestBody.details.company = companyDetails;
      }
    }

    // Add opportunity details if creating opportunity
    if (createOpportunity) {
      const opportunityDetails: any = {};
      
      if (opportunityName) {
        opportunityDetails.name = opportunityName;
      }
      if (opportunityPipelineId) {
        opportunityDetails.pipeline_id = opportunityPipelineId;
      }
      if (opportunityPipelineStageId) {
        opportunityDetails.pipeline_stage_id = opportunityPipelineStageId;
      }
      if (opportunityMonetaryValue) {
        opportunityDetails.monetary_value = opportunityMonetaryValue;
      }
      if (opportunityAssigneeId) {
        opportunityDetails.assignee_id = opportunityAssigneeId;
      }

      if (Object.keys(opportunityDetails).length > 0) {
        requestBody.details.opportunity = opportunityDetails;
      }
    }

    // Validate that we have at least person details
    if (!requestBody.details.person || Object.keys(requestBody.details.person).length === 0) {
      throw new Error('At least person name must be provided for lead conversion.');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.copper.com/developer_api/v1/leads/${leadId}/convert`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        body: requestBody,
      });

      return response.body;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(`Bad request: ${JSON.stringify(error.response.body)}`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your credentials.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Lead with ID ${leadId} not found.`);
      }
      throw new Error(`Error converting lead: ${error.message}`);
    }
  },
});
