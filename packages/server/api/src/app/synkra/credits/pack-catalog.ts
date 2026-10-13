/**
 * Add-on pack catalog. Source of truth for prices and sizes.
 * Kept in code so we never charge a price that isn't in the catalog.
 */
import { CreditKind } from './credit-lot.entity';

export type AddonPack = {
  id: string;
  kind: CreditKind;
  amount: number;
  priceZar: number;
  label: string;
  description: string;
};

export const ADDON_PACKS: AddonPack[] = [
  // AI credits
  { id: 'ai-1k', kind: 'ai', amount: 1_000, priceZar: 50, label: '1,000 AI credits', description: 'Roughly 330 chat messages' },
  { id: 'ai-2k', kind: 'ai', amount: 2_000, priceZar: 100, label: '2,000 AI credits', description: 'Roughly 660 chat messages' },
  { id: 'ai-5k', kind: 'ai', amount: 5_000, priceZar: 250, label: '5,000 AI credits', description: 'Roughly 1,650 chat messages' },
  { id: 'ai-10k', kind: 'ai', amount: 10_000, priceZar: 500, label: '10,000 AI credits', description: 'Roughly 3,300 chat messages' },
  { id: 'ai-20k', kind: 'ai', amount: 20_000, priceZar: 1_000, label: '20,000 AI credits', description: 'Roughly 6,600 chat messages' },
  // Emails
  { id: 'email-1k', kind: 'email', amount: 1_000, priceZar: 50, label: '1,000 emails', description: 'Transactional emails' },
  { id: 'email-2k', kind: 'email', amount: 2_000, priceZar: 100, label: '2,000 emails', description: 'Transactional emails' },
  { id: 'email-5k', kind: 'email', amount: 5_000, priceZar: 250, label: '5,000 emails', description: 'Transactional emails' },
  { id: 'email-10k', kind: 'email', amount: 10_000, priceZar: 500, label: '10,000 emails', description: 'Transactional emails' },
  { id: 'email-20k', kind: 'email', amount: 20_000, priceZar: 1_000, label: '20,000 emails', description: 'Transactional emails' },
];

export function getPack(packId: string): AddonPack | null {
  return ADDON_PACKS.find((p) => p.id === packId) ?? null;
}

/**
 * Credits expire 12 months after purchase.
 */
export const CREDIT_LOT_VALIDITY_DAYS = 365;

export function computeExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + CREDIT_LOT_VALIDITY_DAYS * 86_400_000);
}
