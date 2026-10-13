import { EntitySchema } from 'typeorm';
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common';

export type CreditKind = 'ai' | 'email';

export interface SynkraCreditLot {
  id: string;
  created: string;
  updated: string;
  userId: string;
  platformId: string;
  kind: CreditKind;
  amountPurchased: number;
  amountRemaining: number;
  amountUsed: number;
  pricePaidZar: number;
  paystackReference: string;
  expiresAt: Date;
  expired: boolean;
  metadata: Record<string, unknown>;
}

export const SynkraCreditLotEntity = new EntitySchema<SynkraCreditLot>({
  name: 'synkra_credit_lot',
  columns: {
    ...BaseColumnSchemaPart,
    userId: ApIdSchema,
    platformId: ApIdSchema,
    kind: { type: String },
    amountPurchased: { type: 'int' },
    amountRemaining: { type: 'int' },
    amountUsed: { type: 'int', default: 0 },
    pricePaidZar: { type: 'int' },
    paystackReference: { type: String, nullable: false },
    expiresAt: { type: 'timestamptz' },
    expired: { type: Boolean, default: false },
    metadata: { type: 'jsonb', default: {} },
  },
  indices: [
    { name: 'idx_credit_lot_user_kind', columns: ['userId', 'kind'] },
    { name: 'idx_credit_lot_ref', columns: ['paystackReference'], unique: true },
    { name: 'idx_credit_lot_expires', columns: ['expiresAt'] },
    { name: 'idx_credit_lot_expired', columns: ['expired'] },
  ],
});
