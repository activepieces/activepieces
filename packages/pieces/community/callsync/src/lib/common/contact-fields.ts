import { Property } from '@activepieces/pieces-framework';

/** Contact details shared by Create Contact and Update Contact. Keys are CallSync API field names. */
export const contactFields = {
  name: Property.ShortText({ displayName: 'Name', required: false }),
  email: Property.ShortText({ displayName: 'Email', required: false }),
  company: Property.ShortText({ displayName: 'Company', required: false }),
  about: Property.ShortText({
    displayName: 'About',
    description: 'A short description of the contact.',
    required: false,
  }),
  sales_note: Property.LongText({ displayName: 'Sales Note', required: false }),
  budget: Property.ShortText({ displayName: 'Budget', required: false }),
  labels: Property.ShortText({
    displayName: 'Labels',
    description: 'Comma-separated, e.g. hot lead, follow-up',
    required: false,
  }),
};

export function splitLabels(labels: string | undefined | null): string[] | undefined {
  const list = String(labels ?? '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

/** A yes/no choice that can also be left alone, so updates never flip a flag by accident. */
export const optionalFlag = (displayName: string, description: string) =>
  Property.StaticDropdown<boolean>({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  });
