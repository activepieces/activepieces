import { FastifyBaseLogger } from 'fastify';
import { system } from '../../helper/system/system';
import { AppSystemProp } from '../../helper/system/system-props';

/**
 * On boot, verify Paystack wiring is present when the operator expects it.
 * We do NOT auto-create plans in Paystack — the operator creates them once
 * in the dashboard and stores the plan codes in env.
 *
 * This service's job is to loudly warn if billing is half-configured.
 */
export const synkraBootSeed = (log: FastifyBaseLogger) => ({
  verifyBillingConfig(): void {
    const secret = system.get(AppSystemProp.SYNKRA_PAYSTACK_SECRET_KEY);
    const webhook = system.get(AppSystemProp.SYNKRA_PAYSTACK_WEBHOOK_SECRET);
    const starter = system.get(AppSystemProp.SYNKRA_PAYSTACK_PLAN_STARTER);
    const business = system.get(AppSystemProp.SYNKRA_PAYSTACK_PLAN_BUSINESS);
    const pro = system.get(AppSystemProp.SYNKRA_PAYSTACK_PLAN_PRO);

    if (!secret) {
      log.info('synkra billing: Paystack not configured (SYNKRA_PAYSTACK_SECRET_KEY unset). Checkout disabled.');
      return;
    }
    if (!webhook) log.warn('synkra billing: SYNKRA_PAYSTACK_WEBHOOK_SECRET unset — webhook signature will NOT be verified.');
    const missing: string[] = [];
    if (!starter) missing.push('starter');
    if (!business) missing.push('business');
    if (!pro) missing.push('pro');
    if (missing.length > 0) {
      log.warn({ missing }, 'synkra billing: Paystack plan codes missing for tiers — checkout will fall back to one-time charge.');
    } else {
      log.info('synkra billing: Paystack fully configured.');
    }
  },
});
