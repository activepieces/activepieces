import { createAction } from "@activepieces/pieces-framework";
import { copperAuth } from "../common/auth";
import { 
    personAddress, 
    personCustomFields, 
    personWebsites, 
    personSocials, 
    personTitle, 
    personTags, personDetails, personContactTypeId, personCompanyId, personCompanyName, personEmails, personName, personAssigneeId, personPhoneNumbers, 
    personId} from "../common/person";
import { HttpMethod, propsValidation } from "@activepieces/pieces-common";
import { makeCopperRequest } from "../common/request";
import { PEOPLE_API_ENDPOINT } from "../common/constants";
import { z } from "zod";

export const createPerson = createAction({
    auth: copperAuth,
    name: 'create_person',
    displayName: 'Create Person',
    description: 'Create a new Person in Copper.',
    props: {
        name: personName,
        emails: personEmails,
        assignee_id: personAssigneeId,
        company_id: personCompanyId,
        company_name: personCompanyName,
        contact_type_id: personContactTypeId,
        details: personDetails,
        tags: personTags,
        title: personTitle,
        address: personAddress,
        phone_numbers: personPhoneNumbers,
        socials: personSocials,
        websites: personWebsites,
        custom_fields: personCustomFields,
    },
    async run(context) {
        const { name, ...optionalProps } = context.propsValue;

        const payload: Record<string, unknown> = { name };

        for (const [key, value] of Object.entries(optionalProps)) {
            const isNonEmptyArray = Array.isArray(value) && value.length > 0;
            const isPresentValue = !Array.isArray(value) && value !== undefined && value !== null;

            if (isNonEmptyArray || isPresentValue) {
                payload[key] = value;
            }
        }

        return await makeCopperRequest(
            HttpMethod.POST,
            PEOPLE_API_ENDPOINT,
            context.auth,
            payload
        );
    },
});

export const updatePerson = createAction({
    auth: copperAuth,
    name: 'update_person',
    displayName: 'Update Person',
    description: 'Update an existing Person in Copper. Updates are only applied to fields explicitly specified.',
    props: {
        personId: personId,
        name: personName,
        emails: personEmails,
        assignee_id: personAssigneeId,
        company_id: personCompanyId,
        company_name: personCompanyName,
        contact_type_id: personContactTypeId,
        details: personDetails,
        tags: personTags,
        title: personTitle,
        address: personAddress,
        phone_numbers: personPhoneNumbers,
        socials: personSocials,
        websites: personWebsites,
        custom_fields: personCustomFields,
    },
    async run(context) {
        const { personId, ...optionalProps } = context.propsValue;

        const payload: Record<string, any> = {};

        for (const [key, value] of Object.entries(optionalProps)) {
            if (value !== undefined) {
                const isNonEmptyArray = Array.isArray(value) && value.length > 0;
                const isPresentNonArrayValue = !Array.isArray(value);

                if (isNonEmptyArray || isPresentNonArrayValue || (Array.isArray(value) && value.length === 0)) {
                    payload[key] = value;
                }
            }
        }

        if (Object.keys(payload).length === 0) {
            throw new Error('No fields provided for update. To update a person, provide at least one field to change.');
        }

        const response = await makeCopperRequest(
            HttpMethod.PUT,
            `people/${personId}`,
            context.auth,
            payload
        );

        return response;
    },
});

export const searchPersonByIdOrEmail = createAction({
    auth: copperAuth,
    name: 'search_person_by_id_or_email',
    displayName: 'Search Person by ID or Email',
    description: 'Searches for a person in Copper using either their ID or email address. Provide exactly one of Person ID or Email.',
    props: {
      personId: personId, 
      email: personEmails,
    },
    async run(context) {
      const { personId, email } = context.propsValue;
  
      await propsValidation.validateZod(context.propsValue, z.object({
        personId: z.string().optional(),
        email: z.string().optional(),
      }).refine(data => {
        const hasPersonId = data.personId !== undefined && data.personId !== null && data.personId.trim() !== '';
        const hasEmail = data.email !== undefined && data.email !== null && data.email.trim() !== '';
        
        return (hasPersonId || hasEmail) && !(hasPersonId && hasEmail);
      }, {
        message: 'Please provide either a Person ID or an Email, but not both.',
        path: ['personId', 'email'],
      }));
  
      if (personId) {
        const url = `${PEOPLE_API_ENDPOINT}/${personId}`;
        return await makeCopperRequest(
            HttpMethod.GET,
            url,
            context.auth
        );
      }

      else if (email && email.trim() !== '') {
        const url = `${PEOPLE_API_ENDPOINT}/fetch_by_email`;
        const body = { email };
        return await makeCopperRequest(
            HttpMethod.POST,
            url,
            context.auth,
            body
        );
      }
  
      throw new Error('Internal error: Neither Person ID nor Email was provided after validation.');
    },
  });