import { XMLParser } from 'fast-xml-parser';
import { AconexError } from './errors';

export const MAX_XML_BYTES = 20 * 1024 * 1024;

const ARRAY_PATHS = new Set([
  'ProjectResults.SearchResults.Project',
  'MailSearch.SearchResults.Mail',
  'RegisterSearch.SearchResults.Document',
  'IntegrityCheckResults.Mail',
  'IntegrityCheckResults.Document',
]);

const ENTITY = /&(?:amp|lt|gt|quot|apos);/g;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  // processEntities true also processes DOCTYPE entities. Keep it off and
  // unescape only the five predefined entities after a DOCTYPE check.
  processEntities: false,
  htmlEntities: false,
  allowBooleanAttributes: true,
  jPath: true,
  isArray: (_name, jpath) => {
    const path = typeof jpath === 'string' ? jpath : jpath.toString();
    return ARRAY_PATHS.has(path);
  },
});

export type XmlRecord = Record<string, unknown>;

export function parseAconexXml(body: string): unknown {
  if (typeof body !== 'string') {
    throw new AconexError('XML_PARSE_FAILED', 'Aconex returned a response that was not XML text.');
  }
  if (body.length > MAX_XML_BYTES || Buffer.byteLength(body, 'utf8') > MAX_XML_BYTES) {
    throw new AconexError('RESPONSE_TOO_LARGE', 'The Aconex response is larger than 20 MB and was not parsed.');
  }
  if (/<!DOCTYPE/i.test(body)) {
    throw new AconexError('XML_DOCTYPE_REJECTED', 'Aconex XML that contains a DOCTYPE was rejected.');
  }
  return unescapeTree(parser.parse(body));
}

export function isXmlRecord(value: unknown): value is XmlRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function xmlChildren(value: unknown): XmlRecord[] {
  if (Array.isArray(value)) {
    return value.filter(isXmlRecord);
  }
  if (isXmlRecord(value)) {
    return [value];
  }
  return [];
}

export function xmlText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function unescapeTree(value: unknown): unknown {
  if (typeof value === 'string') {
    return unescapeBasic(value);
  }
  if (Array.isArray(value)) {
    return value.map((entry) => unescapeTree(entry));
  }
  if (isXmlRecord(value)) {
    const out: XmlRecord = {};
    for (const [key, entry] of Object.entries(value)) {
      out[key] = unescapeTree(entry);
    }
    return out;
  }
  return value;
}

function unescapeBasic(value: string): string {
  return value.replace(ENTITY, (entity) => {
    switch (entity) {
      case '&amp;':
        return '&';
      case '&lt;':
        return '<';
      case '&gt;':
        return '>';
      case '&quot;':
        return '"';
      case '&apos;':
        return "'";
      default:
        return entity;
    }
  });
}
