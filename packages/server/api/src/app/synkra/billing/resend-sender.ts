import { FastifyBaseLogger } from 'fastify';
import { system } from '../../helper/system/system';
import { AppSystemProp } from '../../helper/system/system-props';

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export const resendSender = (log: FastifyBaseLogger) => ({
  isConfigured(): boolean {
    return !!system.get(AppSystemProp.RESEND_API_KEY);
  },

  async send(args: SendArgs): Promise<boolean> {
    const apiKey = system.get(AppSystemProp.RESEND_API_KEY);
    if (!apiKey) return false;
    const from = system.get(AppSystemProp.RESEND_FROM_EMAIL) ?? 'noreply@synkra.co.za';
    const fromName = system.get(AppSystemProp.RESEND_FROM_NAME) ?? 'Synkra Flow';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${from}>`,
          to: [args.to],
          subject: args.subject,
          html: args.html,
          reply_to: args.replyTo,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        log.error({ status: res.status, body, to: args.to, subject: args.subject },
          'resend: send failed');
        return true; // we tried, do not fall through
      }
      const json = (await res.json().catch(() => ({}))) as { id?: string };
      log.info({ id: json.id, to: args.to, subject: args.subject }, 'resend: sent');
      return true;
    } catch (err) {
      log.error({ err, to: args.to, subject: args.subject }, 'resend: threw');
      return false; // allow SMTP fallback
    }
  },
});
