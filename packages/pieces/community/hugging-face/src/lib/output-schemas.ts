import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const rawResultField = (key: string): OutputSchemaField => ({
  key,
  label: 'Raw Provider Response',
  description: 'The untouched response from the model provider. Its shape varies by model.',
});

const scoredLabelItems: OutputSchemaField[] = [
  { key: 'label', label: 'Label' },
  { key: 'score', label: 'Score', format: 'number' },
];

const nextCursorField: OutputSchemaField = {
  key: 'next_cursor',
  label: 'Next Cursor',
  description: 'Pass this to Cursor to fetch the next page. Null on the last page.',
};

const nextPageField: OutputSchemaField = {
  key: 'next_page',
  label: 'Next Page',
  format: 'number',
  description: 'Pass this to Page to fetch the next page. Null on the last page.',
};

const countField: OutputSchemaField = { key: 'count', label: 'Count', format: 'number' };

const pageField: OutputSchemaField = { key: 'page', label: 'Page', format: 'number' };

const gatedField: OutputSchemaField = {
  key: 'gated',
  label: 'Gated',
  description: "false, or the gating mode such as 'auto' or 'manual'.",
};

const hubAccountFields: OutputSchemaField[] = [
  { key: 'name', label: 'Username' },
  { key: 'fullname', label: 'Full Name' },
  { key: 'type', label: 'Account Type' },
];

const repoSearchCoreFields: OutputSchemaField[] = [
  { key: 'id', label: 'Repo ID' },
  { key: 'likes', label: 'Likes', format: 'number' },
  { key: 'trendingScore', label: 'Trending Score', format: 'number' },
  { key: 'private', label: 'Private', format: 'boolean' },
  { key: 'tags', label: 'Tags' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const repoCardBaseFields: OutputSchemaField[] = [
  { key: 'id', label: 'Repo ID' },
  { key: 'author', label: 'Author' },
  { key: 'likes', label: 'Likes', format: 'number' },
  { key: 'downloads', label: 'Downloads', format: 'number' },
  { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
  gatedField,
  { key: 'private', label: 'Private', format: 'boolean' },
];

const repoCardFields: OutputSchemaField[] = [
  ...repoCardBaseFields,
  { key: 'pipeline_tag', label: 'Pipeline Task', description: 'Models only.' },
  { key: 'numParameters', label: 'Parameters', format: 'number', description: 'Models only.' },
];

const repoDetailCoreFields: OutputSchemaField[] = [
  { key: 'id', label: 'Repo ID' },
  { key: 'author', label: 'Author' },
  { key: 'tags', label: 'Tags' },
  { key: 'likes', label: 'Likes', format: 'number' },
  { key: 'sha', label: 'Latest Commit SHA' },
  { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'private', label: 'Private', format: 'boolean' },
  gatedField,
  { key: 'disabled', label: 'Disabled', format: 'boolean' },
  { key: 'usedStorage', label: 'Used Storage', format: 'filesize' },
];

const siblingsField: OutputSchemaField = {
  key: 'siblings',
  label: 'Files',
  labelKey: 'rfilename',
  listItems: [{ key: 'rfilename', label: 'File Path' }],
};

const gitRefItemFields: OutputSchemaField[] = [
  { key: 'name', label: 'Name' },
  { key: 'ref', label: 'Ref' },
  { key: 'targetCommit', label: 'Target Commit' },
];

const discussionSummaryFields: OutputSchemaField[] = [
  { key: 'num', label: 'Number', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'status', label: 'Status' },
  { key: 'isPullRequest', label: 'Is Pull Request', format: 'boolean' },
  { key: 'pinned', label: 'Pinned', format: 'boolean' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'author', label: 'Author', children: hubAccountFields },
  {
    key: 'repo',
    label: 'Repo',
    children: [
      { key: 'name', label: 'Repo ID' },
      { key: 'type', label: 'Repo Type' },
    ],
  },
];

const commentEventFields: OutputSchemaField[] = [
  { key: 'id', label: 'Event ID' },
  { key: 'type', label: 'Event Type' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'author', label: 'Author', children: hubAccountFields },
  {
    key: 'data',
    label: 'Data',
    description: "For 'comment' events: the latest comment text and edit state.",
    children: [
      {
        key: 'latest',
        label: 'Latest Version',
        children: [
          { key: 'raw', label: 'Text (Markdown)' },
          { key: 'html', label: 'Text (HTML)', format: 'html' },
          { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        ],
      },
      { key: 'edited', label: 'Edited', format: 'boolean' },
      { key: 'hidden', label: 'Hidden', format: 'boolean' },
      { key: 'numEdits', label: 'Edit Count', format: 'number' },
    ],
  },
];

const paperAuthorsField: OutputSchemaField = {
  key: 'authors',
  label: 'Authors',
  labelKey: 'name',
  listItems: [{ key: 'name', label: 'Name' }],
};

const paperCoreFields: OutputSchemaField[] = [
  { key: 'id', label: 'Paper ID', description: 'The arXiv ID, for example 2307.09288.' },
  { key: 'title', label: 'Title' },
  { key: 'summary', label: 'Abstract' },
  { key: 'publishedAt', label: 'Published At', format: 'datetime' },
  { key: 'upvotes', label: 'Upvotes', format: 'number' },
  paperAuthorsField,
  { key: 'discussionId', label: 'Discussion ID' },
];

const paperListingFields: OutputSchemaField[] = [
  { key: 'title', label: 'Title' },
  { key: 'publishedAt', label: 'Published At', format: 'datetime' },
  { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
  { key: 'numComments', label: 'Comments', format: 'number' },
];

const collectionFields: OutputSchemaField[] = [
  { key: 'slug', label: 'Collection Slug' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
  { key: 'private', label: 'Private', format: 'boolean' },
  { key: 'upvotes', label: 'Upvotes', format: 'number' },
  { key: 'owner', label: 'Owner', children: hubAccountFields },
  {
    key: 'items',
    label: 'Items',
    labelKey: 'id',
    listItems: [
      { key: 'type', label: 'Item Type' },
      { key: 'position', label: 'Position', format: 'number' },
      ...repoCardFields,
    ],
  },
];

const viewerPartialField: OutputSchemaField = {
  key: 'partial',
  label: 'Partial',
  format: 'boolean',
  description: 'True when the viewer only processed part of a very large dataset.',
};

const viewerPendingField: OutputSchemaField = {
  key: 'pending',
  label: 'Pending',
  description: 'Subsets or splits the viewer is still processing.',
};

const viewerFailedField: OutputSchemaField = {
  key: 'failed',
  label: 'Failed',
  description: 'Subsets or splits the viewer could not process.',
};

const datasetSplitRefFields: OutputSchemaField[] = [
  { key: 'dataset', label: 'Dataset ID' },
  { key: 'config', label: 'Subset (Config)' },
  { key: 'split', label: 'Split' },
];

const datasetFeaturesField: OutputSchemaField = {
  key: 'features',
  label: 'Columns',
  labelKey: 'name',
  listItems: [
    { key: 'feature_idx', label: 'Column Index', format: 'number' },
    { key: 'name', label: 'Column Name' },
    {
      key: 'type',
      label: 'Column Type',
      description: "The datasets feature type, for example {dtype: 'string', _type: 'Value'} or a ClassLabel with names.",
    },
  ],
};

const datasetRowsField: OutputSchemaField = {
  key: 'rows',
  label: 'Rows',
  labelKey: 'row_idx',
  listItems: [
    { key: 'row_idx', label: 'Row Index', format: 'number' },
    {
      key: 'row',
      label: 'Row',
      dynamicKey: true,
      description: 'The row values, keyed by column name. Columns differ per dataset; see Columns.',
    },
    {
      key: 'truncated_cells',
      label: 'Truncated Cells',
      description: 'Names of columns whose values were cut short because they were too large.',
    },
  ],
};

const datasetSizeCoreFields: OutputSchemaField[] = [
  { key: 'dataset', label: 'Dataset ID' },
  { key: 'num_rows', label: 'Rows', format: 'number' },
  { key: 'num_bytes_parquet_files', label: 'Parquet Size', format: 'filesize' },
  { key: 'num_bytes_memory', label: 'In-Memory Size', format: 'filesize' },
  {
    key: 'estimated_num_rows',
    label: 'Estimated Rows',
    format: 'number',
    description: 'Only set when the viewer processed part of the data; null otherwise.',
  },
];

export const languageTranslationOutputSchema: OutputSchema = {
  fields: [
    { key: 'translatedText', label: 'Translated Text' },
    { key: 'originalText', label: 'Original Text' },
    { key: 'model', label: 'Model' },
    { key: 'sourceLanguage', label: 'Source Language' },
    { key: 'targetLanguage', label: 'Target Language' },
    {
      key: 'parameters',
      label: 'Parameters Sent',
      children: [
        { key: 'clean_up_tokenization_spaces', label: 'Clean Up Spaces', format: 'boolean' },
        { key: 'src_lang', label: 'Source Language Code' },
        { key: 'tgt_lang', label: 'Target Language Code' },
        {
          key: 'max_length',
          label: 'Max Length',
          format: 'number',
          description: 'Only present when Max Translation Length is set.',
        },
      ],
    },
    rawResultField('rawResult'),
  ],
};

export const textSummarizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'summary', label: 'Summary' },
    { key: 'originalText', label: 'Original Text' },
    {
      key: 'statistics',
      label: 'Statistics',
      children: [
        { key: 'originalLength', label: 'Original Length', format: 'number' },
        { key: 'originalWords', label: 'Original Words', format: 'number' },
        { key: 'summaryLength', label: 'Summary Length', format: 'number' },
        { key: 'summaryWords', label: 'Summary Words', format: 'number' },
        { key: 'compressionRatio', label: 'Compression Ratio' },
        { key: 'lengthCategory', label: 'Length Category' },
      ],
    },
    { key: 'model', label: 'Model' },
    { key: 'contentType', label: 'Content Type' },
    {
      key: 'businessInsights',
      label: 'Insights',
      children: [
        { key: 'readingTimeSaved', label: 'Reading Time Saved' },
        { key: 'useCase', label: 'Use Case' },
        { key: 'qualityTips', label: 'Quality Tips' },
      ],
    },
    rawResultField('rawResult'),
  ],
};

export const textClassificationOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'predictions',
      label: 'Predictions',
      labelKey: 'label',
      listItems: scoredLabelItems,
    },
    { key: 'topPrediction', label: 'Top Prediction', children: scoredLabelItems },
    { key: 'text', label: 'Text' },
    { key: 'model', label: 'Model' },
    { key: 'classificationMode', label: 'Classification Mode' },
    {
      key: 'customCategories',
      label: 'Custom Categories',
      description: 'Only present in zero-shot mode.',
    },
    { key: 'confidenceThreshold', label: 'Confidence Threshold', format: 'number' },
    {
      key: 'highConfidencePredictions',
      label: 'High Confidence Predictions',
      labelKey: 'label',
      listItems: scoredLabelItems,
    },
    rawResultField('rawResult'),
  ],
};

export const chatCompletionOutputSchema: OutputSchema = {
  fields: [
    { key: 'response', label: 'Response' },
    {
      key: 'conversation',
      label: 'Conversation',
      children: [
        { key: 'userMessage', label: 'User Message' },
        { key: 'assistantMessage', label: 'Assistant Message' },
        {
          key: 'fullConversation',
          label: 'Full Conversation',
          labelKey: 'role',
          listItems: [
            { key: 'role', label: 'Role' },
            { key: 'content', label: 'Content' },
          ],
        },
      ],
    },
    {
      key: 'metadata',
      label: 'Metadata',
      children: [
        { key: 'model', label: 'Model' },
        { key: 'useCase', label: 'Use Case' },
        { key: 'conversationMode', label: 'Conversation Mode' },
        { key: 'template', label: 'Template' },
        { key: 'finishReason', label: 'Finish Reason' },
      ],
    },
    {
      key: 'metrics',
      label: 'Metrics',
      children: [
        { key: 'userMessageLength', label: 'User Message Length', format: 'number' },
        { key: 'responseLength', label: 'Response Length', format: 'number' },
        { key: 'tokensUsed', label: 'Tokens Used', format: 'number' },
        { key: 'promptTokens', label: 'Prompt Tokens', format: 'number' },
        { key: 'completionTokens', label: 'Completion Tokens', format: 'number' },
        { key: 'estimatedCost', label: 'Estimated Cost' },
      ],
    },
    {
      key: 'businessInsights',
      label: 'Insights',
      children: [
        { key: 'useCase', label: 'Use Case' },
        { key: 'qualityTips', label: 'Quality Tips' },
        { key: 'nextSteps', label: 'Next Steps' },
      ],
    },
    rawResultField('rawResult'),
  ],
};

export const createImageOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'image',
      label: 'Image (Base64)',
      description: 'The raw base64 payload, without a data URI prefix.',
    },
    {
      key: 'imageData',
      label: 'Image Data',
      children: [
        { key: 'format', label: 'Format' },
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'sizeKB', label: 'Size (KB)', format: 'number' },
        { key: 'base64', label: 'Data URI', format: 'image' },
      ],
    },
    {
      key: 'generation',
      label: 'Generation',
      children: [
        { key: 'prompt', label: 'Prompt' },
        { key: 'negativePrompt', label: 'Negative Prompt' },
        { key: 'model', label: 'Model' },
        { key: 'useCase', label: 'Use Case' },
      ],
    },
    {
      key: 'parameters',
      label: 'Parameters',
      children: [
        { key: 'width', label: 'Width', format: 'number' },
        { key: 'height', label: 'Height', format: 'number' },
        { key: 'aspectRatio', label: 'Aspect Ratio' },
        { key: 'guidanceScale', label: 'Guidance Scale', format: 'number' },
        { key: 'inferenceSteps', label: 'Inference Steps', format: 'number' },
        { key: 'scheduler', label: 'Scheduler' },
        { key: 'seed', label: 'Seed' },
      ],
    },
    {
      key: 'metrics',
      label: 'Metrics',
      children: [
        { key: 'generationTimeSeconds', label: 'Generation Time (Seconds)', format: 'number' },
        { key: 'imageSizeKB', label: 'Image Size (KB)', format: 'number' },
        { key: 'resolution', label: 'Resolution' },
        { key: 'qualitySetting', label: 'Quality Setting' },
        { key: 'estimatedCost', label: 'Estimated Cost' },
      ],
    },
    {
      key: 'businessInsights',
      label: 'Insights',
      children: [
        { key: 'useCase', label: 'Use Case' },
        { key: 'qualityTips', label: 'Quality Tips' },
        { key: 'nextSteps', label: 'Next Steps' },
      ],
    },
    rawResultField('rawResult'),
  ],
};

export const objectDetectionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'detections',
      label: 'Detections',
      labelKey: 'label',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'label', label: 'Label' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
        { key: 'confidencePercent', label: 'Confidence (%)', format: 'number' },
        {
          key: 'boundingBox',
          label: 'Bounding Box',
          children: [
            { key: 'xmin', label: 'X Min', format: 'number' },
            { key: 'ymin', label: 'Y Min', format: 'number' },
            { key: 'xmax', label: 'X Max', format: 'number' },
            { key: 'ymax', label: 'Y Max', format: 'number' },
          ],
        },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            { key: 'area', label: 'Area', format: 'number' },
            {
              key: 'center',
              label: 'Center',
              children: [
                { key: 'x', label: 'X', format: 'number' },
                { key: 'y', label: 'Y', format: 'number' },
              ],
            },
            { key: 'width', label: 'Width', format: 'number' },
            { key: 'height', label: 'Height', format: 'number' },
          ],
        },
      ],
    },
    {
      key: 'summary',
      label: 'Summary',
      children: [
        { key: 'totalObjectsDetected', label: 'Total Objects Detected', format: 'number' },
        { key: 'objectCategories', label: 'Object Categories', format: 'number' },
        { key: 'mostFrequentObject', label: 'Most Frequent Object' },
        { key: 'averageConfidence', label: 'Average Confidence', format: 'number' },
        { key: 'highConfidenceDetections', label: 'High Confidence Detections', format: 'number' },
      ],
    },
    {
      key: 'technical',
      label: 'Technical',
      description: 'Present when Output Format is Technical or Comprehensive.',
      children: [
        { key: 'model', label: 'Model' },
        { key: 'threshold', label: 'Threshold', format: 'number' },
        { key: 'processingTime', label: 'Processing Time', format: 'number' },
        { key: 'imageFormat', label: 'Image Format' },
        { key: 'detectionCount', label: 'Detection Count', format: 'number' },
        { key: 'truncated', label: 'Truncated', format: 'boolean' },
      ],
    },
    {
      key: 'analytics',
      label: 'Analytics',
      description: 'Present when Output Format is Analytics or Comprehensive.',
      children: [
        {
          key: 'labelDistribution',
          label: 'Label Distribution',
          dynamicKey: true,
          description: 'One entry per detected label, keyed by the label itself.',
        },
        {
          key: 'confidenceStatistics',
          label: 'Confidence Statistics',
          children: [
            { key: 'average', label: 'Average', format: 'number' },
            { key: 'maximum', label: 'Maximum', format: 'number' },
            { key: 'minimum', label: 'Minimum', format: 'number' },
            { key: 'standardDeviation', label: 'Standard Deviation', format: 'number' },
          ],
        },
        {
          key: 'qualityMetrics',
          label: 'Quality Metrics',
          children: [
            { key: 'highQuality', label: 'High Quality', format: 'number' },
            { key: 'mediumQuality', label: 'Medium Quality', format: 'number' },
            { key: 'lowQuality', label: 'Low Quality', format: 'number' },
          ],
        },
      ],
    },
    {
      key: 'detection',
      label: 'Detection',
      children: [
        { key: 'useCase', label: 'Use Case' },
        { key: 'model', label: 'Model' },
        { key: 'imageFile', label: 'Image File' },
        { key: 'threshold', label: 'Threshold', format: 'number' },
        { key: 'maxDetections', label: 'Max Detections', format: 'number' },
      ],
    },
    {
      key: 'metrics',
      label: 'Metrics',
      children: [
        { key: 'detectionTimeSeconds', label: 'Detection Time (Seconds)', format: 'number' },
        { key: 'totalDetections', label: 'Total Detections', format: 'number' },
        { key: 'displayedDetections', label: 'Displayed Detections', format: 'number' },
        { key: 'averageConfidence', label: 'Average Confidence', format: 'number' },
        { key: 'processingCost', label: 'Processing Cost' },
      ],
    },
    {
      key: 'businessInsights',
      label: 'Insights',
      children: [
        { key: 'useCase', label: 'Use Case' },
        { key: 'detectionTips', label: 'Detection Tips' },
        { key: 'nextSteps', label: 'Next Steps' },
      ],
    },
    rawResultField('rawResults'),
  ],
};

export const imageClassificationOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'classifications',
      label: 'Classifications',
      labelKey: 'label',
      listItems: [
        { key: 'rank', label: 'Rank', format: 'number' },
        { key: 'label', label: 'Label' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
        { key: 'confidencePercent', label: 'Confidence (%)', format: 'number' },
        { key: 'category', label: 'Category' },
        { key: 'isHighConfidence', label: 'High Confidence', format: 'boolean' },
        { key: 'isMediumConfidence', label: 'Medium Confidence', format: 'boolean' },
        { key: 'isLowConfidence', label: 'Low Confidence', format: 'boolean' },
      ],
    },
    {
      key: 'summary',
      label: 'Summary',
      children: [
        { key: 'topCategory', label: 'Top Category' },
        { key: 'topConfidence', label: 'Top Confidence', format: 'number' },
        { key: 'totalCategories', label: 'Total Categories', format: 'number' },
        { key: 'highConfidenceResults', label: 'High Confidence Results', format: 'number' },
        { key: 'recommendedAction', label: 'Recommended Action' },
      ],
    },
    {
      key: 'classification',
      label: 'Classification',
      children: [
        { key: 'mode', label: 'Mode' },
        { key: 'useCase', label: 'Use Case' },
        { key: 'model', label: 'Model' },
        { key: 'topCategory', label: 'Top Category' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
      ],
    },
    {
      key: 'metrics',
      label: 'Metrics',
      children: [
        { key: 'processingTimeSeconds', label: 'Processing Time (Seconds)', format: 'number' },
        { key: 'totalResults', label: 'Total Results', format: 'number' },
        { key: 'displayedResults', label: 'Displayed Results', format: 'number' },
        { key: 'averageConfidence', label: 'Average Confidence', format: 'number' },
        { key: 'estimatedCost', label: 'Estimated Cost' },
      ],
    },
    {
      key: 'businessInsights',
      label: 'Insights',
      children: [
        { key: 'useCase', label: 'Use Case' },
        { key: 'classificationTips', label: 'Classification Tips' },
        { key: 'nextSteps', label: 'Next Steps' },
      ],
    },
    rawResultField('rawResults'),
  ],
};

export const searchModelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'models',
      label: 'Models',
      labelKey: 'id',
      listItems: [
        ...repoSearchCoreFields,
        { key: 'pipeline_tag', label: 'Pipeline Task' },
        { key: 'library_name', label: 'Library' },
        { key: 'downloads', label: 'Downloads', format: 'number' },
      ],
    },
    countField,
    nextCursorField,
  ],
};

export const searchDatasetsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'datasets',
      label: 'Datasets',
      labelKey: 'id',
      listItems: [
        ...repoSearchCoreFields,
        { key: 'author', label: 'Author' },
        { key: 'description', label: 'Description' },
        { key: 'downloads', label: 'Downloads', format: 'number' },
        { key: 'lastModified', label: 'Last Modified', format: 'datetime' },
        gatedField,
        { key: 'disabled', label: 'Disabled', format: 'boolean' },
        { key: 'sha', label: 'Latest Commit SHA' },
      ],
    },
    countField,
    nextCursorField,
  ],
};

export const searchSpacesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'spaces',
      label: 'Spaces',
      labelKey: 'id',
      listItems: [...repoSearchCoreFields, { key: 'sdk', label: 'SDK' }],
    },
    countField,
    nextCursorField,
  ],
};

export const searchPapersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'papers',
      label: 'Papers',
      labelKey: 'title',
      listItems: [
        ...paperListingFields,
        {
          key: 'paper',
          label: 'Paper',
          children: [
            ...paperCoreFields,
            { key: 'ai_summary', label: 'AI Summary' },
            { key: 'ai_keywords', label: 'AI Keywords' },
          ],
        },
      ],
    },
    countField,
  ],
};

export const getModelOutputSchema: OutputSchema = {
  fields: [
    ...repoDetailCoreFields,
    { key: 'pipeline_tag', label: 'Pipeline Task' },
    { key: 'library_name', label: 'Library' },
    { key: 'downloads', label: 'Downloads (Last 30 Days)', format: 'number' },
    {
      key: 'cardData',
      label: 'Model Card Metadata',
      children: [
        { key: 'license', label: 'License' },
        { key: 'language', label: 'Language' },
      ],
    },
    {
      key: 'safetensors',
      label: 'Safetensors',
      children: [{ key: 'total', label: 'Total Parameters', format: 'number' }],
    },
    siblingsField,
    { key: 'spaces', label: 'Spaces Using This Model' },
  ],
};

export const getDatasetOutputSchema: OutputSchema = {
  fields: [
    ...repoDetailCoreFields,
    { key: 'description', label: 'Description' },
    { key: 'downloads', label: 'Downloads (Last 30 Days)', format: 'number' },
    { key: 'paperswithcode_id', label: 'Papers with Code ID' },
    {
      key: 'cardData',
      label: 'Dataset Card Metadata',
      children: [
        { key: 'pretty_name', label: 'Pretty Name' },
        { key: 'license', label: 'License' },
        { key: 'language', label: 'Language' },
        { key: 'task_categories', label: 'Task Categories' },
        { key: 'size_categories', label: 'Size Categories' },
      ],
    },
    siblingsField,
  ],
};

export const getSpaceOutputSchema: OutputSchema = {
  fields: [
    ...repoDetailCoreFields,
    { key: 'sdk', label: 'SDK' },
    { key: 'host', label: 'App URL', format: 'url' },
    { key: 'subdomain', label: 'Subdomain' },
    { key: 'region', label: 'Region' },
    {
      key: 'cardData',
      label: 'Space Card Metadata',
      children: [
        { key: 'title', label: 'Title' },
        { key: 'emoji', label: 'Emoji' },
        { key: 'sdk_version', label: 'SDK Version' },
        { key: 'app_file', label: 'App File' },
      ],
    },
    {
      key: 'runtime',
      label: 'Runtime',
      children: [
        { key: 'stage', label: 'Stage' },
        {
          key: 'hardware',
          label: 'Hardware',
          children: [
            { key: 'current', label: 'Current' },
            { key: 'requested', label: 'Requested' },
          ],
        },
      ],
    },
    siblingsField,
  ],
};

export const listTrendingReposOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'repos',
      label: 'Trending Repos',
      labelKey: 'id',
      listItems: [
        { key: 'repo_type', label: 'Repo Type' },
        ...repoCardFields,
        { key: 'title', label: 'Title', description: 'Spaces only.' },
        { key: 'emoji', label: 'Emoji', description: 'Spaces only.' },
        { key: 'shortDescription', label: 'Short Description', description: 'Spaces only.' },
        { key: 'ai_short_description', label: 'AI Short Description', description: 'Spaces only.' },
        { key: 'ai_category', label: 'AI Category', description: 'Spaces only.' },
        {
          key: 'runtime',
          label: 'Runtime',
          description: 'Spaces only.',
          children: [{ key: 'stage', label: 'Stage' }],
        },
      ],
    },
    countField,
  ],
};

export const listHubTagsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tags_by_type',
      label: 'Tags by Type',
      value: '',
      dynamicKey: true,
      description:
        "One entry per tag type (for example 'library' or 'pipeline_tag'), each a list of {id, label, type} tags. Use a tag's id as a Tag Filters value.",
    },
  ],
};

export const listRepoFilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'files',
      label: 'Files',
      labelKey: 'path',
      listItems: [
        { key: 'path', label: 'Path' },
        { key: 'type', label: 'Type', description: "'file' or 'directory'." },
        { key: 'size', label: 'Size', format: 'filesize' },
        { key: 'oid', label: 'Git Object ID' },
        {
          key: 'lfs',
          label: 'LFS',
          description: 'Only present for files stored with Git LFS.',
          children: [
            { key: 'size', label: 'Size', format: 'filesize' },
            { key: 'oid', label: 'SHA-256' },
          ],
        },
      ],
    },
    countField,
    nextCursorField,
  ],
};

export const getRepoPathsInfoOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'paths',
      label: 'Paths',
      labelKey: 'path',
      listItems: [
        { key: 'path', label: 'Path' },
        { key: 'type', label: 'Type', description: "'file' or 'directory'." },
        { key: 'size', label: 'Size', format: 'filesize' },
        { key: 'oid', label: 'Git Object ID' },
        {
          key: 'lastCommit',
          label: 'Last Commit',
          children: [
            { key: 'id', label: 'Commit SHA' },
            { key: 'title', label: 'Title' },
            { key: 'date', label: 'Date', format: 'datetime' },
          ],
        },
        {
          key: 'securityFileStatus',
          label: 'Security Status',
          children: [{ key: 'status', label: 'Overall Status' }],
        },
      ],
    },
    countField,
  ],
};

export const readRepoFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'content', label: 'Content' },
    { key: 'path', label: 'Path' },
    { key: 'size_bytes', label: 'Size', format: 'filesize' },
    { key: 'url', label: 'Download URL', format: 'url' },
    { key: 'repo_id', label: 'Repo ID' },
    { key: 'repo_type', label: 'Repo Type' },
    { key: 'revision', label: 'Revision' },
  ],
};

export const listRepoCommitsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'commits',
      label: 'Commits',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'Commit SHA' },
        { key: 'title', label: 'Title' },
        { key: 'message', label: 'Message' },
        { key: 'date', label: 'Date', format: 'datetime' },
        {
          key: 'authors',
          label: 'Authors',
          labelKey: 'user',
          listItems: [
            { key: 'user', label: 'Username' },
            { key: 'avatar', label: 'Avatar', format: 'image' },
          ],
        },
      ],
    },
    countField,
    pageField,
    nextPageField,
  ],
};

export const listRepoRefsOutputSchema: OutputSchema = {
  fields: [
    { key: 'branches', label: 'Branches', labelKey: 'name', listItems: gitRefItemFields },
    { key: 'tags', label: 'Tags', labelKey: 'name', listItems: gitRefItemFields },
    { key: 'converts', label: 'Converts', labelKey: 'name', listItems: gitRefItemFields },
    { key: 'pullRequests', label: 'Pull Requests', labelKey: 'name', listItems: gitRefItemFields },
  ],
};

export const compareRepoRevisionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'diff', label: 'Diff' },
    { key: 'base', label: 'Base Revision' },
    { key: 'head', label: 'Head Revision' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
    { key: 'diff_length', label: 'Diff Length', format: 'number' },
  ],
};

export const getRepoSizeOutputSchema: OutputSchema = {
  fields: [
    { key: 'path', label: 'Path' },
    { key: 'size', label: 'Size', format: 'filesize' },
  ],
};

export const getRepoSecurityScanOutputSchema: OutputSchema = {
  fields: [
    { key: 'scansDone', label: 'Scans Done', format: 'boolean' },
    { key: 'filesWithIssues', label: 'Files With Issues' },
  ],
};

export const getCurrentUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'username', label: 'Username' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'email_verified', label: 'Email Verified', format: 'boolean' },
    { key: 'is_pro', label: 'Is Pro', format: 'boolean' },
    { key: 'avatar_url', label: 'Avatar URL' },
    { key: 'account_type', label: 'Account Type' },
    {
      key: 'organizations',
      label: 'Organizations',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'full_name', label: 'Full Name' },
        { key: 'role_in_org', label: 'Role' },
        { key: 'is_enterprise', label: 'Is Enterprise', format: 'boolean' },
      ],
    },
    { key: 'token_role', label: 'Token Role' },
    { key: 'token_can_read_gated_repos', label: 'Token Can Read Gated Repos', format: 'boolean' },
    { key: 'token_global_permissions', label: 'Token Global Permissions' },
    {
      key: 'token_scoped_permissions',
      label: 'Token Scoped Permissions',
      labelKey: 'entity_name',
      listItems: [
        { key: 'entity_type', label: 'Entity Type' },
        { key: 'entity_name', label: 'Entity Name' },
        { key: 'permissions', label: 'Permissions' },
      ],
    },
  ],
};

export const getUserOverviewOutputSchema: OutputSchema = {
  fields: [
    { key: 'user', label: 'Username' },
    { key: 'fullname', label: 'Full Name' },
    { key: 'type', label: 'Account Type' },
    { key: 'details', label: 'Bio' },
    { key: 'avatarUrl', label: 'Avatar', format: 'image' },
    { key: 'isPro', label: 'Is Pro', format: 'boolean' },
    { key: 'createdAt', label: 'Joined At', format: 'datetime' },
    { key: 'numModels', label: 'Models', format: 'number' },
    { key: 'numDatasets', label: 'Datasets', format: 'number' },
    { key: 'numSpaces', label: 'Spaces', format: 'number' },
    { key: 'numPapers', label: 'Papers', format: 'number' },
    { key: 'numDiscussions', label: 'Discussions', format: 'number' },
    { key: 'numUpvotes', label: 'Upvotes', format: 'number' },
    { key: 'numLikes', label: 'Likes', format: 'number' },
    { key: 'numFollowers', label: 'Followers', format: 'number' },
    { key: 'numFollowing', label: 'Following', format: 'number' },
    {
      key: 'orgs',
      label: 'Organizations',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'fullname', label: 'Full Name' },
      ],
    },
  ],
};

export const getOrganizationOverviewOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'fullname', label: 'Full Name' },
    { key: 'details', label: 'Description' },
    { key: 'avatarUrl', label: 'Avatar', format: 'image' },
    { key: 'isVerified', label: 'Verified', format: 'boolean' },
    { key: 'plan', label: 'Plan' },
    { key: 'numUsers', label: 'Members', format: 'number' },
    { key: 'numModels', label: 'Models', format: 'number' },
    { key: 'numDatasets', label: 'Datasets', format: 'number' },
    { key: 'numSpaces', label: 'Spaces', format: 'number' },
    { key: 'numPapers', label: 'Papers', format: 'number' },
    { key: 'numFollowers', label: 'Followers', format: 'number' },
  ],
};

export const listOrganizationMembersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'members',
      label: 'Members',
      labelKey: 'user',
      listItems: [
        { key: 'user', label: 'Username' },
        { key: 'fullname', label: 'Full Name' },
        { key: 'type', label: 'Account Type' },
        { key: 'isPro', label: 'Is Pro', format: 'boolean' },
      ],
    },
    countField,
    nextCursorField,
  ],
};

export const listDiscussionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'discussions',
      label: 'Discussions',
      labelKey: 'title',
      listItems: [...discussionSummaryFields, { key: 'numComments', label: 'Comments', format: 'number' }],
    },
    countField,
    { key: 'total_count', label: 'Total Count', format: 'number' },
    pageField,
    nextPageField,
  ],
};

export const getDiscussionOutputSchema: OutputSchema = {
  fields: [
    ...discussionSummaryFields,
    { key: 'locked', label: 'Locked', format: 'boolean' },
    { key: 'events', label: 'Events', labelKey: 'type', listItems: commentEventFields },
  ],
};

export const listDailyPapersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'papers',
      label: 'Papers',
      labelKey: 'title',
      listItems: [
        ...paperListingFields,
        {
          key: 'paper',
          label: 'Paper',
          children: [
            ...paperCoreFields,
            { key: 'submittedOnDailyAt', label: 'Submitted to Daily Papers At', format: 'datetime' },
          ],
        },
        { key: 'submittedBy', label: 'Submitted By', children: hubAccountFields },
      ],
    },
    countField,
    pageField,
    nextPageField,
  ],
};

export const getPaperOutputSchema: OutputSchema = {
  fields: [
    ...paperCoreFields,
    { key: 'ai_summary', label: 'AI Summary' },
    { key: 'ai_keywords', label: 'AI Keywords' },
    { key: 'submittedOnDailyAt', label: 'Submitted to Daily Papers At', format: 'datetime' },
    {
      key: 'submittedOnDailyBy',
      label: 'Submitted By',
      children: [
        { key: 'user', label: 'Username' },
        { key: 'fullname', label: 'Full Name' },
      ],
    },
    { key: 'githubRepo', label: 'GitHub Repo', format: 'url' },
    { key: 'githubStars', label: 'GitHub Stars', format: 'number' },
    { key: 'linkedModels', label: 'Linked Models', labelKey: 'id', listItems: repoCardFields },
    { key: 'numTotalModels', label: 'Total Linked Models', format: 'number' },
    { key: 'linkedDatasets', label: 'Linked Datasets', labelKey: 'id', listItems: repoCardBaseFields },
    { key: 'numTotalDatasets', label: 'Total Linked Datasets', format: 'number' },
    {
      key: 'linkedSpaces',
      label: 'Linked Spaces',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Space ID' },
        { key: 'emoji', label: 'Emoji' },
        { key: 'shortDescription', label: 'Short Description' },
        { key: 'running', label: 'Running', format: 'boolean' },
      ],
    },
    { key: 'numTotalSpaces', label: 'Total Linked Spaces', format: 'number' },
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'id',
      description: 'Only present when Include Comments is on.',
      listItems: [
        ...commentEventFields,
        { key: 'replies', label: 'Replies', labelKey: 'id', listItems: commentEventFields },
      ],
    },
  ],
};

export const listCollectionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'collections', label: 'Collections', labelKey: 'title', listItems: collectionFields },
    countField,
    nextCursorField,
  ],
};

export const getCollectionOutputSchema: OutputSchema = {
  fields: [...collectionFields, { key: 'shareUrl', label: 'Share URL', format: 'url' }],
};

export const generateChatCompletionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'content',
      label: 'Reply',
      description: "Empty with finish_reason 'length' means Max Tokens ran out, often on hidden reasoning.",
    },
    { key: 'finish_reason', label: 'Finish Reason' },
    { key: 'model', label: 'Model' },
    { key: 'id', label: 'Completion ID' },
    {
      key: 'usage',
      label: 'Token Usage',
      children: [
        { key: 'prompt_tokens', label: 'Prompt Tokens', format: 'number' },
        { key: 'completion_tokens', label: 'Completion Tokens', format: 'number' },
        { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
      ],
    },
  ],
};

export const generateEmbeddingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'model', label: 'Model' },
    { key: 'dimensions', label: 'Dimensions', format: 'number' },
    {
      key: 'embedding',
      label: 'Embedding',
      description: 'The vector for a single input text. Only present when one text was sent.',
    },
    {
      key: 'embeddings',
      label: 'Embeddings',
      description: 'One vector per input text, in input order. Only present when several texts were sent.',
    },
    {
      key: 'count',
      label: 'Count',
      format: 'number',
      description: 'Number of vectors returned. Only present when several texts were sent.',
    },
  ],
};

export const checkDatasetViewerSupportOutputSchema: OutputSchema = {
  fields: [
    { key: 'preview', label: 'Preview Supported', format: 'boolean' },
    { key: 'viewer', label: 'Viewer Supported', format: 'boolean' },
    { key: 'search', label: 'Search Supported', format: 'boolean' },
    { key: 'filter', label: 'Filter Supported', format: 'boolean' },
    { key: 'statistics', label: 'Statistics Supported', format: 'boolean' },
  ],
};

export const listDatasetSplitsOutputSchema: OutputSchema = {
  fields: [
    { key: 'splits', label: 'Splits', labelKey: 'split', listItems: datasetSplitRefFields },
    countField,
    viewerPendingField,
    viewerFailedField,
  ],
};

export const previewDatasetRowsOutputSchema: OutputSchema = {
  fields: [
    ...datasetSplitRefFields,
    datasetFeaturesField,
    datasetRowsField,
    countField,
    {
      key: 'rows_available',
      label: 'Rows Available in Preview',
      format: 'number',
      description: 'How many preview rows the viewer returned before Max Rows was applied (at most 100).',
    },
    {
      key: 'truncated',
      label: 'Truncated',
      format: 'boolean',
      description: 'True when the preview holds fewer rows than the whole split.',
    },
  ],
};

export const getDatasetRowsOutputSchema: OutputSchema = {
  fields: [
    datasetFeaturesField,
    datasetRowsField,
    countField,
    { key: 'offset', label: 'Offset', format: 'number' },
    {
      key: 'next_offset',
      label: 'Next Offset',
      format: 'number',
      description: 'Pass this to Offset to fetch the next page. Null on the last page.',
    },
    { key: 'num_rows_total', label: 'Total Rows', format: 'number' },
    { key: 'num_rows_per_page', label: 'Rows per Page', format: 'number' },
    viewerPartialField,
  ],
};

export const getDatasetViewerInfoOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'dataset_info',
      label: 'Dataset Info',
      description:
        'With a subset: that subset\'s description, citation, homepage, license, features (column schema keyed by column name), splits (keyed by split name, with num_examples and num_bytes), download_size and dataset_size. Without a subset: the same object keyed by subset name.',
    },
    viewerPartialField,
  ],
};

export const getDatasetSizeOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'size',
      label: 'Size',
      children: [
        {
          key: 'dataset',
          label: 'Whole Dataset',
          description: 'Totals across every subset.',
          children: [
            ...datasetSizeCoreFields,
            { key: 'num_bytes_original_files', label: 'Original Files Size', format: 'filesize' },
          ],
        },
        {
          key: 'configs',
          label: 'Subsets',
          labelKey: 'config',
          listItems: [
            ...datasetSizeCoreFields,
            { key: 'config', label: 'Subset (Config)' },
            { key: 'num_columns', label: 'Columns', format: 'number' },
            { key: 'num_bytes_original_files', label: 'Original Files Size', format: 'filesize' },
          ],
        },
        {
          key: 'splits',
          label: 'Splits',
          labelKey: 'split',
          listItems: [
            ...datasetSizeCoreFields,
            { key: 'config', label: 'Subset (Config)' },
            { key: 'split', label: 'Split' },
            { key: 'num_columns', label: 'Columns', format: 'number' },
          ],
        },
      ],
    },
    viewerPendingField,
    viewerFailedField,
    viewerPartialField,
  ],
};

export const getDatasetStatisticsOutputSchema: OutputSchema = {
  fields: [
    { key: 'num_examples', label: 'Rows in Split', format: 'number' },
    {
      key: 'statistics',
      label: 'Column Statistics',
      labelKey: 'column_name',
      listItems: [
        { key: 'column_name', label: 'Column Name' },
        {
          key: 'column_type',
          label: 'Column Type',
          description: "The viewer's column type, for example 'class_label' or 'string_text'.",
        },
        {
          key: 'column_statistics',
          label: 'Statistics',
          description:
            'Keys depend on the column type. All include nan_count and nan_proportion; for example string_text adds min, max, mean, median, std and histogram (of text lengths), and class_label adds n_unique and frequencies.',
        },
      ],
    },
    viewerPartialField,
  ],
};

export const listDatasetParquetFilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'parquet_files',
      label: 'Parquet Files',
      labelKey: 'split',
      listItems: [
        ...datasetSplitRefFields,
        { key: 'filename', label: 'File Name' },
        { key: 'url', label: 'Download URL', format: 'url' },
        { key: 'size', label: 'Size', format: 'filesize' },
      ],
    },
    countField,
    viewerPendingField,
    viewerFailedField,
    viewerPartialField,
  ],
};

export const getDatasetLeaderboardOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Leaderboard Entries',
      labelKey: 'model_id',
      listItems: [
        { key: 'rank', label: 'Rank', format: 'number' },
        { key: 'model_id', label: 'Model ID' },
        { key: 'value', label: 'Score', format: 'number' },
        { key: 'lower_is_better', label: 'Lower Is Better', format: 'boolean' },
        { key: 'num_parameters', label: 'Parameters', format: 'number' },
        { key: 'verified', label: 'Verified', format: 'boolean' },
        { key: 'author_name', label: 'Author' },
        { key: 'author_fullname', label: 'Author Full Name' },
        { key: 'author_type', label: 'Author Type' },
        { key: 'source_name', label: 'Source' },
        { key: 'source_url', label: 'Source URL', format: 'url' },
        { key: 'source_is_external', label: 'Source Is External', format: 'boolean' },
        { key: 'pull_request', label: 'Pull Request Number', format: 'number' },
        { key: 'filename', label: 'Eval Results File' },
      ],
    },
    countField,
  ],
};
