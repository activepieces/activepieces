import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { AGENCY_TIERS, AgencyTier } from './agency.service';
import { SynkraAgency, SynkraAgencyEntity } from './agency.entity';
import { SynkraAgencyClient, SynkraAgencyClientEntity } from './agency-client.entity';

const agencyRepo = repoFactory<SynkraAgency>(SynkraAgencyEntity);
const clientRepo = repoFactory<SynkraAgencyClient>(SynkraAgencyClientEntity);

export type AgencyBillingSummary = {
  agencyId: string;
  tier: string;
  tierName: string;
  status: string;
  agencyFeeZar: number;
  clients: {
    id: string;
    name: string;
    status: string;
    clientTier: string;
    wholesaleMonthlyZar: number;
    publicPriceZar: number;
    savingZar: number;
  }[];
  activeClientCount: number;
  draftClientCount: number;
  suspendedClientCount: number;
  clientWholesaleTotalZar: number;
  clientPublicTotalZar: number;
  clientSavingsTotalZar: number;
  monthlyTotalZar: number;
  nextBillingDate: string | null;
  currency: string;
};

const FLOW_PUBLIC_PRICES: Record<string, number> = {
  starter: 299,
  business: 599,
  pro: 999,
};

export const synkraAgencyBillingService = (log: FastifyBaseLogger) => ({
  async getSummary(agencyId: string): Promise<AgencyBillingSummary> {
    const agency = await agencyRepo().findOneBy({ id: agencyId });
    if (isNil(agency)) {
      throw new ActivepiecesError({
        code: ErrorCode.ENTITY_NOT_FOUND,
        params: { message: 'Agency not found' },
      });
    }

    const clients = await clientRepo().find({
      where: { agencyId },
      order: { created: 'ASC' },
    });

    const tierCfg = AGENCY_TIERS[agency.tier as AgencyTier];

    // Only ACTIVE clients are billed. Draft and suspended are shown but not charged.
    const activeClients = clients.filter((c) => c.status === 'active');
    const draftClients = clients.filter((c) => c.status === 'draft');
    const suspendedClients = clients.filter((c) => c.status === 'suspended');

    const clientRows = clients.map((c) => {
      const publicPrice = FLOW_PUBLIC_PRICES[c.clientTier] ?? 0;
      const wholesale = c.wholesaleMonthlyZar ?? 0;
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        clientTier: c.clientTier,
        wholesaleMonthlyZar: wholesale,
        publicPriceZar: publicPrice,
        savingZar: c.status === 'active' ? publicPrice - wholesale : 0,
      };
    });

    const clientWholesaleTotalZar = activeClients.reduce(
      (s, c) => s + (c.wholesaleMonthlyZar ?? 0),
      0,
    );
    const clientPublicTotalZar = activeClients.reduce(
      (s, c) => s + (FLOW_PUBLIC_PRICES[c.clientTier] ?? 0),
      0,
    );

    return {
      agencyId: agency.id,
      tier: agency.tier,
      tierName: tierCfg.name,
      status: agency.status,
      agencyFeeZar: agency.status === 'active' ? tierCfg.feeZar : 0,
      clients: clientRows,
      activeClientCount: activeClients.length,
      draftClientCount: draftClients.length,
      suspendedClientCount: suspendedClients.length,
      clientWholesaleTotalZar,
      clientPublicTotalZar,
      clientSavingsTotalZar: clientPublicTotalZar - clientWholesaleTotalZar,
      monthlyTotalZar:
        (agency.status === 'active' ? tierCfg.feeZar : 0) + clientWholesaleTotalZar,
      nextBillingDate: null, // Filled in once Paystack is wired
      currency: 'ZAR',
    };
  },
});
