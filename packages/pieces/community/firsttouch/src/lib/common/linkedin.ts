import { Property } from '@activepieces/pieces-framework';
import { firstTouchClient } from './client';
import { readUtils } from './read';

function profileUrl(raw: unknown): string {
  const value = String(raw ?? '').trim();
  const match = value.match(PROFILE_PATTERN);
  if (!match) {
    throw new Error(
      `"${value || '(blank)'}" is not a LinkedIn profile URL for a person. Use a URL like https://www.linkedin.com/in/jane-doe (company pages and post links do not work).`,
    );
  }
  return `https://www.linkedin.com/in/${match[1]}`;
}

function contactProps() {
  return {
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: "The contact's LinkedIn profile URL, e.g. https://www.linkedin.com/in/jane-doe.",
      required: true,
    }),
    first_name: Property.ShortText({ displayName: 'First Name', required: true }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: true }),
  };
}

function optionalContextProps() {
  return {
    email: Property.ShortText({ displayName: 'Email', required: false }),
    company_domain: Property.ShortText({
      displayName: 'Company Domain',
      description: 'For example acme.com.',
      required: false,
    }),
    reason: Property.LongText({
      displayName: 'Reason / Context',
      description: 'Shown to the approver in FirstTouch: why this contact and where they came from.',
      required: false,
    }),
    require_approval: Property.Checkbox({
      displayName: 'Require Approval',
      description: 'When on, the step waits in FirstTouch Tasks until someone approves it.',
      required: false,
      defaultValue: true,
    }),
  };
}

async function startContactSequence({
  apiKey,
  actionType,
  label,
  props,
  extra,
}: {
  apiKey: string;
  actionType: string;
  label: string;
  props: ContactSequenceProps;
  extra: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const linkedInUrl = profileUrl(props.linkedin_url);
  const firstName = (props.first_name ?? '').trim();
  const lastName = (props.last_name ?? '').trim();
  if (!firstName || !lastName) {
    throw new Error("FirstTouch needs the contact's First Name and Last Name to start this step.");
  }
  const response = await firstTouchClient.callTool({
    apiKey,
    tool: 'create_contact_sequence',
    body: {
      action: {
        type: actionType,
        assignedUserId: emptyToUndefined(props.sender),
        isHumanApprovalRequired: props.require_approval !== false,
        ...extra,
      },
      contact: { firstName, lastName, email: emptyToUndefined(props.email), linkedInUrl },
      company: { domain: emptyToUndefined(props.company_domain) },
      sourceDescription: emptyToUndefined(props.reason) ?? `${label} from Activepieces`,
    },
  });
  return { ...readUtils.flatten({ value: response }), task_url: readUtils.linkUrl({ response, label: 'Open task' }) };
}

function emptyToUndefined(value: string | undefined | null): string | undefined {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? undefined : trimmed;
}

const PROFILE_PATTERN = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?(?:www\.)?linkedin\.com\/in\/([^/?#\s]+)/i;

export const linkedinUtils = { profileUrl, contactProps, optionalContextProps, startContactSequence, emptyToUndefined };

export type ContactSequenceProps = {
  linkedin_url: string;
  first_name: string;
  last_name: string;
  sender?: string;
  email?: string;
  company_domain?: string;
  reason?: string;
  require_approval?: boolean;
};
