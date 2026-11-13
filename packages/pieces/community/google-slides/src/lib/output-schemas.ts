import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const presentationIdField: OutputSchemaField = { key: 'presentationId', label: 'Presentation ID' };

const slideUrlField: OutputSchemaField = { key: 'slideUrl', label: 'Slide URL', format: 'url' };

const createdFileFields: OutputSchemaField[] = [
  presentationIdField,
  { key: 'title', label: 'Title' },
  { key: 'presentationUrl', label: 'Presentation URL', format: 'url' },
  { key: 'folderId', label: 'Folder ID' },
  { key: 'createdTime', label: 'Created Time', format: 'datetime' },
];

const dimensionChildren: OutputSchemaField[] = [
  { key: 'magnitude', label: 'Size', format: 'number' },
  { key: 'unit', label: 'Unit' },
];

const pageElementItems: OutputSchemaField[] = [
  { key: 'objectId', label: 'Object ID' },
  {
    key: 'size',
    label: 'Size',
    children: [
      { key: 'width', label: 'Width', children: dimensionChildren },
      { key: 'height', label: 'Height', children: dimensionChildren },
    ],
  },
  { key: 'transform', label: 'Transform' },
  { key: 'shape', label: 'Shape' },
  { key: 'table', label: 'Table' },
  { key: 'image', label: 'Image' },
  { key: 'elementGroup', label: 'Group' },
];

const slideProperties: OutputSchemaField = {
  key: 'slideProperties',
  label: 'Slide Properties',
  children: [
    { key: 'layoutObjectId', label: 'Layout Object ID' },
    { key: 'masterObjectId', label: 'Master Object ID' },
  ],
};

export const getPresentationOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'title', label: 'Title' },
    { key: 'locale', label: 'Locale' },
    { key: 'revisionId', label: 'Revision ID' },
    {
      key: 'pageSize',
      label: 'Page Size',
      children: [
        { key: 'width', label: 'Width', children: dimensionChildren },
        { key: 'height', label: 'Height', children: dimensionChildren },
      ],
    },
    {
      key: 'slides',
      label: 'Slides',
      labelKey: 'objectId',
      listItems: [
        { key: 'objectId', label: 'Slide Object ID' },
        slideProperties,
        { key: 'pageElements', label: 'Elements', labelKey: 'objectId', listItems: pageElementItems },
      ],
    },
    {
      key: 'layouts',
      label: 'Layouts',
      labelKey: 'objectId',
      listItems: [
        { key: 'objectId', label: 'Layout Object ID' },
        {
          key: 'layoutProperties',
          label: 'Layout Properties',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'displayName', label: 'Display Name' },
          ],
        },
      ],
    },
    {
      key: 'masters',
      label: 'Masters',
      labelKey: 'objectId',
      listItems: [{ key: 'objectId', label: 'Master Object ID' }],
    },
  ],
};

export const getSlideOutputSchema: OutputSchema = {
  fields: [
    { key: 'objectId', label: 'Slide Object ID' },
    { key: 'revisionId', label: 'Revision ID' },
    slideProperties,
    { key: 'pageElements', label: 'Elements', labelKey: 'objectId', listItems: pageElementItems },
  ],
};

export const getPresentationOutlineOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'title', label: 'Title' },
    { key: 'presentationUrl', label: 'Presentation URL', format: 'url' },
    { key: 'revisionId', label: 'Revision ID' },
    { key: 'slideCount', label: 'Slide Count', format: 'number' },
    {
      key: 'slides',
      label: 'Slides',
      labelKey: 'title',
      listItems: [
        { key: 'slideNumber', label: 'Slide Number', format: 'number' },
        { key: 'objectId', label: 'Slide Object ID' },
        slideUrlField,
        { key: 'title', label: 'Title' },
        { key: 'text', label: 'Text' },
        { key: 'speakerNotes', label: 'Speaker Notes' },
        { key: 'layoutName', label: 'Layout' },
        { key: 'layoutObjectId', label: 'Layout Object ID' },
        { key: 'isSkipped', label: 'Skipped in Presentation', format: 'boolean' },
        {
          key: 'elements',
          label: 'Elements',
          labelKey: 'objectId',
          listItems: [
            { key: 'objectId', label: 'Object ID' },
            { key: 'type', label: 'Type' },
            { key: 'placeholderType', label: 'Placeholder Type' },
            { key: 'text', label: 'Text' },
          ],
        },
      ],
    },
  ],
};

export const getSlideThumbnailOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'slideObjectId', label: 'Slide Object ID' },
    { key: 'contentUrl', label: 'Image (link expires in 30 minutes)', format: 'image' },
    { key: 'width', label: 'Width (px)', format: 'number' },
    { key: 'height', label: 'Height (px)', format: 'number' },
    { key: 'file', label: 'Image File', format: 'url' },
  ],
};

export const createPresentationOutputSchema: OutputSchema = {
  fields: createdFileFields,
};

export const copyPresentationOutputSchema: OutputSchema = {
  fields: [...createdFileFields, { key: 'sourcePresentationId', label: 'Source Presentation ID' }],
};

export const generateFromTemplateOutputSchema: OutputSchema = {
  fields: [presentationIdField, { key: 'presentationUrl', label: 'Presentation URL', format: 'url' }],
};

export const findPresentationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'presentations',
      label: 'Presentations',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Presentation ID' },
        { key: 'name', label: 'Name' },
        { key: 'webViewLink', label: 'Presentation URL', format: 'url' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'ownerName', label: 'Owner Name' },
        { key: 'ownerEmail', label: 'Owner Email', format: 'email' },
        { key: 'folderId', label: 'Folder ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextPageToken', label: 'Next Page Token' },
  ],
};

export const addSlideOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'slideObjectId', label: 'Slide Object ID' },
    { key: 'slideNumber', label: 'Slide Number', format: 'number' },
    slideUrlField,
    { key: 'titleObjectId', label: 'Title Object ID' },
    { key: 'bodyObjectId', label: 'Body Object ID' },
  ],
};

export const duplicateSlideOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'slideObjectId', label: 'New Slide Object ID' },
    { key: 'slideNumber', label: 'New Slide Number', format: 'number' },
    slideUrlField,
    { key: 'sourceSlideObjectId', label: 'Original Slide Object ID' },
  ],
};

export const moveSlideOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'slideObjectId', label: 'Slide Object ID' },
    { key: 'slideNumber', label: 'New Slide Number', format: 'number' },
    { key: 'previousSlideNumber', label: 'Previous Slide Number', format: 'number' },
    { key: 'moved', label: 'Moved', format: 'boolean' },
  ],
};

export const deleteSlideOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'deletedSlideObjectId', label: 'Deleted Slide Object ID' },
    { key: 'deletedSlideNumber', label: 'Deleted Slide Number', format: 'number' },
    { key: 'remainingSlideCount', label: 'Remaining Slides', format: 'number' },
  ],
};

export const replaceTextOutputSchema: OutputSchema = {
  fields: [presentationIdField, { key: 'occurrencesChanged', label: 'Occurrences Replaced', format: 'number' }],
};

export const replaceShapesWithImageOutputSchema: OutputSchema = {
  fields: [presentationIdField, { key: 'occurrencesChanged', label: 'Shapes Replaced', format: 'number' }],
};

export const insertImageOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'imageObjectId', label: 'Image Object ID' },
    { key: 'slideObjectId', label: 'Slide Object ID' },
  ],
};

export const setSpeakerNotesOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'slideObjectId', label: 'Slide Object ID' },
    { key: 'speakerNotes', label: 'Speaker Notes' },
    { key: 'speakerNotesObjectId', label: 'Speaker Notes Object ID' },
    { key: 'changed', label: 'Changed', format: 'boolean' },
  ],
};

export const exportPresentationOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    { key: 'mimeType', label: 'MIME Type' },
    { key: 'sizeBytes', label: 'Size', format: 'filesize' },
    presentationIdField,
  ],
};

export const refreshSheetsChartsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Charts Refreshed', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'result',
      label: 'Result',
      children: [
        presentationIdField,
        {
          key: 'writeControl',
          label: 'Write Control',
          children: [{ key: 'requiredRevisionId', label: 'Revision ID' }],
        },
      ],
    },
  ],
};

export const batchUpdateOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'appliedRequests', label: 'Requests Applied', format: 'number' },
    { key: 'replies', label: 'Replies' },
    {
      key: 'writeControl',
      label: 'Write Control',
      children: [{ key: 'requiredRevisionId', label: 'Revision ID' }],
    },
  ],
};

const slideObjectIdField: OutputSchemaField = { key: 'slideObjectId', label: 'Slide Object ID' };

const objectIdField: OutputSchemaField = { key: 'objectId', label: 'Element Object ID' };

const geometryFields: OutputSchemaField[] = [
  { key: 'x', label: 'X (pt)', format: 'number' },
  { key: 'y', label: 'Y (pt)', format: 'number' },
  { key: 'width', label: 'Width (pt)', format: 'number' },
  { key: 'height', label: 'Height (pt)', format: 'number' },
];

const cellFields: OutputSchemaField[] = [
  { key: 'row', label: 'Row', format: 'number' },
  { key: 'column', label: 'Column', format: 'number' },
];

export const listSlideElementsOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    { key: 'slideNumber', label: 'Slide Number', format: 'number' },
    { key: 'slideWidth', label: 'Slide Width (pt)', format: 'number' },
    { key: 'slideHeight', label: 'Slide Height (pt)', format: 'number' },
    { key: 'elementCount', label: 'Elements', format: 'number' },
    {
      key: 'elements',
      label: 'Elements',
      labelKey: 'objectId',
      listItems: [
        objectIdField,
        { key: 'type', label: 'Type' },
        { key: 'shapeType', label: 'Shape Type' },
        { key: 'placeholderType', label: 'Placeholder Type' },
        { key: 'parentGroupId', label: 'Parent Group ID' },
        ...geometryFields,
        { key: 'rotationDegrees', label: 'Rotation (degrees)', format: 'number' },
        { key: 'text', label: 'Text' },
        { key: 'tableRows', label: 'Table Rows', format: 'number' },
        { key: 'tableColumns', label: 'Table Columns', format: 'number' },
        { key: 'tableCells', label: 'Table Cells' },
      ],
    },
  ],
};

export const createShapeOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    objectIdField,
    { key: 'shapeType', label: 'Shape Type' },
    ...geometryFields,
    { key: 'text', label: 'Text' },
  ],
};

export const insertTextOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    objectIdField,
    ...cellFields,
    { key: 'insertedAt', label: 'Inserted At Index', format: 'number' },
    { key: 'text', label: 'Text After Insert' },
  ],
};

export const setElementTextOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    objectIdField,
    ...cellFields,
    { key: 'text', label: 'Text' },
    { key: 'changed', label: 'Changed', format: 'boolean' },
  ],
};

export const updateTextStyleOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    objectIdField,
    { key: 'rangesStyled', label: 'Ranges Styled', format: 'number' },
    { key: 'updatedFields', label: 'Updated Styles' },
  ],
};

export const updateParagraphStyleOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    objectIdField,
    { key: 'rangesStyled', label: 'Ranges Styled', format: 'number' },
    { key: 'alignment', label: 'Alignment' },
    { key: 'bullets', label: 'Bullets' },
  ],
};

export const updateShapePropertiesOutputSchema: OutputSchema = {
  fields: [presentationIdField, slideObjectIdField, objectIdField, { key: 'updatedFields', label: 'Updated Properties' }],
};

export const moveResizeElementOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    objectIdField,
    ...geometryFields,
    { key: 'rotationDegrees', label: 'Rotation (degrees)', format: 'number' },
  ],
};

export const deleteElementsOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'deletedObjectIds', label: 'Deleted Object IDs' },
    { key: 'deletedCount', label: 'Deleted', format: 'number' },
    { key: 'slideObjectIds', label: 'Slide Object IDs' },
  ],
};

export const createTableOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    { key: 'tableObjectId', label: 'Table Object ID' },
    { key: 'rows', label: 'Rows', format: 'number' },
    { key: 'columns', label: 'Columns', format: 'number' },
    { key: 'filledCells', label: 'Cells Filled', format: 'number' },
  ],
};

export const tableLinesOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    { key: 'tableObjectId', label: 'Table Object ID' },
    { key: 'dimension', label: 'Dimension' },
    { key: 'position', label: 'Position', format: 'number' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'rows', label: 'Rows Now', format: 'number' },
    { key: 'columns', label: 'Columns Now', format: 'number' },
  ],
};

export const setSlideBackgroundOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    { key: 'slideObjectIds', label: 'Slide Object IDs' },
    { key: 'slideCount', label: 'Slides Changed', format: 'number' },
    { key: 'backgroundType', label: 'Background Type' },
    { key: 'color', label: 'Color' },
    { key: 'imageUrl', label: 'Image URL', format: 'url' },
  ],
};

export const insertVideoOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    { key: 'videoObjectId', label: 'Video Object ID' },
    { key: 'source', label: 'Source' },
    { key: 'videoId', label: 'Video ID' },
  ],
};

export const replaceImageOutputSchema: OutputSchema = {
  fields: [
    presentationIdField,
    slideObjectIdField,
    { key: 'imageObjectId', label: 'Image Object ID' },
    { key: 'imageUrl', label: 'Image URL', format: 'url' },
    { key: 'fit', label: 'Fit' },
  ],
};
