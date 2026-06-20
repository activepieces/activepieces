import { createLookupAction } from '../common/lookup-action';

export const pulsesnapScanUrl = createLookupAction({
  name: 'pulsesnap_scan_url',
  displayName: 'PulseSnap: Scan URL',
  description: 'Threat-intelligence pulse summary for a URL.',
  queryDescription: 'The URL to scan, e.g. https://example.com.',
  path: '/v1/pulse-snap/scan/url',
});

export const pulsesnapScanHash = createLookupAction({
  name: 'pulsesnap_scan_hash',
  displayName: 'PulseSnap: Scan Hash',
  description: 'Threat-intelligence pulse summary for a file hash.',
  queryDescription: 'The file hash to scan (MD5, SHA-1, or SHA-256).',
  path: '/v1/pulse-snap/scan/hash',
});

export const pulsesnapScanIp = createLookupAction({
  name: 'pulsesnap_scan_ip',
  displayName: 'PulseSnap: Scan IP',
  description: 'Threat-intelligence pulse summary for an IP address.',
  queryDescription: 'The IPv4 address to scan, e.g. 8.8.8.8.',
  path: '/v1/pulse-snap/scan/ip',
});

export const pulsesnapScanDomain = createLookupAction({
  name: 'pulsesnap_scan_domain',
  displayName: 'PulseSnap: Scan Domain',
  description: 'Threat-intelligence pulse summary for a domain.',
  queryDescription: 'The domain to scan, e.g. example.com.',
  path: '/v1/pulse-snap/scan/domain',
});
