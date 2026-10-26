import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, reformatDate } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieInput } from '../common/props';
import { moxieCRMAuth } from '../auth';
import { createProjectActionOutputSchema } from '../output-schemas';

export const moxieCreateProjectAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_project',
  classification: 'WRITE',
  description: 'Creates a new project in moxie CRM.',
  displayName: 'Create a Project',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a new project in Moxie CRM under an existing client, including its fee schedule (hourly, fixed price, retainer, or per item), portal access level, and dates. Use when starting a new engagement for a known client. The Client must already exist and is matched by exact client name. Not idempotent: each call creates a separate project.',
    idempotent: false,
  },
  outputSchema: createProjectActionOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    clientName: moxieDropdowns.clientName({ required: true }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Please enter date in YYYY-MM-DD format.',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Please enter date in YYYY-MM-DD format.',
      required: false,
    }),
    portalAccess: Property.StaticDropdown({
      displayName: 'Client Portal Access',
      description: 'One of: None, Overview, Full access, or Read only.',
      required: true,
      defaultValue: 'Read only',
      options: {
        options: [
          {
            label: 'Not Visible',
            value: 'None',
          },
          {
            label: 'Overview only',
            value: 'Overview',
          },
          {
            label: 'Read only project collaboration',
            value: 'Read only',
          },
          {
            label: 'Full project collaboration',
            value: 'Full access',
          },
        ],
      },
    }),
    showTimeWorkedInPortal: Property.Checkbox({
      displayName: 'Show time worked in portal ?',
      required: false,
      defaultValue: true,
    }),
    feeType: Property.StaticDropdown({
      displayName: 'Fee Type',
      description: 'One of: Hourly, Fixed Price, Retainer, Per Item.',
      required: true,
      options: {
        options: [
          {
            label: 'Hourly',
            value: 'Hourly',
          },
          {
            label: 'Fixed Price',
            value: 'Fixed Price',
          },
          {
            label: 'Retainer',
            value: 'Retainer',
          },
          {
            label: 'Per Item',
            value: 'Per Item',
          },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
      defaultValue: 0,
    }),
    estimateMax: Property.Number({
      displayName: 'Estimate maximum Amount',
      required: false,
      defaultValue: 0,
    }),
    estimateMin: Property.Number({
      displayName: 'Estimate minimum Amount',
      required: false,
      defaultValue: 0,
    }),
    taxable: Property.Checkbox({
      displayName: 'Is amount taxable ?',
      required: false,
      defaultValue: false,
    }),
    templateName: Property.ShortText({
      displayName: 'Project Template',
      description: 'Exact name of a project template to copy tasks and settings from. Leave empty for none.',
      required: false,
    }),
    customValues: Property.Object({
      displayName: 'Custom Values',
      description: 'Custom project field values keyed by field name.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      name,
      clientName,
      portalAccess,
      showTimeWorkedInPortal,
      feeType,
      amount,
      estimateMax,
      estimateMin,
      taxable,
    } = propsValue;
    const dueDate = reformatDate(propsValue.dueDate);
    const startDate = reformatDate(propsValue.startDate);
    const templateName = moxieInput.text({ value: propsValue.templateName });
    const customValues = moxieInput.record({ value: propsValue.customValues, field: 'Custom Values' });
    const client = await makeClient(auth);
    return await client.createProject({
      name,
      clientName: moxieInput.requiredText({ value: clientName, field: 'Client' }),
      startDate,
      dueDate,
      portalAccess,
      showTimeWorkedInPortal,
      feeSchedule: {
        feeType,
        amount,
        estimateMax,
        estimateMin,
        taxable,
      },
      ...(templateName === undefined ? {} : { templateName }),
      ...(customValues === undefined ? {} : { customValues }),
    });
  },
});
