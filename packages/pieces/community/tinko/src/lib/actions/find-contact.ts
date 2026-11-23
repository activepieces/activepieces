import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoContact, tinkoClient } from '../common/client';
import { tinkoOutput } from '../common/output';

const FULL_NUMBER_MIN_DIGITS = 8;
const MAX_CANDIDATES = 500;

export const findContactAction = createAction({
  auth: tinkoAuth,
  name: 'find_contact',
  classification: 'SEARCH',
  displayName: 'Find Contact',
  description: 'Finds contacts by phone number or name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search Tinko contacts by phone number (any format, with or without country code) or by part of the name, and return the matches newest first. Use it to get a contact ID before Update Contact, Add Tag to Contact or Add Note to Contact. Read only and safe to retry.',
    idempotent: true,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Phone number to look for, in any format, for example 5511999999999 or +55 11 99999-9999. A number with fewer than 8 digits matches every contact whose phone contains those digits.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Part of the contact name to look for, for example Jane.',
      required: false,
    }),
  },
  async run(context) {
    const phone = context.propsValue.phone?.trim() ?? '';
    const name = context.propsValue.name?.trim() ?? '';
    if (phone === '' && name === '') {
      throw new Error('Fill in the phone number, the name, or both.');
    }
    const token = context.auth.secret_text;
    const contacts =
      phone === ''
        ? await search({ token, queryParams: { name } })
        : await searchByPhone({ token, phone, name });
    return contacts.map(tinkoOutput.contact);
  },
});

async function searchByPhone({
  token,
  phone,
  name,
}: {
  token: string;
  phone: string;
  name: string;
}): Promise<TinkoContact[]> {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) {
    return search({ token, queryParams: { phone, name } });
  }
  const byLastDigits = await search({ token, queryParams: { phone: digits.slice(-4), name } });
  const matches = byLastDigits.filter((contact) => phoneMatches({ stored: contact.phone, wanted: digits }));
  if (matches.length > 0) {
    return matches;
  }
  const byRawValue = await search({ token, queryParams: { phone, name } });
  return byRawValue.filter((contact) => phoneMatches({ stored: contact.phone, wanted: digits }));
}

async function search({
  token,
  queryParams,
}: {
  token: string;
  queryParams: Record<string, string>;
}): Promise<TinkoContact[]> {
  return tinkoClient.listAll<TinkoContact>({
    token,
    path: '/contacts',
    queryParams,
    maxItems: MAX_CANDIDATES,
  });
}

function phoneMatches({ stored, wanted }: { stored: string; wanted: string }): boolean {
  const storedDigits = stored.replace(/\D/g, '');
  if (storedDigits === '') {
    return false;
  }
  if (wanted.length < FULL_NUMBER_MIN_DIGITS) {
    return storedDigits.includes(wanted);
  }
  const candidates = [wanted, withBrazilianNinthDigit(wanted)];
  return candidates.some(
    (candidate) =>
      storedDigits === candidate ||
      storedDigits.endsWith(candidate) ||
      candidate.endsWith(storedDigits)
  );
}

function withBrazilianNinthDigit(digits: string): string {
  const national = digits.startsWith('55') && digits.length === 12 ? digits.slice(2) : digits;
  if (national.length !== 10 || !/^[1-9]{2}[6-9]/.test(national)) {
    return digits;
  }
  return `55${national.slice(0, 2)}9${national.slice(2)}`;
}
