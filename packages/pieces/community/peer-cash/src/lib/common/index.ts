import {
  CashClient,
  CashCapabilities,
  CurrencyType,
  createCashClient,
} from '@zkp2p/cash';
import { Property } from '@activepieces/pieces-framework';
import { parseUnits } from 'viem';

const client = createCashClient({
  environment: 'production',
  referrer: 'activepieces',
});

const capabilities = client.capabilities();

export function getCashClient(referralCode?: string): CashClient {
  if (!referralCode) {
    return client;
  }
  return createCashClient({
    environment: 'production',
    referrer: 'activepieces',
    referralCode,
  });
}

export function getCashCapabilities(): CashCapabilities {
  return capabilities;
}

export function currencyProperty() {
  return Property.StaticDropdown({
    displayName: 'Fiat Currency',
    description: 'The fiat currency the recipient should receive.',
    required: true,
    options: {
      disabled: false,
      options: capabilities.currencies.map((currency) => ({
        label: currency,
        value: currency,
      })),
    },
  });
}

export function platformProperty(required: boolean) {
  return Property.StaticDropdown({
    displayName: 'Payment Platform',
    description: 'A payout platform listed by Peer Cash capabilities.',
    required,
    options: {
      disabled: false,
      options: capabilities.platforms.map((platform) => ({
        label: platform.platform,
        value: platform.platform,
      })),
    },
  });
}

export function referralCodeProperty() {
  return Property.ShortText({
    displayName: 'Peer Referral Code',
    description:
      'Optional six-character Peer referral code for integration attribution.',
    required: false,
  });
}

export function resolveCurrency(value: string): CurrencyType {
  const currency = capabilities.currencies.find(
    (candidate) => candidate === value
  );
  if (!currency) {
    throw new Error(`Unsupported fiat currency: ${value}`);
  }
  return currency;
}

export function assertPlatformCurrency(
  platformName: string,
  currency: CurrencyType
): void {
  const platform = capabilities.platforms.find(
    (candidate) => candidate.platform === platformName
  );
  if (!platform) {
    throw new Error(`Unsupported payment platform: ${platformName}`);
  }
  if (!platform.currencies.includes(currency)) {
    throw new Error(`${platformName} does not support ${currency}`);
  }
}

export function parseUsdc(value: string, fieldName: string): bigint {
  const amount = parseUnits(value, capabilities.token.decimals);
  if (amount <= 0n) {
    throw new Error(`${fieldName} must be greater than zero`);
  }
  return amount;
}

export function parseOptionalUsdc(
  value: string | undefined,
  fieldName: string
): bigint | undefined {
  if (!value) {
    return undefined;
  }
  return parseUsdc(value, fieldName);
}

export function toSerializable(value: unknown): unknown {
  const serialized: unknown = JSON.parse(
    JSON.stringify(value, (_key, item: unknown) =>
      typeof item === 'bigint' ? item.toString() : item
    )
  );
  return serialized;
}
