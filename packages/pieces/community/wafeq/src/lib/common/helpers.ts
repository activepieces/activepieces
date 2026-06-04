import { LineItemInput } from './props';

export const wafeqHelpers = {
  toDate(value: string | undefined | null): string | undefined {
    if (!value) return undefined;
    return value.slice(0, 10);
  },

  stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null || v === '') continue;
      out[k] = v;
    }
    return out;
  },

  mapLineItems({
    items,
    defaultAccount,
    defaultTaxRate,
  }: {
    items: LineItemInput[] | undefined;
    defaultAccount?: string;
    defaultTaxRate?: string;
  }): Record<string, unknown>[] {
    if (!items || items.length === 0) return [];
    return items.map((line) => {
      const account = line.account || defaultAccount;
      if (!account) {
        throw new Error(
          'Every line needs an account. Choose a "Default Account" at the top of the action, or fill in the Account ID on each line.',
        );
      }
      return wafeqHelpers.stripEmpty({
        item: line.item,
        description: line.description,
        quantity: line.quantity,
        unit_amount: line.unit_amount,
        account,
        tax_rate: line.tax_rate || defaultTaxRate,
        discount: line.discount,
      });
    });
  },
};
