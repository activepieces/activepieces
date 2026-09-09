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
