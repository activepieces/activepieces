import { createHash } from 'node:crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function normalizeEmail(email: string): string {
  const value = email.trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at <= 0) {
    throw new Error(`"${email}" is not an e-mail address.`);
  }
  const user = value.slice(0, at);
  const domain = value.slice(at + 1);
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  return `${isGmail ? user.replace(/\./g, '') : user}@${domain}`;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 8) {
    throw new Error(`"${phone}" is not a phone number in E.164 form (country code + number, e.g. +5511999999999).`);
  }
  return `+${digits}`;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function identifiersFor(member: MemberInput): UserIdentifier[] {
  const emailIdentifiers: UserIdentifier[] = member.email?.trim()
    ? [{ emailAddress: sha256(normalizeEmail(member.email)) }]
    : [];
  const phoneIdentifiers: UserIdentifier[] = member.phone?.trim()
    ? [{ phoneNumber: sha256(normalizePhone(member.phone)) }]
    : [];
  return [...emailIdentifiers, ...phoneIdentifiers, ...addressIdentifiers(member)];
}

export function toMemberInput(value: unknown): MemberInput {
  if (typeof value !== 'object' || value === null) {
    return {};
  }
  return {
    email: stringField(value, 'email'),
    phone: stringField(value, 'phone'),
    firstName: stringField(value, 'firstName'),
    lastName: stringField(value, 'lastName'),
    countryCode: stringField(value, 'countryCode'),
    postalCode: stringField(value, 'postalCode'),
  };
}

export function buildMemberBatches({ members, limit }: { members: MemberInput[]; limit: number }): MemberBatches {
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('At least one member is required.');
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('The batch limit must be a positive integer.');
  }

  const payloads: AudienceMemberPayload[] = members.map((member, index) => {
    const userIdentifiers = identifiersFor(member ?? {});
    if (userIdentifiers.length === 0) {
      throw new Error(`Member #${index + 1} has no identifier (e-mail, phone or full address).`);
    }
    return { userData: { userIdentifiers } };
  });
  const identifiers = payloads.reduce((total, payload) => total + payload.userData.userIdentifiers.length, 0);

  const batches = Array.from({ length: Math.ceil(payloads.length / limit) }, (_, batch) =>
    payloads.slice(batch * limit, batch * limit + limit)
  );

  return { batches, identifiers };
}

function addressIdentifiers(member: MemberInput): UserIdentifier[] {
  const firstName = member.firstName?.trim() ?? '';
  const lastName = member.lastName?.trim() ?? '';
  const countryCode = member.countryCode?.trim() ?? '';
  const postalCode = member.postalCode?.trim() ?? '';
  const parts = { firstName, lastName, countryCode, postalCode };
  if (Object.values(parts).every((part) => part === '')) {
    return [];
  }
  const missing = Object.entries(parts)
    .filter(([, part]) => part === '')
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(`Address identifiers need first name, last name, country code and postal code together (missing: ${missing.join(', ')}).`);
  }
  return [
    {
      address: {
        givenName: sha256(normalizeName(member.firstName ?? '')),
        familyName: sha256(normalizeName(member.lastName ?? '')),
        regionCode: countryCode.toUpperCase(),
        postalCode,
      },
    },
  ];
}

function stringField(value: object, key: string): string | undefined {
  const field: unknown = Reflect.get(value, key);
  return typeof field === 'string' ? field : undefined;
}

export type MemberInput = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  postalCode?: string;
};

export type UserIdentifier =
  | { emailAddress: string }
  | { phoneNumber: string }
  | { address: { givenName: string; familyName: string; regionCode: string; postalCode: string } };

export type ConsentStatus = 'GRANTED' | 'DENIED' | 'UNSPECIFIED';

export type AudienceMemberPayload = { userData: { userIdentifiers: UserIdentifier[] } };

export type MemberBatches = { batches: AudienceMemberPayload[][]; identifiers: number };
