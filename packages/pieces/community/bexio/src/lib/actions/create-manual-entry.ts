import { createAction, Property, DynamicPropsValue, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';
import { bexioCommonProps } from '../common/props';
import { BexioManualEntry, BexioManualEntryResponse } from '../common/types';

export const createManualEntryAction = createAction({
  auth: bexioAuth,
  name: 'create_manual_entry',
  displayName: 'Create Manual Entry',
  description: 'Create a manual accounting entry (single, compound, or group)',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Entry Type',
      description: 'Choose the type of manual entry',
      required: true,
      defaultValue: 'manual_single_entry',
      options: {
        disabled: false,
        options: [
          {
            label: 'Single Entry - Simple one-line booking',
            value: 'manual_single_entry',
          },
          {
            label: 'Compound Entry - Total distributed across multiple accounts',
            value: 'manual_compound_entry',
          },
          {
            label: 'Group Entry - Multiple separate bookings with same reference',
            value: 'manual_group_entry',
          },
        ],
      },
    }),
    date: Property.ShortText({
      displayName: 'Booking Date',
      description: 'Date of the booking (YYYY-MM-DD)',
      required: true,
    }),
    reference_nr: Property.ShortText({
      displayName: 'Reference Number',
      description: 'Reference number for the booking',
      required: false,
    }),
    entryFields: Property.DynamicProperties({
      auth: bexioAuth,
      displayName: 'Entry Details',
      description: 'Configure the entry details based on selected type',
      required: true,
      refreshers: ['type', 'auth'],
      props: async ({ type, auth }, ctx) => {
        const entryType = (type as unknown as string) || 'manual_single_entry';
        
        let accounts: Array<{ id: number; account_no: string; name: string }> = [];
        let taxes: Array<{ id: number; name: string; percentage: string }> = [];
        let currencies: Array<{ id: number; name: string }> = [];

        if (auth) {
          try {
            const client = new BexioClient(auth);
            accounts = await client.get<Array<{ id: number; account_no: string; name: string }>>('/accounts');
            taxes = await client.get<Array<{ id: number; name: string; percentage: string }>>('/taxes');
            currencies = await client.get<Array<{ id: number; name: string }>>('/3.0/currencies');
          } catch (error) {
            console.warn('Failed to fetch accounts/taxes/currencies:', error);
          }
        }

        const accountOptions = accounts.map((acc) => ({
          label: `${acc.account_no} - ${acc.name}`,
          value: acc.id,
        }));

        const taxOptions = taxes.map((tax) => ({
          label: `${tax.name} (${tax.percentage}%)`,
          value: tax.id,
        }));

        const currencyOptions = currencies.map((curr) => ({
          label: curr.name,
          value: curr.id,
        }));

        if (entryType === 'manual_single_entry') {
          return {
            debit_account: accountOptions.length > 0
              ? Property.StaticDropdown({
                  displayName: 'Debit Account',
                  description: 'The account to debit',
                  required: true,
                  options: {
                    disabled: false,
                    options: accountOptions,
                  },
                })
              : Property.Number({
                  displayName: 'Debit Account ID',
                  description: 'The account ID to debit',
                  required: true,
                }),
            credit_account: accountOptions.length > 0
              ? Property.StaticDropdown({
                  displayName: 'Credit Account',
                  description: 'The account to credit',
                  required: true,
                  options: {
                    disabled: false,
                    options: accountOptions,
                  },
                })
              : Property.Number({
                  displayName: 'Credit Account ID',
                  description: 'The account ID to credit',
                  required: true,
                }),
            amount: Property.Number({
              displayName: 'Amount',
              description: 'The transaction amount',
              required: true,
            }),
            description: Property.ShortText({
              displayName: 'Description',
              description: 'Description of the transaction',
              required: false,
            }),
            tax_id: taxOptions.length > 0
              ? Property.StaticDropdown({
                  displayName: 'Tax',
                  description: 'Tax rate (optional)',
                  required: false,
                  options: {
                    disabled: false,
                    options: taxOptions,
                  },
                })
              : Property.Number({
                  displayName: 'Tax ID',
                  description: 'Tax ID (optional)',
                  required: false,
                }),
            tax_account: accountOptions.length > 0
              ? Property.StaticDropdown({
                  displayName: 'Tax Account',
                  description: 'Account for tax calculation',
                  required: false,
                  options: {
                    disabled: false,
                    options: accountOptions,
                  },
                })
              : Property.Number({
                  displayName: 'Tax Account ID',
                  description: 'Account ID for tax calculation',
                  required: false,
                }),
            currency_id: currencyOptions.length > 0
              ? Property.StaticDropdown({
                  displayName: 'Currency',
                  description: 'Currency (optional)',
                  required: false,
                  options: {
                    disabled: false,
                    options: currencyOptions,
                  },
                })
              : Property.Number({
                  displayName: 'Currency ID',
                  description: 'Currency ID (optional)',
                  required: false,
                }),
            currency_factor: Property.Number({
              displayName: 'Currency Factor',
              description: 'Exchange rate factor (defaults to 1)',
              required: false,
            }),
            helper_info: Property.MarkDown({
              value: '',
            }),
            entries: Property.Array({
              displayName: 'Entries',
              description: 'Not used for single entries',
              required: false,
              properties: {},
            }),
          };
        } else {
          const isCompound = entryType === 'manual_compound_entry';
          
          return {
            debit_account: Property.Number({
              displayName: 'Debit Account',
              description: 'Not used for compound/group entries',
              required: false,
            }),
            credit_account: Property.Number({
              displayName: 'Credit Account',
              description: 'Not used for compound/group entries',
              required: false,
            }),
            amount: Property.Number({
              displayName: 'Amount',
              description: 'Not used for compound/group entries',
              required: false,
            }),
            description: Property.ShortText({
              displayName: 'Description',
              description: 'Not used for compound/group entries',
              required: false,
            }),
            tax_id: Property.Number({
              displayName: 'Tax ID',
              description: 'Not used for compound/group entries',
              required: false,
            }),
            tax_account: Property.Number({
              displayName: 'Tax Account',
              description: 'Not used for compound/group entries',
              required: false,
            }),
            currency_id: Property.Number({
              displayName: 'Currency ID',
              description: 'Not used for compound/group entries',
              required: false,
            }),
            currency_factor: Property.Number({
              displayName: 'Currency Factor',
              description: 'Not used for compound/group entries',
              required: false,
            }),
            helper_info: Property.MarkDown({
              value: isCompound
                ? 'For compound entries, each entry should have EITHER debit_account_id OR credit_account_id (not both).'
                : 'For group entries, each entry must have BOTH debit_account_id and credit_account_id.',
            }),
            entries: Property.Array({
              displayName: 'Entries',
              description: isCompound
                ? 'Multiple entries to distribute the total. Each entry should have either debit_account_id OR credit_account_id (not both).'
                : 'Multiple complete bookings. Each entry must have both debit_account_id and credit_account_id.',
              required: true,
              properties: {
                debit_account_id: accountOptions.length > 0
                  ? Property.StaticDropdown({
                      displayName: 'Debit Account',
                      description: isCompound
                        ? 'Account to debit (leave empty if this is a credit entry)'
                        : 'Account to debit',
                      required: !isCompound,
                      options: {
                        disabled: false,
                        options: accountOptions,
                      },
                    })
                  : Property.Number({
                      displayName: 'Debit Account ID',
                      description: isCompound
                        ? 'Account ID to debit (leave 0 if this is a credit entry)'
                        : 'Account ID to debit',
                      required: !isCompound,
                    }),
                credit_account_id: accountOptions.length > 0
                  ? Property.StaticDropdown({
                      displayName: 'Credit Account',
                      description: isCompound
                        ? 'Account to credit (leave empty if this is a debit entry)'
                        : 'Account to credit',
                      required: !isCompound,
                      options: {
                        disabled: false,
                        options: accountOptions,
                      },
                    })
                  : Property.Number({
                      displayName: 'Credit Account ID',
                      description: isCompound
                        ? 'Account ID to credit (leave 0 if this is a debit entry)'
                        : 'Account ID to credit',
                      required: !isCompound,
                    }),
                amount: Property.Number({
                  displayName: 'Amount',
                  description: 'The transaction amount',
                  required: true,
                }),
                description: Property.ShortText({
                  displayName: 'Description',
                  description: 'Description for this entry',
                  required: false,
                }),
                tax_id: taxOptions.length > 0
                  ? Property.StaticDropdown({
                      displayName: 'Tax',
                      description: 'Tax rate (optional)',
                      required: false,
                      options: {
                        disabled: false,
                        options: taxOptions,
                      },
                    })
                  : Property.Number({
                      displayName: 'Tax ID',
                      description: 'Tax ID (optional)',
                      required: false,
                    }),
                tax_account_id: accountOptions.length > 0
                  ? Property.StaticDropdown({
                      displayName: 'Tax Account',
                      description: 'Account for tax calculation (optional)',
                      required: false,
                      options: {
                        disabled: false,
                        options: accountOptions,
                      },
                    })
                  : Property.Number({
                      displayName: 'Tax Account ID',
                      description: 'Account ID for tax calculation (optional)',
                      required: false,
                    }),
                currency_id: currencyOptions.length > 0
                  ? Property.StaticDropdown({
                      displayName: 'Currency',
                      description: 'Currency (optional)',
                      required: false,
                      options: {
                        disabled: false,
                        options: currencyOptions,
                      },
                    })
                  : Property.Number({
                      displayName: 'Currency ID',
                      description: 'Currency ID (optional)',
                      required: false,
                    }),
                currency_factor: Property.Number({
                  displayName: 'Currency Factor',
                  description: 'Exchange rate factor (defaults to 1)',
                  required: false,
                }),
              },
            }),
          };
        }
      },
    }),
  },
  async run(context) {
    const client = new BexioClient(context.auth);
    const entryType = context.propsValue.type as 'manual_single_entry' | 'manual_compound_entry' | 'manual_group_entry';
    const entryFields = context.propsValue.entryFields as DynamicPropsValue;
    
    let entries: BexioManualEntry[] = [];

    if (entryType === 'manual_single_entry') {
      const entry: BexioManualEntry = {
        debit_account_id: entryFields['debit_account'] as number,
        credit_account_id: entryFields['credit_account'] as number,
        amount: entryFields['amount'] as number,
      };

      if (entryFields['description']) {
        entry.description = entryFields['description'] as string;
      }
      if (entryFields['tax_id']) {
        entry.tax_id = entryFields['tax_id'] as number;
      }
      if (entryFields['tax_account']) {
        entry.tax_account_id = entryFields['tax_account'] as number;
      }
      if (entryFields['currency_id']) {
        entry.currency_id = entryFields['currency_id'] as number;
      }
      if (entryFields['currency_factor']) {
        entry.currency_factor = entryFields['currency_factor'] as number;
      }

      entries = [entry];
    } else {
      const entriesArray = entryFields['entries'] as Array<Record<string, unknown>> | undefined;
      
      if (!entriesArray || entriesArray.length === 0) {
        throw new Error('At least one entry is required for compound or group entries');
      }
      
      entries = entriesArray.map((entry) => {
        const bexioEntry: BexioManualEntry = {
          amount: entry['amount'] as number,
        };

        const debitAccountId = entry['debit_account_id'] as number | undefined;
        if (debitAccountId && debitAccountId !== 0) {
          bexioEntry.debit_account_id = debitAccountId;
        }

        const creditAccountId = entry['credit_account_id'] as number | undefined;
        if (creditAccountId && creditAccountId !== 0) {
          bexioEntry.credit_account_id = creditAccountId;
        }

        if (entry['description']) {
          bexioEntry.description = entry['description'] as string;
        }
        
        const taxId = entry['tax_id'] as number | undefined;
        if (taxId && taxId !== 0) {
          bexioEntry.tax_id = taxId;
        }
        
        const taxAccountId = entry['tax_account_id'] as number | undefined;
        if (taxAccountId && taxAccountId !== 0) {
          bexioEntry.tax_account_id = taxAccountId;
        }
        
        const currencyId = entry['currency_id'] as number | undefined;
        if (currencyId && currencyId !== 0) {
          bexioEntry.currency_id = currencyId;
        }
        
        if (entry['currency_factor']) {
          bexioEntry.currency_factor = entry['currency_factor'] as number;
        }

        return bexioEntry;
      });
    }

    const requestBody = {
      type: entryType,
      date: context.propsValue.date,
      reference_nr: context.propsValue.reference_nr,
      entries,
    };

    const response = await client.post<BexioManualEntryResponse>(
      '/accounts/manual_entries',
      requestBody
    );

    return response;
  },
});

