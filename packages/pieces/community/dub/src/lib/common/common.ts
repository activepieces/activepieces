
import crypto from 'crypto';

export function verifyDubSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string
): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');
    const provided = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice(7)
      : signatureHeader;
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(provided, 'hex');
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}


export interface DubLink {
  id: string;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  qrCode: string;
  trackConversion: boolean;
  externalId: string | null;
  tenantId: string | null;
  programId: string | null;
  partnerId: string | null;
  archived: boolean;
  expiresAt: string | null;
  expiredUrl: string | null;
  disabledAt: string | null;
  password: string | null;
  proxy: boolean;
  title: string | null;
  description: string | null;
  image: string | null;
  video: string | null;
  rewrite: boolean;
  doIndex: boolean;
  ios: string | null;
  android: string | null;
  geo: Record<string, string> | null;
  publicStats: boolean;
  tags: Array<{ id: string; name: string; color: string }> | null;
  folderId: string | null;
  webhookIds: string[];
  comments: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  userId: string | null;
  workspaceId: string;
  clicks: number;
  leads: number;
  conversions: number;
  sales: number;
  saleAmount: number;
  lastClicked: string | null;
  createdAt: string;
  updatedAt: string;
}