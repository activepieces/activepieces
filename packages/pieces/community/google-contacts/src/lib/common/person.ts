import { googleContactsApi } from './index';

const nameKeys = [
  'givenName',
  'middleName',
  'familyName',
  'honorificPrefix',
  'honorificSuffix',
  'phoneticGivenName',
  'phoneticMiddleName',
  'phoneticFamilyName',
];

const organizationKeys = ['name', 'title', 'department'];

function pickKeys({
  source,
  keys,
}: {
  source: Record<string, unknown> | undefined;
  keys: string[];
}): Record<string, unknown> {
  if (source === undefined) {
    return {};
  }
  const kept = Object.entries(source).filter(
    ([key, value]) => keys.includes(key) && value !== undefined && value !== null
  );
  return Object.fromEntries(kept);
}

function firstRecordOf({
  current,
  group,
}: {
  current: Record<string, unknown> | undefined;
  group: string;
}): Record<string, unknown> | undefined {
  const entries = googleContactsApi.readArray({ source: current, path: [group] });
  const head = entries[0];
  if (typeof head !== 'object' || head === null || Array.isArray(head)) {
    return undefined;
  }
  return Object.fromEntries(Object.entries(head));
}

function buildPerson({
  input,
  current,
}: {
  input: ContactInput;
  current?: Record<string, unknown>;
}): { person: Record<string, unknown>; fields: string[] } {
  const person: Record<string, unknown> = {};
  const fields: string[] = [];

  const nameSupplied =
    input.firstName !== undefined ||
    input.middleName !== undefined ||
    input.lastName !== undefined;
  if (nameSupplied) {
    const base = pickKeys({
      source: firstRecordOf({ current, group: 'names' }),
      keys: nameKeys,
    });
    person['names'] = [
      {
        ...base,
        ...(input.firstName === undefined ? {} : { givenName: input.firstName }),
        ...(input.middleName === undefined ? {} : { middleName: input.middleName }),
        ...(input.lastName === undefined ? {} : { familyName: input.lastName }),
      },
    ];
    fields.push('names');
  }

  if (input.nickname !== undefined) {
    person['nicknames'] = [{ value: input.nickname }];
    fields.push('nicknames');
  }

  if (input.emails !== undefined && input.emails.length > 0) {
    person['emailAddresses'] = input.emails.map((value) => ({ value }));
    fields.push('emailAddresses');
  }

  if (input.phoneNumbers !== undefined && input.phoneNumbers.length > 0) {
    person['phoneNumbers'] = input.phoneNumbers.map((value) => ({ value }));
    fields.push('phoneNumbers');
  }

  const organizationSupplied =
    input.company !== undefined || input.jobTitle !== undefined;
  if (organizationSupplied) {
    const base = pickKeys({
      source: firstRecordOf({ current, group: 'organizations' }),
      keys: organizationKeys,
    });
    person['organizations'] = [
      {
        ...base,
        ...(input.company === undefined ? {} : { name: input.company }),
        ...(input.jobTitle === undefined ? {} : { title: input.jobTitle }),
      },
    ];
    fields.push('organizations');
  }

  if (input.biography !== undefined) {
    person['biographies'] = [
      { value: input.biography, contentType: 'TEXT_PLAIN' },
    ];
    fields.push('biographies');
  }

  return { person, fields };
}

function valuesOf({
  person,
  group,
}: {
  person: unknown;
  group: string;
}): string[] {
  const entries = googleContactsApi.readArray({ source: person, path: [group] });
  const values = entries.map((entry) =>
    googleContactsApi.readString({ source: entry, path: ['value'] })
  );
  return values.filter((value): value is string => value !== undefined);
}

function summarizePerson({ person }: { person: unknown }): Record<string, unknown> {
  const name = googleContactsApi.readArray({ source: person, path: ['names'] })[0];
  const organization = googleContactsApi.readArray({
    source: person,
    path: ['organizations'],
  })[0];
  const source = googleContactsApi.readArray({
    source: person,
    path: ['metadata', 'sources'],
  })[0];
  return {
    resourceName: googleContactsApi.readString({ source: person, path: ['resourceName'] }),
    etag: googleContactsApi.readString({ source: person, path: ['etag'] }),
    displayName: googleContactsApi.readString({ source: name, path: ['displayName'] }),
    givenName: googleContactsApi.readString({ source: name, path: ['givenName'] }),
    familyName: googleContactsApi.readString({ source: name, path: ['familyName'] }),
    emails: valuesOf({ person, group: 'emailAddresses' }),
    phoneNumbers: valuesOf({ person, group: 'phoneNumbers' }),
    company: googleContactsApi.readString({ source: organization, path: ['name'] }),
    jobTitle: googleContactsApi.readString({ source: organization, path: ['title'] }),
    updateTime: googleContactsApi.readString({ source: source, path: ['updateTime'] }),
  };
}

export const googleContactsPerson = {
  buildPerson,
  summarizePerson,
};

export type ContactInput = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  nickname?: string;
  emails?: string[];
  phoneNumbers?: string[];
  company?: string;
  jobTitle?: string;
  biography?: string;
};
