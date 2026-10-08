import { EntitySchema } from 'typeorm';
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common';

export interface SynkraSubscription {
  id: string;
  created: string;
  updated: string;
  userId: string;
  tier: string;
  status: string;
  paystackCustomerCode: string | null;
  paystackSubscriptionCode: string | null;
  paystackPlanCode: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  studentVerified: boolean;
  communityVerified: boolean;
  metadata: Record<string, unknown>;
  aiOpsUsed: number;
  smsUsed: number;
  whatsappUsed: number;
  voiceMinutesUsed: number;
  emailsUsed: number;
  storageBytesUsed: string;
  usagePeriodStart: Date | null;
  usagePeriodEnd: Date | null;
}

export const SynkraSubscriptionEntity = new EntitySchema<SynkraSubscription>({
  name: 'synkra_subscription',
  columns: {
    ...BaseColumnSchemaPart,
    userId: ApIdSchema,
    tier: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    paystackCustomerCode: { type: String, nullable: true },
    paystackSubscriptionCode: { type: String, nullable: true },
    paystackPlanCode: { type: String, nullable: true },
    currentPeriodStart: { type: 'timestamptz', nullable: true },
    currentPeriodEnd: { type: 'timestamptz', nullable: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    studentVerified: { type: Boolean, default: false },
    communityVerified: { type: Boolean, default: false },
    metadata: { type: 'jsonb', default: {} },
    aiOpsUsed: { type: 'int', default: 0 },
    smsUsed: { type: 'int', default: 0 },
    whatsappUsed: { type: 'int', default: 0 },
    voiceMinutesUsed: { type: 'int', default: 0 },
    emailsUsed: { type: 'int', default: 0 },
    storageBytesUsed: { type: 'bigint', default: 0 },
    usagePeriodStart: { type: 'timestamptz', nullable: true },
    usagePeriodEnd: { type: 'timestamptz', nullable: true },
  },
  indices: [
    { name: 'idx_synkra_sub_user', columns: ['userId'], unique: true },
    { name: 'idx_synkra_sub_tier', columns: ['tier'] },
  ],
});
