import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const updateLead = createAction({
  auth: salesforceAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Updates an existing Lead in Salesforce',
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'ID of the lead to update',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the lead',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Company name',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the lead',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the lead',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number of the lead',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title of the lead',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Lead status (e.g., Open, Contacted, Qualified)',
      required: false,
    }),
    leadSource: Property.ShortText({
      displayName: 'Lead Source',
      description: 'Source of the lead (e.g., Web, Phone Inquiry, Partner)',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      description: 'Industry of the lead',
      required: false,
    }),
    rating: Property.ShortText({
      displayName: 'Rating',
      description: 'Lead rating (e.g., Hot, Warm, Cold)',
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Street',
      description: 'Street address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State/Province',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal/ZIP code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the lead',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Additional custom fields as JSON object',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const {
      leadId,
      lastName,
      company,
      firstName,
      email,
      phone,
      title,
      status,
      leadSource,
      industry,
      rating,
      street,
      city,
      state,
      postalCode,
      country,
      description,
      additionalFields,
    } = context.propsValue;

    const leadData: Record<string, unknown> = {
      ...(lastName && { LastName: lastName }),
      ...(company && { Company: company }),
      ...(firstName && { FirstName: firstName }),
      ...(email && { Email: email }),
      ...(phone && { Phone: phone }),
      ...(title && { Title: title }),
      ...(status && { Status: status }),
      ...(leadSource && { LeadSource: leadSource }),
      ...(industry && { Industry: industry }),
      ...(rating && { Rating: rating }),
      ...(street && { Street: street }),
      ...(city && { City: city }),
      ...(state && { State: state }),
      ...(postalCode && { PostalCode: postalCode }),
      ...(country && { Country: country }),
      ...(description && { Description: description }),
      ...additionalFields,
    };

    const response = await callSalesforceApi(
      HttpMethod.PATCH,
      context.auth,
      `/services/data/v56.0/sobjects/Lead/${leadId}`,
      leadData
    );
    return response.body;
  },
});

