import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const createCase = createAction({
  auth: salesforceAuth,
  name: 'create_case',
  displayName: 'Create Case',
  description: 'Creates a Case in Salesforce, which represents a customer issue or problem',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Subject of the case',
      required: true,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Case status (e.g., New, Working, Escalated, Closed)',
      required: false,
    }),
    origin: Property.ShortText({
      displayName: 'Origin',
      description: 'Case origin (e.g., Phone, Email, Web)',
      required: false,
    }),
    priority: Property.ShortText({
      displayName: 'Priority',
      description: 'Case priority (e.g., Low, Medium, High)',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Case type (e.g., Question, Problem, Feature Request)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the case',
      required: false,
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the related Contact',
      required: false,
    }),
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'ID of the related Account',
      required: false,
    }),
    reason: Property.ShortText({
      displayName: 'Reason',
      description: 'Reason for case creation',
      required: false,
    }),
    suppliedEmail: Property.ShortText({
      displayName: 'Supplied Email',
      description: 'Email address provided when case was created',
      required: false,
    }),
    suppliedName: Property.ShortText({
      displayName: 'Supplied Name',
      description: 'Name provided when case was created',
      required: false,
    }),
    suppliedPhone: Property.ShortText({
      displayName: 'Supplied Phone',
      description: 'Phone number provided when case was created',
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
      subject,
      status,
      origin,
      priority,
      type,
      description,
      contactId,
      accountId,
      reason,
      suppliedEmail,
      suppliedName,
      suppliedPhone,
      additionalFields,
    } = context.propsValue;

    const caseData: Record<string, unknown> = {
      Subject: subject,
      ...(status && { Status: status }),
      ...(origin && { Origin: origin }),
      ...(priority && { Priority: priority }),
      ...(type && { Type: type }),
      ...(description && { Description: description }),
      ...(contactId && { ContactId: contactId }),
      ...(accountId && { AccountId: accountId }),
      ...(reason && { Reason: reason }),
      ...(suppliedEmail && { SuppliedEmail: suppliedEmail }),
      ...(suppliedName && { SuppliedName: suppliedName }),
      ...(suppliedPhone && { SuppliedPhone: suppliedPhone }),
      ...additionalFields,
    };

    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      '/services/data/v56.0/sobjects/Case',
      caseData
    );
    return response.body;
  },
});

