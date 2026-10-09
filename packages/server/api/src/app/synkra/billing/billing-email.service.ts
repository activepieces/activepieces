import { FastifyBaseLogger } from 'fastify';
import nodemailer, { Transporter } from 'nodemailer';
import { system } from '../../helper/system/system';
import { AppSystemProp } from '../../helper/system/system-props';
import { resendSender } from './resend-sender';

type Tier = 'free' | 'starter' | 'business' | 'pro';

const TIER_LABEL: Record<Tier, string> = {
  free: 'Free', starter: 'Starter', business: 'Business', pro: 'Pro',
};
const TIER_PRICE: Record<Tier, number> = { free: 0, starter: 299, business: 599, pro: 999 };
const BRAND = '#5DD62C';

let cached: Transporter | null = null;

function getTransport(log: FastifyBaseLogger): Transporter | null {
  if (cached) return cached;
  const host = system.get(AppSystemProp.SMTP_HOST);
  const port = system.get(AppSystemProp.SMTP_PORT);
  const user = system.get(AppSystemProp.SMTP_USERNAME);
  const pass = system.get(AppSystemProp.SMTP_PASSWORD);
  if (!host || !port || !user || !pass) {
    log.info({ hasHost: !!host, hasPort: !!port, hasUser: !!user, hasPass: !!pass },
      'billing emails: SMTP not configured — logging only');
    return null;
  }
  cached = nodemailer.createTransport({
    host, port: Number(port), secure: Number(port) === 465,
    auth: { user, pass },
  });
  return cached;
}

function shell(title: string, body: string, cta?: { label: string; url: string }): string {
  const c = cta
    ? `<p style="margin:24px 0"><a href="${cta.url}" style="display:inline-block;padding:12px 24px;background:${BRAND};color:#000;text-decoration:none;border-radius:6px;font-weight:600">${cta.label}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f4f4;font-family:-apple-system,'Segoe UI',sans-serif"><table width="100%" style="background:#f4f4f4;padding:32px 16px"><tr><td align="center"><table width="100%" style="max-width:560px;background:#fff;border-radius:12px;padding:32px"><tr><td><h1 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">${title}</h1>${body}${c}<hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px"/><p style="margin:0;font-size:12px;color:#888">Synkra Flow · hello@synkra.co.za</p></td></tr></table></td></tr></table></body></html>`;
}

function send(log: FastifyBaseLogger, to: string, subject: string, html: string): void {
  const resend = resendSender(log);
  if (resend.isConfigured()) {
    void resend.send({ to, subject, html });
    return;
  }
  const t = getTransport(log);
  if (!t) { log.info({ to, subject }, 'billing email logged (no Resend, no SMTP)'); return; }
  t.sendMail({ from: { name: 'Synkra Flow', address: 'noreply@synkra.co.za' }, to, subject, html })
    .catch((err) => log.error({ err, to, subject }, 'billing email failed'));
}

export const billingEmailService = (log: FastifyBaseLogger) => ({
  sendWelcomeUpgrade(to: string, tier: Tier, periodEnd: Date | null) {
    const w = periodEnd ? periodEnd.toLocaleDateString('en-ZA') : 'next month';
    send(log, to, `Welcome to Synkra Flow ${TIER_LABEL[tier]}`,
      shell(`Welcome to ${TIER_LABEL[tier]}`, `
        <p style="color:#333;line-height:1.6">Your account is now on the <strong>${TIER_LABEL[tier]}</strong> plan at R${TIER_PRICE[tier]}/month.</p>
        <p style="color:#333;line-height:1.6">Renews on <strong>${w}</strong>. Manage it any time from Billing.</p>`,
        { label: 'Go to Billing', url: 'https://flow.synkra.co.za/billing' }));
  },

  sendDowngradeScheduled(to: string, fromTier: Tier, toTier: Tier, effectiveAt: Date) {
    send(log, to, `Downgrade to ${TIER_LABEL[toTier]} scheduled`,
      shell(`Downgrade scheduled`, `
        <p style="color:#333;line-height:1.6">You've scheduled a downgrade from <strong>${TIER_LABEL[fromTier]}</strong> to <strong>${TIER_LABEL[toTier]}</strong>.</p>
        <p style="color:#333;line-height:1.6">Takes effect on <strong>${effectiveAt.toLocaleDateString('en-ZA')}</strong>. Until then you keep full ${TIER_LABEL[fromTier]} access.</p>`,
        { label: 'Manage subscription', url: 'https://flow.synkra.co.za/billing' }));
  },

  sendCancelScheduled(to: string, tier: Tier, effectiveAt: Date) {
    send(log, to, `Cancellation confirmed`,
      shell(`Cancellation scheduled`, `
        <p style="color:#333;line-height:1.6">Your <strong>${TIER_LABEL[tier]}</strong> plan has been cancelled. Full access until <strong>${effectiveAt.toLocaleDateString('en-ZA')}</strong>.</p>
        <p style="color:#333;line-height:1.6">On that date your account moves to Free. No further charges.</p>`,
        { label: 'Reactivate', url: 'https://flow.synkra.co.za/billing' }));
  },

  sendRenewalReminder(to: string, tier: Tier, renewsAt: Date, priceZar: number) {
    send(log, to, `Your ${TIER_LABEL[tier]} plan renews in 3 days`,
      shell(`Renewal in 3 days`, `
        <p style="color:#333;line-height:1.6">Your <strong>${TIER_LABEL[tier]}</strong> plan renews on <strong>${renewsAt.toLocaleDateString('en-ZA')}</strong>. Amount: <strong>R${priceZar}</strong>.</p>
        <p style="color:#333;line-height:1.6">Cancel before then if you don't want to renew.</p>`,
        { label: 'Manage subscription', url: 'https://flow.synkra.co.za/billing' }));
  },

  sendRenewalSuccess(to: string, tier: Tier, nextRenewal: Date, amountZar: number) {
    send(log, to, `Renewal successful — ${TIER_LABEL[tier]}`,
      shell(`Renewal successful`, `
        <p style="color:#333;line-height:1.6">Your <strong>${TIER_LABEL[tier]}</strong> plan renewed. R${amountZar} charged.</p>
        <p style="color:#333;line-height:1.6">Next renewal: <strong>${nextRenewal.toLocaleDateString('en-ZA')}</strong>.</p>`));
  },

  sendRenewalFailed(to: string, tier: Tier, attempt: number, amountZar: number) {
    const titles = ['Payment failed', 'Payment still failing', 'Final payment attempt failed'];
    const title = titles[Math.min(attempt, 2)];
    send(log, to, `${title} — action needed`,
      shell(title, `
        <p style="color:#333;line-height:1.6">We couldn't charge R${amountZar} for your <strong>${TIER_LABEL[tier]}</strong> plan (attempt ${attempt + 1} of 3).</p>
        <p style="color:#333;line-height:1.6">Please update your card. You have a 5-day grace period.</p>`,
        { label: 'Update payment method', url: 'https://flow.synkra.co.za/billing' }));
  },

  sendAccountRestricted(to: string, tier: Tier) {
    send(log, to, `Account restricted`,
      shell(`Account restricted`, `
        <p style="color:#333;line-height:1.6">Your <strong>${TIER_LABEL[tier]}</strong> subscription couldn't renew. Paid features are now paused.</p>
        <p style="color:#333;line-height:1.6">Inbound flows still run. Update payment to restore access immediately.</p>`,
        { label: 'Restore access', url: 'https://flow.synkra.co.za/billing' }));
  },

  sendAccountRestored(to: string, tier: Tier, nextRenewal: Date) {
    send(log, to, `Access restored`,
      shell(`Welcome back`, `
        <p style="color:#333;line-height:1.6">Payment received. Your <strong>${TIER_LABEL[tier]}</strong> plan is active again.</p>
        <p style="color:#333;line-height:1.6">Next renewal: <strong>${nextRenewal.toLocaleDateString('en-ZA')}</strong>.</p>`));
  },
});
