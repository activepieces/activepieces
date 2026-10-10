import { EntitySchema } from 'typeorm';
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common';

/**
 * A Client Environment inside an Agency.
 *
 * Each client environment IS a Flow project. This row links the project
 * to the agency that owns it, and holds the wholesale pricing info.
 *
 * Isolation is handled by Flow's existing project system — the client
 * env's data, workflows, connections, credentials, and usage are all
 * scoped to its projectId and are never visible to other clients.
 */
export interface SynkraAgencyClient {
  id: string;
  created: string;
  updated: string;
  agencyId: string;
  projectId: string;
  name: string;
  status: string; // 'draft' | 'active' | 'suspended' | 'transferred'
  clientTier: string; // 'starter' | 'business' | 'pro' (the client's effective plan)
  wholesaleMonthlyZar: number; // what the agency pays Synkra for this client
  metadata: Record<string, unknown>;
  activatedAt: Date | null;
  portalToken: string | null;
  portalEnabled: boolean;
  portalLastViewedAt: Date | null;
  clientPriceZar: number | null;
}

export const SynkraAgencyClientEntity = new EntitySchema<SynkraAgencyClient>({
  name: 'synkra_agency_client',
  columns: {
    ...BaseColumnSchemaPart,
    agencyId: ApIdSchema,
    projectId: ApIdSchema,
    name: { type: String, default: '' },
    status: { type: String, default: 'draft' },
    clientTier: { type: String, default: 'starter' },
    wholesaleMonthlyZar: { type: 'int', default: 0 },
    metadata: { type: 'jsonb', default: {} },
    activatedAt: { type: 'timestamptz', nullable: true },
    portalToken: { type: String, nullable: true },
    portalEnabled: { type: Boolean, default: false },
    portalLastViewedAt: { type: 'timestamptz', nullable: true },
    clientPriceZar: { type: 'int', nullable: true },
  },
  indices: [
    { name: 'idx_synkra_client_agency', columns: ['agencyId'] },
    { name: 'idx_synkra_client_project', columns: ['projectId'], unique: true },
    { name: 'idx_synkra_client_status', columns: ['status'] },
  ],
});
