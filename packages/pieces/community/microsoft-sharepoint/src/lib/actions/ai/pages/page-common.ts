import { Property } from '@activepieces/pieces-framework';

function pageId() {
  return Property.ShortText({
    displayName: 'Page ID',
    description: 'ID of the site page (a GUID). Use List Pages to find it.',
    required: true,
  });
}

function horizontalSectionId() {
  return Property.ShortText({
    displayName: 'Horizontal Section ID',
    description: 'ID of the horizontal section, a number like "1" sent as text. Use List Horizontal Sections to find it.',
    required: true,
  });
}

function columnId() {
  return Property.ShortText({
    displayName: 'Column ID',
    description: 'ID of the column in the horizontal section, a number like "1" sent as text. Use List Section Columns to find it.',
    required: true,
  });
}

function webPartIndex({ listAction }: { listAction: string }) {
  return Property.ShortText({
    displayName: 'Web Part Index',
    description: `Position of the web part in its column or section, a number like "1" sent as text; the first web part is 1. Use ${listAction} to find it.`,
    required: true,
  });
}

function webPartId() {
  return Property.ShortText({
    displayName: 'Web Part ID',
    description: 'ID of the web part (a GUID). Use List Page Web Parts to find it.',
    required: true,
  });
}

function emphasis<R extends boolean>({ required }: { required: R }) {
  return Property.StaticDropdown({
    displayName: 'Emphasis',
    description: 'Background emphasis of the section.',
    required,
    options: {
      disabled: false,
      options: EMPHASIS_TYPES.map((value) => ({ label: value, value })),
    },
  });
}

function layout<R extends boolean>({ required }: { required: R }) {
  return Property.StaticDropdown({
    displayName: 'Layout',
    description: 'Column layout of the horizontal section.',
    required,
    options: {
      disabled: false,
      options: LAYOUT_TYPES.map((value) => ({ label: value, value })),
    },
  });
}

function webPart() {
  return Property.Json({
    displayName: 'Web Part',
    description: `The web part as a JSON object with its "@odata.type". Text: {"@odata.type": "#microsoft.graph.textWebPart", "innerHtml": "<p>Hello</p>"}. Standard: {"@odata.type": "#microsoft.graph.standardWebPart", "webPartType": "<type ID>", "data": {...}}. Supported standard type IDs: ${STANDARD_WEB_PART_TYPES}.`,
    required: true,
  });
}

function pagePath({ siteId, pageId }: { siteId: string; pageId: string }): string {
  return `/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/microsoft.graph.sitePage`;
}

function horizontalSectionPath({
  siteId,
  pageId,
  horizontalSectionId,
}: {
  siteId: string;
  pageId: string;
  horizontalSectionId: string;
}): string {
  return `${pagePath({ siteId, pageId })}/canvasLayout/horizontalSections/${encodeURIComponent(horizontalSectionId)}`;
}

function columnPath({
  siteId,
  pageId,
  horizontalSectionId,
  columnId,
}: {
  siteId: string;
  pageId: string;
  horizontalSectionId: string;
  columnId: string;
}): string {
  return `${horizontalSectionPath({ siteId, pageId, horizontalSectionId })}/columns/${encodeURIComponent(columnId)}`;
}

function emphasisValue({ value }: { value: string | undefined }): Record<string, string> {
  return choice({ key: 'emphasis', value, allowed: EMPHASIS_TYPES, propName: 'Emphasis' });
}

function layoutValue({ value }: { value: string | undefined }): Record<string, string> {
  return choice({ key: 'layout', value, allowed: LAYOUT_TYPES, propName: 'Layout' });
}

function webPartBody({ value }: { value: Record<string, unknown> }): Record<string, unknown> {
  const type = Array.isArray(value) ? undefined : value['@odata.type'];
  if (typeof type !== 'string' || !WEB_PART_ODATA_TYPES.includes(type.toLowerCase())) {
    throw new Error(
      'Web Part must be a JSON object with "@odata.type" set to "#microsoft.graph.textWebPart" or "#microsoft.graph.standardWebPart".'
    );
  }
  return value;
}

function jsonObject({
  key,
  value,
  propName,
}: {
  key: string;
  value: Record<string, unknown> | undefined;
  propName: string;
}): Record<string, Record<string, unknown>> {
  if (value === undefined || value === null || Object.keys(value).length === 0) {
    return {};
  }
  if (Array.isArray(value)) {
    throw new Error(`${propName} must be a JSON object, not a list.`);
  }
  return { [key]: value };
}

function jsonList({
  key,
  value,
  propName,
}: {
  key: string;
  value: Record<string, unknown> | undefined;
  propName: string;
}): Record<string, unknown[]> {
  if (value === undefined || value === null) {
    return {};
  }
  if (!Array.isArray(value)) {
    if (Object.keys(value).length === 0) {
      return {};
    }
    throw new Error(`${propName} must be a JSON list of objects.`);
  }
  return { [key]: value };
}

function choice({
  key,
  value,
  allowed,
  propName,
}: {
  key: string;
  value: string | undefined;
  allowed: string[];
  propName: string;
}): Record<string, string> {
  if (value === undefined || value === '') {
    return {};
  }
  if (!allowed.includes(value)) {
    throw new Error(`${propName} must be one of: ${allowed.join(', ')}.`);
  }
  return { [key]: value };
}

export const microsoftSharePointPageCommon = {
  pageId,
  horizontalSectionId,
  columnId,
  webPartIndex,
  webPartId,
  emphasis,
  layout,
  webPart,
  pagePath,
  horizontalSectionPath,
  columnPath,
  emphasisValue,
  layoutValue,
  webPartBody,
  jsonObject,
  jsonList,
  choice,
};

const EMPHASIS_TYPES: string[] = ['none', 'neutral', 'soft', 'strong'];

const LAYOUT_TYPES: string[] = [
  'none',
  'oneColumn',
  'twoColumns',
  'threeColumns',
  'oneThirdLeftColumn',
  'oneThirdRightColumn',
  'fullWidth',
];

const WEB_PART_ODATA_TYPES: string[] = ['#microsoft.graph.textwebpart', '#microsoft.graph.standardwebpart'];

const STANDARD_WEB_PART_TYPES =
  'Bing Maps e377ea37-9047-43b9-8cdb-a761be2f8e09, Button 0f087d7f-520e-42b7-89c0-496aaf979d58, Call To Action df8e44e7-edd5-46d5-90da-aca1539313b8, Divider 2161a1c6-db61-4731-b97c-3cdb303f7cbb, Document Embed b7dd04e1-19ce-4b24-9132-b60a1c2b910d, Image d1d91016-032f-456d-98a4-721247c305e8, Image Gallery af8be689-990e-492a-81f7-ba3e4cd3ed9c, Link Preview 6410b3b6-d440-4663-8744-378976dc041e, Org Chart e84a8ca2-f63c-4fb9-bc0b-d8eef5ccb22b, People 7f718435-ee4d-431c-bdbf-9c4ff326f46e, Quick Links c70391ea-0b10-4ee9-b2b4-006d3fcad0cd, Spacer 8654b779-4886-46d4-8ffb-b5ed960ee986, YouTube Embed 544dd15b-cf3c-441b-96da-004d5a8cea1d, Title Area cbe7b0a9-3504-44dd-a3a3-0e5cacd07788';
