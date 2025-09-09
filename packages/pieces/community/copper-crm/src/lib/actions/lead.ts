import { createAction, Property } from "@activepieces/pieces-framework";
import { copperAuth } from "../common/auth";
import { leadAddress, leadAssigneeId, leadCompanyName, leadCustomerSourceId, leadCustomFields, leadDetails, leadEmails, leadId, leadMonetaryValue, leadName, leadPhoneNumbers, leadSocials, leadStatus, leadTags, leadTitle, leadWebsites } from "../common/lead";
import { makeCopperRequest } from "../common/request";
import { HttpMethod } from "@activepieces/pieces-common";
import { LEADS_API_ENDPOINT } from "../common/constants";
import { companyId, companyName } from "../common/company";
import { personAssigneeId, personContactTypeId, personName } from "../common/people";
import { opportunityAssigneeId, opportunityMonetaryValue, opportunityName, opportunityPipelineId } from "../common/opportunity";

export const createLead = createAction({
    auth: copperAuth,
    name: 'create_lead',
    displayName: 'Create Lead',
    description: 'Create a new Lead in Copper.',
    props: {
        name: leadName,
        address: leadAddress,
        assignee_id: leadAssigneeId,
        company_name: leadCompanyName,
        customer_source_id: leadCustomerSourceId,
        details: leadDetails,
        emails: leadEmails,
        monetary_value: leadMonetaryValue,
        phone_numbers: leadPhoneNumbers,
        socials: leadSocials,
        status: leadStatus,
        tags: leadTags,
        title: leadTitle,
        websites: leadWebsites,
        custom_fields: leadCustomFields,
    },
    async run(context) {
        const { name, ...optionalProps } = context.propsValue;

        const payload: Record<string, any> = { name };

        for (const [key, value] of Object.entries(optionalProps)) {
            const isNonEmptyArray = Array.isArray(value) && value.length > 0;
            const isPresentValue = !Array.isArray(value) && value !== undefined && value !== null;

            if (isNonEmptyArray || isPresentValue) {
                payload[key] = value;
            }
        }

        return await makeCopperRequest(
            HttpMethod.POST,
            LEADS_API_ENDPOINT,
            context.auth,
            payload
        );
    },
});

export const updateLead = createAction({
    auth: copperAuth,
    name: 'update_lead',
    displayName: 'Update Lead',
    description: 'Update an existing Lead in Copper. Fields not specified will remain unchanged. To remove a field\'s value, explicitly set it to null (for scalar fields) or an empty array (for list/array fields).',
    props: {
      id: leadId, 
      name: leadName,
      emails: leadEmails,
      assignee_id: leadAssigneeId,
      company_name: leadCompanyName,
      customer_source_id: leadCustomerSourceId,
      details: leadDetails,
      monetary_value: leadMonetaryValue,
      phone_numbers: leadPhoneNumbers,
      socials: leadSocials,
      status: leadStatus,
      tags: leadTags,
      title: leadTitle,
      address: leadAddress,
      websites: leadWebsites,
      custom_fields: leadCustomFields,
    },
    async run(context) {
      const { id: leadId, ...optionalProps } = context.propsValue;
  
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(optionalProps)) {
        if (value !== undefined) {
          payload[key] = value;
        }
      }
  
      if (!leadId) {
          throw new Error("Lead ID is required to update a Lead.");
      }
  
      return await makeCopperRequest(
        HttpMethod.PUT,
        `${LEADS_API_ENDPOINT}/${leadId}`,
        context.auth,
        payload
      );
    },
});

export const convertLead = createAction({
    auth: copperAuth,
    name: 'convert_lead',
    displayName: 'Convert Lead',
    description: 'Converts an existing Lead into a Person, and optionally creates a Company and/or Opportunity.',
    props: {
      lead_id: leadId,
      person_name: personName,
      person_contact_type_id: personContactTypeId,
      person_assignee_id: personAssigneeId,
      company_id: companyId,
      company_name: companyName,
      company_exact_match: Property.Checkbox({
        displayName: 'Company Exact Match',
        description: 'If using "Company Name", set to true for an exact match, otherwise fuzzy matching applies.',
        required: false,
        defaultValue: false,
      }),
      opportunity_name: opportunityName,
      opportunity_pipeline_id: opportunityPipelineId,
      opportunity_pipeline_stage_id: opportunityPipelineId,
      opportunity_monetary_value: opportunityMonetaryValue,
      opportunity_assignee_id: opportunityAssigneeId
    },
    async run(context) {
      const {
        lead_id,
        person_name,
        person_contact_type_id,
        person_assignee_id,
        company_id,
        company_name,
        company_exact_match,
        opportunity_name,
        opportunity_pipeline_id,
        opportunity_pipeline_stage_id,
        opportunity_monetary_value,
        opportunity_assignee_id,
      } = context.propsValue;
  
      const person: Record<string, any> = { name: person_name };
      if (person_contact_type_id !== undefined) {
        person['contact_type_id'] = person_contact_type_id;
      }
      if (person_assignee_id !== undefined) {
        person['assignee_id'] = person_assignee_id;
      }
  
      const company: Record<string, any> = {};
      if (company_id !== undefined && company_name !== undefined && company_name !== '') {
          // According to API spec, id and name are mutually exclusive.
          throw new Error("Cannot specify both 'Company ID' and 'Company Name'. They are mutually exclusive.");
      } else if (company_id !== undefined) {
          company['id'] = company_id;
      } else if (company_name !== undefined) {
          // An empty string "" is explicitly allowed by the API to prevent company creation [1].
          company['name'] = company_name;
          if (company_exact_match !== undefined) {
              company['exact_match'] = company_exact_match;
          }
      }
      // If neither company_id nor company_name is provided, `company` remains empty and won't be sent,
      // which correctly means no company is created/associated by default.
  
      // Build the 'opportunity' object for the conversion details
      const opportunity: Record<string, any> = {};
      if (opportunity_name !== undefined) {
        opportunity['name'] = opportunity_name;
        // Pipeline ID is required if opportunity name is provided
        if (opportunity_pipeline_id === undefined) {
            throw new Error("'Opportunity Pipeline ID' is required when 'Opportunity Name' is provided.");
        }
        opportunity['pipeline_id'] = opportunity_pipeline_id;
  
        if (opportunity_pipeline_stage_id !== undefined) {
          opportunity['pipeline_stage_id'] = opportunity_pipeline_stage_id;
        }
        if (opportunity_monetary_value !== undefined) {
          opportunity['monetary_value'] = opportunity_monetary_value;
        }
        if (opportunity_assignee_id !== undefined) {
          opportunity['assignee_id'] = opportunity_assignee_id;
        }
      }
  
  
      const details: Record<string, any> = {
        person,
      };
  
      if (Object.keys(company).length > 0) { // Only add company if it has properties defined
        details['company'] = company;
    }
    if (Object.keys(opportunity).length > 0) { // Only add opportunity if it has properties defined
        details['opportunity'] = opportunity;
      }
  
      const payload = { details };
  
      // Execute the POST request to convert the Lead.
      return await makeCopperRequest(
        HttpMethod.POST,
        `leads/${lead_id}/convert`,
        context.auth,
        payload
      );
    },
  });
  
export const searchLead = createAction({
    auth: copperAuth,
    name: 'search_lead',
    displayName: 'Search Lead',
    description: 'Finds a specific lead. Returns the first matched result.',
    props: {
        name: leadName,
        email: leadEmails,
        phone_number: leadPhoneNumbers,
        assignee_id: leadAssigneeId,
        status_id: leadStatus,
        customer_source_id: leadCustomerSourceId,
        // city: leadCs
    },
    async run(context) {
        const { auth, propsValue } = context;

        const payload = {
            page_size: 1,
            page_number: 1,
            name: propsValue.name,
            emails: propsValue.email,
            phone_number: propsValue.phone_number,
            assignee_ids: propsValue.assignee_id != null ? [propsValue.assignee_id] : undefined,
            status_ids: propsValue.status_id != null ? [propsValue.status_id] : undefined,
            customer_source_ids: propsValue.customer_source_id != null ? [propsValue.customer_source_id] : undefined,
            // city: propsValue.city,
        };

        const response = await makeCopperRequest(
            HttpMethod.POST,
            `${LEADS_API_ENDPOINT}/search`,
            auth,
            payload
        );

        return response?.length > 0 ? response[0] : null;
    },
});