import { Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { employmentHeroPayrollAuth } from '../auth';
import { payrollClient } from './client';

const optionSchema = z.object({
  id: z.number().int(),
  name: z.string().nullish(),
  firstName: z.string().nullish(),
  surname: z.string().nullish(),
  emailAddress: z.string().nullish(),
  fullyQualifiedName: z.string().nullish(),
  startTime: z.string().nullish(),
  employeeId: z.number().nullish(),
});

function dropdown<R extends boolean>({
  displayName,
  resource,
  required,
}: {
  displayName: string;
  resource: string;
  required: R;
}) {
  return Property.Dropdown({
    auth: employmentHeroPayrollAuth,
    displayName,
    required,
    refreshOnSearch: true,
    refreshers: resource === 'business' ? [] : ['businessId'],
    description:
      'Select a record by name, or switch to a dynamic value to map its ID from an earlier step.',
    options: async ({ auth, businessId }, context) => {
      if (!auth)
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Payroll account first.',
        };
      if (resource !== 'business' && !businessId)
        return {
          disabled: true,
          options: [],
          placeholder: 'Select a business first.',
        };
      const path =
        resource === 'business'
          ? '/business'
          : payrollClient.businessPath({ businessId, resource });
      const search = context.searchValue?.trim().replace(/'/g, "''");
      const filter = !search
        ? undefined
        : /^\d+$/.test(search)
        ? `Id eq ${payrollClient.id(search)}`
        : resource === 'employee/details'
        ? `(substringof('${search}',FirstName) or substringof('${search}',Surname) or substringof('${search}',EmailAddress))`
        : resource === 'timesheet'
        ? undefined
        : `substringof('${search}',Name)`;
      const options: { label: string; value: number }[] = [];
      for (let offset = 0; offset < 10000; offset += 100) {
        const records = await payrollClient.list({
          apiKey: auth.secret_text,
          path,
          offset,
          filter,
        });
        for (const record of records) {
          const item = optionSchema.parse(record);
          const name =
            item.fullyQualifiedName ??
            item.name ??
            [item.firstName, item.surname].filter(Boolean).join(' ');
          options.push({
            value: item.id,
            label: `${name || item.startTime || 'Record'}${
              item.emailAddress ? ` (${item.emailAddress})` : ''
            } [${item.id}]`,
          });
        }
        if (records.length < 100) return { options };
      }
      throw new Error(
        'More than 10,000 records are available. Use a List action with filters and map the record ID.'
      );
    },
  });
}

const pagination = {
  limit: Property.Number({
    displayName: 'Page Size',
    description:
      'Returns up to this many records. Use Offset to fetch the next page.',
    required: false,
    defaultValue: 100,
    min: 1,
    max: 100,
  }),
  offset: Property.Number({
    displayName: 'Offset',
    description:
      'Records to skip. Start at 0, then increase by Page Size for each subsequent page.',
    required: false,
    defaultValue: 0,
    min: 0,
  }),
  filter: Property.ShortText({
    displayName: 'Additional OData Filter',
    description:
      'Optional OData v3 expression, for example Id eq 123. Property names must be capitalised. Combined with other filters using AND.',
    required: false,
    advanced: true,
  }),
};

export const payrollProperties = {
  dropdown,
  pagination,
  business: dropdown({
    displayName: 'Business',
    resource: 'business',
    required: true,
  }),
  employee: dropdown({
    displayName: 'Employee',
    resource: 'employee/details',
    required: true,
  }),
};
