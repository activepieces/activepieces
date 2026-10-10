import { EntitySchema } from 'typeorm';
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common';

/**
 * Synkra Agency Programme.
 *
 * An Agency is a distributor of Synkra Flow. The agency has its own
 * workspace (the owner's personal project) and creates isolated client
 * environments (team projects) for the businesses it manages.
 *
 * The agency owner pays:
 *   - A monthly agency platform fee (R699 / R1,499 / R2,999)
 *   - Wholesale Flow subscription per active client environment
 *
 * The agency then charges its own clients whatever it wants.
 */
export interface SynkraAgency {
  id: string;
  created: string;
  updated: string;
  ownerUserId: string;
  platformId: string;
  name: string;
  tier: string; // 'agency_20' | 'agency_100' | 'agency_500'
  status: string; // 'draft' | 'active' | 'suspended' | 'cancelled'
  clientEnvironmentsLimit: number;
  wholesaleDiscount: number; // 0.35 | 0.40 | 0.40
  branding: Record<string, unknown>;
  metadata: Record<string, unknown>;
  activatedAt: Date | null;
  cancelledAt: Date | null;
}

export const SynkraAgencyEntity = new EntitySchema<SynkraAgency>({
  name: 'synkra_agency',
  columns: {
    ...BaseColumnSchemaPart,
    ownerUserId: ApIdSchema,
    platformId: ApIdSchema,
    name: { type: String, default: '' },
    tier: { type: String, default: 'agency_20' },
    status: { type: String, default: 'draft' },
    clientEnvironmentsLimit: { type: 'int', default: 20 },
    wholesaleDiscount: { type: 'float', default: 0.35 },
    branding: { type: 'jsonb', default: {} },
    metadata: { type: 'jsonb', default: {} },
    activatedAt: { type: 'timestamptz', nullable: true },
    cancelledAt: { type: 'timestamptz', nullable: true },
  },
  indices: [
    { name: 'idx_synkra_agency_owner', columns: ['ownerUserId'], unique: true },
    { name: 'idx_synkra_agency_platform', columns: ['platformId'] },
    { name: 'idx_synkra_agency_status', columns: ['status'] },
  ],
});
