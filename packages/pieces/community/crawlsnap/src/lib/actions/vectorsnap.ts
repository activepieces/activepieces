import { createLookupAction } from '../common/lookup-action';

export const vectorsnapEnrichUrl = createLookupAction({
  name: 'vectorsnap_enrich_url',
  displayName: 'VectorSnap: Enrich URL',
  description: 'Reputation, detections, categories, and relationships for a URL.',
  queryDescription: 'The URL to look up, e.g. https://example.com.',
  path: '/v1/ioc/search/url',
});

export const vectorsnapEnrichHash = createLookupAction({
  name: 'vectorsnap_enrich_hash',
  displayName: 'VectorSnap: Enrich Hash',
  description: 'File analysis for an MD5, SHA-1, or SHA-256 hash.',
  queryDescription: 'The file hash to look up (MD5, SHA-1, or SHA-256).',
  path: '/v1/ioc/search/hash',
});

export const vectorsnapEnrichIp = createLookupAction({
  name: 'vectorsnap_enrich_ip',
  displayName: 'VectorSnap: Enrich IP',
  description: 'Reputation, WHOIS, ASN, and relationships for an IPv4 address.',
  queryDescription: 'The IPv4 address to look up, e.g. 8.8.8.8.',
  path: '/v1/ioc/search/ip',
});

export const vectorsnapEnrichDomain = createLookupAction({
  name: 'vectorsnap_enrich_domain',
  displayName: 'VectorSnap: Enrich Domain',
  description: 'Reputation, WHOIS, DNS, certificates, categories, and relationships for a domain.',
  queryDescription: 'The domain to look up, e.g. example.com.',
  path: '/v1/ioc/search/domain',
});
