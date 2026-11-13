import { folkFields } from './fields';

function personBody({ props }: { props: LegacyPersonProps }): Record<string, unknown> {
  const text = Object.fromEntries(
    PERSON_TEXT_KEYS.flatMap((key) => {
      const value = folkFields.textValue({ value: props[key] });
      return value === undefined ? [] : [[key, value]];
    })
  );
  const companyIds = (props.companyIds ?? []).filter((id): id is string => typeof id === 'string' && id.length > 0);
  const companyNames = folkFields.nonEmptyArrayPropValues({ value: props.companyNames }) ?? [];
  const companies = [...companyIds.map((id) => ({ id })), ...companyNames.map((name) => ({ name }))];
  return {
    ...text,
    ...(companies.length > 0 ? { companies } : {}),
    ...contactLists({ props }),
    ...(props.groupId ? { groups: [{ id: props.groupId }] } : {}),
  };
}

function companyBody({ props }: { props: LegacyCompanyProps }): Record<string, unknown> {
  const text = Object.fromEntries(
    COMPANY_TEXT_KEYS.flatMap((key) => {
      const value = folkFields.textValue({ value: props[key] });
      return value === undefined ? [] : [[key, value]];
    })
  );
  return {
    ...text,
    ...contactLists({ props }),
    ...(props.groupId ? { groups: [{ id: props.groupId }] } : {}),
  };
}

function contactLists({ props }: { props: ContactListProps }): Record<string, string[]> {
  return Object.fromEntries(
    CONTACT_LIST_KEYS.flatMap((key) => {
      const values = folkFields.nonEmptyArrayPropValues({ value: props[key] });
      return values === undefined ? [] : [[key, values]];
    })
  );
}

const PERSON_TEXT_KEYS = ['firstName', 'lastName', 'fullName', 'description', 'birthday', 'jobTitle'] as const;
const COMPANY_TEXT_KEYS = ['name', 'description', 'industry'] as const;
const CONTACT_LIST_KEYS = ['addresses', 'emails', 'phones', 'urls'] as const;

export const folkLegacy = { personBody, companyBody };

type ContactListProps = {
  addresses?: unknown;
  emails?: unknown;
  phones?: unknown;
  urls?: unknown;
};

type LegacyPersonProps = ContactListProps & {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  description?: string;
  birthday?: string;
  jobTitle?: string;
  companyIds?: unknown[];
  companyNames?: unknown;
  groupId?: string;
};

type LegacyCompanyProps = ContactListProps & {
  name?: string;
  description?: string;
  industry?: string;
  groupId?: string;
};
