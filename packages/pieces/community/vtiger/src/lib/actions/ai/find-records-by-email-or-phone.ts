import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { recordList, requiredText } from '../../ai-common';
import { recordListSchema } from '../../output-schemas';
import { vtigerRest } from '../../rest-client';
import { assertModuleName } from '../../vtql';

export function lookupQuery({
  type,
  value,
  modules,
}: {
  type: unknown;
  value: unknown;
  modules: unknown;
}): Record<string, string> {
  if (type !== 'email' && type !== 'phone') {
    throw new Error('Lookup Type must be email or phone');
  }
  const names = Array.isArray(modules)
    ? modules.filter((m) => typeof m === 'string' && m.trim() !== '').map((m) => assertModuleName(m))
    : [];
  return {
    type,
    value: requiredText({ value, label: 'Value' }),
    searchIn: JSON.stringify(names.length > 0 ? names : DEFAULT_LOOKUP_MODULES),
  };
}

export const findRecordsByEmailOrPhoneAction = createAction({
  auth: vtigerAuth,
  name: 'find_records_by_email_or_phone',
  displayName: 'Find Records by Email or Phone',
  description: 'Finds Contacts, Leads or Accounts that have a given email address or phone number.',
  classification: 'SEARCH',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up records by an email address or phone number across every email or phone field of the chosen modules (default Contacts, Leads, Accounts). Prefer it over Search Module Records when you only have an email or phone and do not know which field or module holds it.',
    idempotent: true,
  },
  outputSchema: recordListSchema,
  props: {
    type: Property.StaticDropdown({
      displayName: 'Lookup Type',
      required: true,
      defaultValue: 'email',
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      description: 'The email address or phone number to look for.',
      required: true,
    }),
    modules: Property.Array({
      displayName: 'Modules',
      description: 'Module API names to search in. Defaults to Contacts, Leads and Accounts.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'lookup',
      query: lookupQuery({ type: propsValue.type, value: propsValue.value, modules: propsValue.modules }),
    });
    const records = recordList(result);
    return { records, count: records.length };
  },
});

const DEFAULT_LOOKUP_MODULES = ['Contacts', 'Leads', 'Accounts'];
