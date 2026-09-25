import { Property } from '@activepieces/pieces-framework';
import { fetchProjectsDocument, projectRows } from './api';
import { aconexAuth } from './auth';
import { assertAuthProps, readAuth } from './auth-props';
import { toSafeMessage } from './errors';
import { xmlText, type XmlRecord } from './xml';

const MAIL_SEARCH_QUERY = [
  'Optional Lucene query. Field names are case sensitive. Examples:',
  '  sentdate:[20260101 TO 20260131]',
  '  subject:"concrete pour"',
  '  docno:MAJ-INM-*',
  'Mail fields include sentdate, subject, docno, corrtypeid, tostatusid,',
  'fromuserfullname, touserfullname, attribute, secondaryattribute.',
  'Empty query returns the mailbox page, not every field on the mail.',
  'These tokens are not the JSON keys in the result.',
].join('\n');

const DOCUMENT_SEARCH_QUERY = [
  'Optional Lucene query. Field names are case sensitive. Examples:',
  '  doctype:"Shop Drawing"',
  '  doctype:"Shop Drawing" AND Door',
  '  registered:[20260101 TO 20260131]',
  '  docno:DWG-*',
  'The web field "Created By" is "author" in the query. "trackingid" is stable across',
  'versions. These tokens are not the JSON keys. The row\'s version id is the',
  'attribute @DocumentId. trackingid comes back as TrackingId. registered comes',
  'back as DateModified. docno comes back as DocumentNumber. doctype comes back',
  'as DocumentType.',
].join('\n');

const RETURN_FIELDS_NOTE =
  'Comma-separated query tokens sent to Aconex. These tokens are not the JSON keys in the result.';

export const projectIdProp = Property.Dropdown({
  displayName: 'Project',
  description: 'Projects this connection can see.',
  required: true,
  refreshers: [],
  auth: aconexAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, placeholder: 'Connect Aconex first', options: [] };
    }
    try {
      const document = await fetchProjectsDocument(assertAuthProps(readAuth(auth)));
      const rows = projectRows(document);
      if (rows.length === 0) {
        return {
          disabled: true,
          placeholder: 'No projects are visible to this connection.',
          options: [],
        };
      }
      return {
        options: rows.map((project) => ({
          label: projectLabel(project),
          value: xmlText(project['ProjectId']),
        })),
      };
    } catch (error) {
      return { disabled: true, placeholder: toSafeMessage(error), options: [] };
    }
  },
});

export const mailBoxProp = Property.StaticDropdown({
  displayName: 'Mailbox',
  description: 'Inbox or sent box. Drafts are not available.',
  required: true,
  defaultValue: 'inbox',
  options: {
    options: [
      { label: 'Inbox', value: 'inbox' },
      { label: 'Sent', value: 'sentbox' },
    ],
  },
});

export const mailSearchQueryProp = Property.LongText({
  displayName: 'Search query',
  description: MAIL_SEARCH_QUERY,
  required: false,
});

export const documentSearchQueryProp = Property.LongText({
  displayName: 'Search query',
  description: DOCUMENT_SEARCH_QUERY,
  required: false,
});

export const pageSizeProp = Property.Number({
  displayName: 'Page size',
  description: 'Multiple of 25, from 25 through 500. The default is 25.',
  required: false,
  defaultValue: 25,
});

export const pageNumberProp = Property.Number({
  displayName: 'Page number',
  description: 'First page is 1.',
  required: false,
  defaultValue: 1,
});

export const mailReturnFieldsProp = Property.ShortText({
  displayName: 'Return fields',
  description: `${RETURN_FIELDS_NOTE} Mail list keys stay as Aconex returns them.`,
  required: false,
  defaultValue: 'subject,docno,sentdate,fromUserDetails,tostatusid,confidential',
});

export const documentReturnFieldsProp = Property.ShortText({
  displayName: 'Return fields',
  description: `${RETURN_FIELDS_NOTE} docno is DocumentNumber, doctype is DocumentType, registered is DateModified, and the version id is @DocumentId. TrackingId is the stable id.`,
  required: false,
  defaultValue: 'docno,title,revision,doctype,author,filename,fileSize,fileType,trackingid,registered,versionnumber',
});

function projectLabel(project: XmlRecord): string {
  const name = xmlText(project['ProjectName']) || 'Project';
  const code = xmlText(project['ProjectCode']) || xmlText(project['ProjectId']);
  const active = xmlText(project['@Active']) || 'unknown';
  const hidden = xmlText(project['@Hidden']) || 'unknown';
  return `${name} (${code}) [Active: ${active}, Hidden: ${hidden}]`;
}
