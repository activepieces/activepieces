import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoClient, ShortIoAuthValue } from './client';

function countryCode(value: unknown): string {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^[A-Z]{2}$/.test(code)) {
    throw new Error('Country code must be exactly 2 letters (e.g., US, GB, CA).');
  }
  return code;
}

function httpUrl({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  const protocol = URL.canParse(text) ? new URL(text).protocol : '';
  if (protocol === 'http:' || protocol === 'https:') {
    return text;
  }
  throw new Error(`${label} must be a valid URL starting with http:// or https://`);
}

async function addCountryRule({ auth, linkId, domainId, country, originalURL }: {
  auth: ShortIoAuthValue;
  linkId: unknown;
  domainId?: number;
  country: unknown;
  originalURL: unknown;
}): Promise<{ linkId: string; country: string; originalURL: string; raw: unknown }> {
  const code = countryCode(country);
  const url = httpUrl({ value: originalURL, label: 'Country redirect URL' });
  const id = shortIoClient.seg({ value: linkId, label: 'Link ID' });
  try {
    const raw = await shortIoClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/link_country/${id}`,
      query: { domainId },
      body: { country: code, originalURL: url },
    });
    return { linkId: decodeURIComponent(id), country: code, originalURL: url, raw };
  } catch (error) {
    return shortIoClient.rethrowWithHint({
      error,
      hints: {
        404: 'Short link not found. Check the link ID.',
        409: `A country targeting rule for ${code} already exists on this link.`,
        400: 'Short.io rejected the country rule.',
      },
    });
  }
}

export const shortIoTargeting = { countryCode, httpUrl, addCountryRule };
