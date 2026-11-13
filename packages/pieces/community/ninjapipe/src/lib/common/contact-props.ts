import { Property } from '@activepieces/pieces-framework';
import { NinjaPipeAuth, NinjaPipeRecord } from './client';
import { ninjapipeFields } from './fields';
import { ninjapipeProps } from './props';

function contactProps({ emailRequired }: { emailRequired: boolean }) {
  return {
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: emailRequired
      ? Property.ShortText({ displayName: 'Email', description: 'Email address of the contact. NinjaPipe allows one contact per email.', required: true })
      : Property.ShortText({ displayName: 'Email', description: 'Email address of the contact. NinjaPipe allows one contact per email.', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    status: Property.ShortText({ displayName: 'Status', description: 'Contact status, e.g. Active or Lead.', required: false }),
    companyId: ninjapipeProps.companyOptional(),
    owner: ninjapipeProps.member({ displayName: 'Owner', description: 'Workspace member who owns the contact (owner_id). Defaults to the API key owner.' }),
    assignedTo: ninjapipeProps.member({ displayName: 'Assigned To', description: 'Workspace member shown as "Assign to" in NinjaPipe (assigned_to).' }),
    customFields: ninjapipeProps.customFields({ update: false }),
  };
}

function contactBody(p: ContactInput): NinjaPipeRecord {
  return ninjapipeFields.compact({
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
    phone: p.phone,
    status: p.status,
    company_id: p.companyId,
    owner_id: p.owner,
    assigned_to: p.assignedTo,
    fields: ninjapipeFields.readCustomFields(p.customFields),
  });
}

async function contactUpdateBody({
  auth,
  contactPath,
  p,
  clear,
}: {
  auth: NinjaPipeAuth;
  contactPath: string;
  p: ContactInput;
  clear: unknown;
}): Promise<NinjaPipeRecord> {
  const fields = await ninjapipeFields.mergeCustomFields({ auth, path: contactPath, fields: p.customFields, operation: 'read contact' });
  const body = ninjapipeFields.compact({ ...contactBody({ ...p, customFields: undefined }), fields });
  return ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body, clear }), what: 'contact' });
}

const CONTACT_CLEARABLE: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  phone: 'Phone',
  company_id: 'Company',
  assigned_to: 'Assigned To',
};

export const ninjapipeContacts = { contactProps, contactBody, contactUpdateBody, CONTACT_CLEARABLE };

export type ContactInput = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  status?: unknown;
  companyId?: unknown;
  owner?: unknown;
  assignedTo?: unknown;
  customFields?: unknown;
};
