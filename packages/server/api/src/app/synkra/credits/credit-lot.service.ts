import { apId, isNil } from '@activepieces/core-utils';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import { CreditKind, SynkraCreditLot, SynkraCreditLotEntity } from './credit-lot.entity';
import { computeExpiry } from './pack-catalog';

const repo = repoFactory<SynkraCreditLot>(SynkraCreditLotEntity);

export const synkraCreditLotService = (log: FastifyBaseLogger) => ({
  /**
   * Create a credit lot after a successful add-on purchase.
   * Idempotent on paystackReference: if the same ref comes in twice,
   * return the existing lot instead of creating a duplicate.
   */
  async createFromPurchase(params: {
    userId: string;
    platformId: string;
    kind: CreditKind;
    amount: number;
    priceZar: number;
    paystackReference: string;
    metadata?: Record<string, unknown>;
  }): Promise<SynkraCreditLot> {
    const existing = await repo().findOneBy({
      paystackReference: params.paystackReference,
    });
    if (!isNil(existing)) {
      log.info(
        { reference: params.paystackReference },
        'credit-lot: already exists for reference (idempotent)',
      );
      return existing;
    }

    const lot = await repo().save({
      id: apId(),
      userId: params.userId,
      platformId: params.platformId,
      kind: params.kind,
      amountPurchased: params.amount,
      amountRemaining: params.amount,
      amountUsed: 0,
      pricePaidZar: params.priceZar,
      paystackReference: params.paystackReference,
      expiresAt: computeExpiry(),
      expired: false,
      metadata: params.metadata ?? {},
    });

    log.info(
      { lotId: lot.id, userId: params.userId, kind: params.kind, amount: params.amount },
      'credit-lot: created',
    );
    return lot;
  },

  /**
   * Get total available credits for a user, per kind.
   * Excludes expired lots.
   */
  async getAvailable(userId: string, kind: CreditKind): Promise<number> {
    const lots = await repo()
      .createQueryBuilder('l')
      .where('l."userId" = :userId', { userId })
      .andWhere('l.kind = :kind', { kind })
      .andWhere('l.expired = false')
      .andWhere('l."amountRemaining" > 0')
      .getMany();
    return lots.reduce((sum, l) => sum + l.amountRemaining, 0);
  },

  /**
   * Draw credits from the oldest non-expired lots (FIFO).
   * Returns the amount actually drawn (may be less if not enough).
   * If you want to consume more than available, this draws what's there.
   */
  async consume(
    userId: string,
    kind: CreditKind,
    amount: number,
  ): Promise<{ drawn: number; shortfall: number }> {
    if (amount <= 0) return { drawn: 0, shortfall: 0 };

    const lots = await repo()
      .createQueryBuilder('l')
      .where('l."userId" = :userId', { userId })
      .andWhere('l.kind = :kind', { kind })
      .andWhere('l.expired = false')
      .andWhere('l."amountRemaining" > 0')
      .orderBy('l."expiresAt"', 'ASC') // oldest first
      .getMany();

    let remaining = amount;
    let drawn = 0;

    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(lot.amountRemaining, remaining);
      lot.amountRemaining -= take;
      lot.amountUsed += take;
      await repo().save(lot);
      drawn += take;
      remaining -= take;
    }

    const shortfall = remaining;
    if (drawn > 0) {
      log.info(
        { userId, kind, drawn, shortfall },
        'credit-lot: consumed',
      );
    }
    return { drawn, shortfall };
  },

  /**
   * List a user's active lots for transparency.
   */
  async listForUser(userId: string, kind?: CreditKind): Promise<SynkraCreditLot[]> {
    const qb = repo()
      .createQueryBuilder('l')
      .where('l."userId" = :userId', { userId })
      .andWhere('l.expired = false')
      .andWhere('l."amountRemaining" > 0')
      .orderBy('l."expiresAt"', 'ASC');
    if (kind) qb.andWhere('l.kind = :kind', { kind });
    return qb.getMany();
  },

  /**
   * Mark lots as expired if their expiresAt is in the past and they
   * still have remaining balance. Called by a daily cron.
   */
  async expireStaleLots(): Promise<number> {
    const now = new Date();
    const result = await repo()
      .createQueryBuilder()
      .update()
      .set({ expired: true } as never)
      .where('"expired" = false')
      .andWhere('"expiresAt" < :now', { now })
      .andWhere('"amountRemaining" > 0')
      .execute();
    const count = result.affected ?? 0;
    if (count > 0) {
      log.info({ count }, 'credit-lot: expired stale lots');
    }
    return count;
  },
});
