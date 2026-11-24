import { createAction, Property } from '@activepieces/pieces-framework';
import { firstTouchAuth } from '../auth';
import { firstTouchClient } from '../common/client';
import { linkedinUtils } from '../common/linkedin';
import { firstTouchProps } from '../common/props';
import { readUtils } from '../common/read';

export const enrollContactInFlowAction = createAction({
  auth: firstTouchAuth,
  name: 'enroll_contact_in_flow',
  classification: 'WRITE',
  displayName: 'Enroll Contact in Flow',
  description: 'Add a contact to a FirstTouch flow.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds one contact to an existing FirstTouch flow (a multi-step LinkedIn and email sequence). Identify the contact by email, LinkedIn profile URL, or first name + last name + company domain; custom variables fill ft.custom.* placeholders in the flow. Use Send Message or Send Connection Request instead for a single one-off step. Each call adds a new enrollment candidate, so retries can duplicate.',
    idempotent: false,
  },
  props: {
    flow: firstTouchProps.flowDropdown({ description: 'The FirstTouch flow to add the contact to.' }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'For example https://www.linkedin.com/in/jane-doe.',
      required: false,
    }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    company_domain: Property.ShortText({
      displayName: 'Company Domain',
      description: 'For example acme.com. Needed with first and last name when there is no email or LinkedIn URL.',
      required: false,
    }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    custom_variables: Property.Object({
      displayName: 'Custom Variables',
      description: 'Values for the flow\'s custom inputs, by name. For example a "job_title" value fills the ft.custom.job_title placeholder in the flow\'s messages.',
      required: false,
    }),
    enrollment_mode: Property.StaticDropdown({
      displayName: 'Enrollment Mode',
      description: "Leave empty to use the flow's own setting.",
      required: false,
      options: {
        options: [
          { label: 'Add to Awaiting only', value: 'manual' },
          { label: 'Start now (flow must be published)', value: 'enroll' },
        ],
      },
    }),
    skip_exclusion_check: Property.Checkbox({
      displayName: 'Skip Exclusion Check',
      description: 'Enroll even if the contact matches one of your FirstTouch exclusions.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const email = linkedinUtils.emptyToUndefined(props.email);
    const firstName = linkedinUtils.emptyToUndefined(props.first_name);
    const lastName = linkedinUtils.emptyToUndefined(props.last_name);
    const domain = linkedinUtils.emptyToUndefined(props.company_domain);
    const rawLinkedin = linkedinUtils.emptyToUndefined(props.linkedin_url);
    if (!email && !rawLinkedin && !(firstName && lastName && domain)) {
      throw new Error('Provide an email, a LinkedIn profile URL, or first name + last name + company domain.');
    }
    const customVariables = Object.fromEntries(
      Object.entries(props.custom_variables ?? {}).filter(([key]) => key.trim() !== '').map(([key, value]) => [key.trim(), readUtils.text(value) ?? '']),
    );
    const response = await firstTouchClient.callTool({
      apiKey: context.auth.secret_text,
      tool: 'add_manual_flow_enrollment',
      body: {
        flowPlanId: props.flow,
        includeWorkspaceRefresh: false,
        ...(props.enrollment_mode ? { enrollmentMode: props.enrollment_mode } : {}),
        manualEnrollment: {
          prospect: {
            firstName: firstName ?? null,
            lastName: lastName ?? null,
            email: email ?? null,
            linkedinUrl: rawLinkedin ? linkedinUtils.profileUrl(rawLinkedin) : null,
            phone: linkedinUtils.emptyToUndefined(props.phone) ?? null,
          },
          company: { domain: domain ?? null, linkedinUrl: null, linkedinId: null },
          options: { ignoreExclusionCheck: props.skip_exclusion_check === true },
          ...(Object.keys(customVariables).length > 0 ? { customVariables } : {}),
        },
      },
    });
    return {
      ...readUtils.flatten({ value: response }),
      enrollments_url: readUtils.linkUrl({ response, label: 'Open flow enrollments' }),
    };
  },
});
