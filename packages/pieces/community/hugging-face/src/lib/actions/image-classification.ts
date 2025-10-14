import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from '@huggingface/inference';
import type {
  ImageClassificationInput,
  ImageClassificationOutput,
  ZeroShotImageClassificationInput,
  ZeroShotImageClassificationOutput,
} from '@huggingface/tasks';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';

export const imageClassification = createAction({
  name: 'image_classification',
  auth: huggingFaceAuth,
  displayName: 'Image Classification',
  description:
    'Classify images with pre-trained models or custom categories - perfect for content moderation, automated tagging, and smart asset management',
  props: {
    classificationMode: Property.StaticDropdown({
      displayName: 'Classification Mode',
      description: 'How do you want to classify your images?',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: '🏷️ Pre-trained Categories (Standard)',
            value: 'standard',
          },
          {
            label: '🎯 Custom Categories (Zero-shot)',
            value: 'zero_shot',
          },
        ],
      },
      defaultValue: 'standard',
    }),
    useCase: Property.StaticDropdown({
      displayName: 'Use Case',
      description: 'What type of image classification do you need?',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: '🛡️ Content Moderation & Safety',
            value: 'moderation',
          },
          {
            label: '🏷️ General Image Tagging',
            value: 'general',
          },
          {
            label: '👤 People & Demographics',
            value: 'people',
          },
          {
            label: '🎨 Creative & Media',
            value: 'creative',
          },
          {
            label: '💼 Business & Commerce',
            value: 'business',
          },
          {
            label: '🔍 Search All Models',
            value: 'search',
          },
        ],
      },
      defaultValue: 'general',
    }),
    model: Property.Dropdown({
      displayName: 'Classification Model',
      description: 'Select the best model for your use case',
      required: true,
      refreshers: ['classificationMode', 'useCase'],
      options: async ({ classificationMode, useCase }) => {
        const getModelsByUseCase = (mode: string, type: string) => {
          if (mode === 'zero_shot') {
            return [
              {
                label: 'CLIP ViT Base (⚡ Fast & Versatile)',
                value: 'openai/clip-vit-base-patch32',
                description: '18.5M downloads | General purpose zero-shot',
              },
              {
                label: 'CLIP ViT Large (🏆 High Accuracy)',
                value: 'openai/clip-vit-large-patch14',
                description:
                  '9.3M downloads | Best accuracy for complex scenes',
              },
              {
                label: 'CLIP ViT Large 336 (🔬 Ultra Precise)',
                value: 'openai/clip-vit-large-patch14-336',
                description: '7.9M downloads | Highest resolution processing',
              },
              {
                label: 'Fashion CLIP (👗 Fashion Specialized)',
                value: 'patrickjohncyh/fashion-clip',
                description: '2.9M downloads | Perfect for fashion & retail',
              },
            ];
          }

          switch (type) {
            case 'moderation':
              return [
                {
                  label: 'NSFW Detection (🛡️ Content Safety)',
                  value: 'Falconsai/nsfw_image_detection',
                  description: '115M downloads | Industry-leading safety',
                },
                {
                  label: 'AdamCodd NSFW Detector (🔍 Alternative Safety)',
                  value: 'AdamCodd/vit-base-nsfw-detector',
                  description: '745K downloads | Reliable content filtering',
                },
                {
                  label: 'ViT Base General (📊 Multi-purpose Safety)',
                  value: 'google/vit-base-patch16-224',
                  description:
                    '3.5M downloads | General classification + safety',
                },
              ];
            case 'people':
              return [
                {
                  label: 'Face Expression Detection (😊 Emotion Analysis)',
                  value: 'trpakov/vit-face-expression',
                  description: '5.4M downloads | 7 emotion categories',
                },
                {
                  label: 'Age Classification (👶 Age Detection)',
                  value: 'nateraw/vit-age-classifier',
                  description: '1.2M downloads | Age group classification',
                },
                {
                  label: 'FairFace Age Detection (📊 Demographic Analysis)',
                  value: 'dima806/fairface_age_image_detection',
                  description: '67M downloads | Professional demographics',
                },
                {
                  label: 'Gender Classification (👥 Gender Analysis)',
                  value: 'rizvandwiki/gender-classification',
                  description: '1.1M downloads | Binary gender classification',
                },
              ];
            case 'general':
              return [
                {
                  label: 'ViT Base Patch16 (🏆 Industry Standard)',
                  value: 'google/vit-base-patch16-224',
                  description: '3.5M downloads | 1000+ ImageNet categories',
                },
                {
                  label: 'ResNet-50 (⚡ Fast & Reliable)',
                  value: 'timm/resnet50.a1_in1k',
                  description: '16.8M downloads | Classic CNN architecture',
                },
                {
                  label: 'ResNet-18 (🚀 Ultra Fast)',
                  value: 'timm/resnet18.a1_in1k',
                  description: '4.8M downloads | Lightweight classification',
                },
                {
                  label: 'MobileNet V3 (📱 Mobile Optimized)',
                  value: 'timm/mobilenetv3_small_100.lamb_in1k',
                  description: '53M downloads | Edge deployment ready',
                },
              ];
            case 'creative':
              return [
                {
                  label: 'ViT Base Patch16 (🎨 Creative Content)',
                  value: 'google/vit-base-patch16-224',
                  description:
                    '3.5M downloads | Art, design, creative analysis',
                },
                {
                  label: 'MobileViT Small (📸 Media Processing)',
                  value: 'apple/mobilevit-small',
                  description: '1.3M downloads | Optimized for media workflows',
                },
                {
                  label: 'ResNet-50 (🖼️ Image Analysis)',
                  value: 'timm/resnet50.a1_in1k',
                  description:
                    '16.8M downloads | Versatile image understanding',
                },
              ];
            case 'business':
              return [
                {
                  label: 'ViT Base Patch16 (💼 Business Ready)',
                  value: 'google/vit-base-patch16-224',
                  description: '3.5M downloads | Professional grade accuracy',
                },
                {
                  label: 'Fashion CLIP (🛍️ E-commerce)',
                  value: 'patrickjohncyh/fashion-clip',
                  description: '2.9M downloads | Product categorization',
                },
                {
                  label: 'ResNet-50 (📊 Business Intelligence)',
                  value: 'timm/resnet50.a1_in1k',
                  description: '16.8M downloads | Reliable business workflows',
                },
              ];
            default:
              return [];
          }
        };

        if (useCase === 'search') {
          try {
            const pipelineTag =
              classificationMode === 'zero_shot'
                ? 'zero-shot-image-classification'
                : 'image-classification';

            const response = await httpClient.sendRequest({
              method: HttpMethod.GET,
              url: `https://huggingface.co/api/models?pipeline_tag=${pipelineTag}&sort=downloads&limit=50`,
            });

            const models = response.body as Array<{
              id: string;
              downloads: number;
              likes: number;
            }>;

            return {
              disabled: false,
              placeholder: 'Select from popular models...',
              options: models
                .filter((model) => model.downloads > 10000)
                .slice(0, 20)
                .map((model) => ({
                  label: `${model.id} (${(model.downloads / 1000).toFixed(
                    0
                  )}K downloads)`,
                  value: model.id,
                })),
            };
          } catch (error) {
            return {
              disabled: false,
              options: getModelsByUseCase(
                classificationMode as string,
                'general'
              ),
            };
          }
        }

        return {
          disabled: false,
          options: getModelsByUseCase(
            classificationMode as string,
            useCase as string
          ),
        };
      },
    }),
    imageSource: Property.StaticDropdown({
      displayName: 'Image Source',
      description: 'How do you want to provide the image?',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: '📎 Upload File', value: 'upload' },
          { label: '🔗 Image URL', value: 'url' },
        ],
      },
      defaultValue: 'upload',
    }),
    imageFile: Property.File({
      displayName: 'Image File',
      description: 'Upload an image file for classification (JPG, PNG, WebP)',
      required: true,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the image to classify',
      required: true,
    }),
    customCategories: Property.Array({
      displayName: 'Custom Categories',
      description:
        'Enter the categories you want to classify the image into (e.g., "dog", "cat", "bird")',
      required: true,
    }),
    hypothesisTemplate: Property.ShortText({
      displayName: 'Classification Template',
      description:
        'Template for classification (advanced). Default: "This image shows {}"',
      required: false,
      defaultValue: 'This image shows {}',
    }),
    topK: Property.Number({
      displayName: 'Number of Results',
      description: 'Maximum number of classification results to return (1-20)',
      required: false,
      defaultValue: 5,
    }),
    confidenceThreshold: Property.Number({
      displayName: 'Confidence Threshold',
      description: 'Minimum confidence score for results (0.0-1.0)',
      required: false,
      defaultValue: 0.1,
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'How to structure the classification results',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '📋 Business Summary', value: 'business' },
          { label: '🔧 Technical Details', value: 'technical' },
          { label: '📊 Statistical Analysis', value: 'analytics' },
          { label: '🌐 Comprehensive Report', value: 'comprehensive' },
        ],
      },
      defaultValue: 'business',
    }),
  },
  async run(context) {
    const {
      classificationMode,
      useCase,
      model,
      imageSource,
      imageFile,
      imageUrl,
      customCategories,
      hypothesisTemplate,
      topK,
      confidenceThreshold,
      outputFormat,
    } = context.propsValue;

    const actualHypothesisTemplate = Array.isArray(hypothesisTemplate)
      ? hypothesisTemplate[0] || 'This image shows {}'
      : hypothesisTemplate || 'This image shows {}';

    const actualImageUrl = Array.isArray(imageUrl)
      ? imageUrl[0] || ''
      : imageUrl || '';

    if (
      classificationMode === 'zero_shot' &&
      (!customCategories || customCategories.length === 0)
    ) {
      throw new Error(
        'Please provide custom categories for zero-shot classification'
      );
    }

    if (imageSource === 'upload' && !imageFile?.data) {
      throw new Error('Please upload an image file');
    }

    if (imageSource === 'url' && !actualImageUrl.trim()) {
      throw new Error('Please provide an image URL');
    }

    // Get image blob
    let imageBlob: Blob;
    let imageName: string;

    if (imageSource === 'upload') {
      const getMimeType = (filename: string): string => {
        const extension = filename.split('.').pop()?.toLowerCase() ?? '';
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            return 'image/jpeg';
          case 'png':
            return 'image/png';
          case 'gif':
            return 'image/gif';
          case 'webp':
            return 'image/webp';
          default:
            return 'image/jpeg';
        }
      };

      const mimeType = getMimeType(imageFile.filename);
      imageBlob = new Blob([new Uint8Array(imageFile.data)], {
        type: mimeType,
      });
      imageName = imageFile.filename;
    } else {
      try {
        const imageResponse = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: actualImageUrl.trim(),
          responseType: 'arraybuffer',
        });

        const urlParts = actualImageUrl.split('/');
        imageName = urlParts[urlParts.length - 1] || 'image';

        // Determine MIME type from URL or response headers
        const responseHeaders = imageResponse.headers || {};
        const contentType =
          (Array.isArray(responseHeaders['content-type'])
            ? responseHeaders['content-type'][0]
            : responseHeaders['content-type']) || 'image/jpeg';
        imageBlob = new Blob([new Uint8Array(imageResponse.body)], {
          type: contentType,
        });
      } catch (error) {
        throw new Error(
          `Failed to fetch image from URL: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    const hf = new InferenceClient(context.auth as string);
    const startTime = Date.now();

    try {
      let classificationResults:
        | ImageClassificationOutput
        | ZeroShotImageClassificationOutput;

      if (classificationMode === 'zero_shot') {
        const candidateLabels = Array.isArray(customCategories)
          ? customCategories.map((cat) => String(cat).trim()).filter(Boolean)
          : [String(customCategories).trim()].filter(Boolean);

        const zeroShotArgs: ZeroShotImageClassificationInput = {
          inputs: imageBlob,
          parameters: {
            candidate_labels: candidateLabels,
            hypothesis_template: actualHypothesisTemplate,
          },
        };

        classificationResults = await hf.zeroShotImageClassification(
          zeroShotArgs,
          {
            retry_on_error: true,
          }
        );
      } else {
        const standardArgs: ImageClassificationInput = {
          inputs: imageBlob,
          parameters: {
            top_k: topK || 5,
          },
        };

        classificationResults = await hf.imageClassification(standardArgs, {
          retry_on_error: true,
        });
      }

      const processingTime = (Date.now() - startTime) / 1000;
      const filteredResults = classificationResults.filter(
        (result) => result.score >= (confidenceThreshold || 0.1)
      );
      const limitedResults = filteredResults.slice(0, topK || 5);

      const confidenceScores = limitedResults.map((r) => r.score);
      const avgConfidence =
        confidenceScores.reduce((sum, score) => sum + score, 0) /
        confidenceScores.length;
      const maxConfidence = Math.max(...confidenceScores);
      const minConfidence = Math.min(...confidenceScores);

      const enhancedResults = limitedResults.map((result, index) => ({
        rank: index + 1,
        label: result.label,
        confidence: Math.round(result.score * 100) / 100,
        confidencePercent: Math.round(result.score * 100),
        category: result.label,
        isHighConfidence: result.score > 0.7,
        isMediumConfidence: result.score > 0.4 && result.score <= 0.7,
        isLowConfidence: result.score <= 0.4,
      }));

      const topCategory = enhancedResults[0]?.label || 'unknown';
      const highConfidenceCount = enhancedResults.filter(
        (r) => r.isHighConfidence
      ).length;
      const categoryDistribution = enhancedResults.reduce((acc, result) => {
        acc[result.label] = result.confidence;
        return acc;
      }, {} as Record<string, number>);

      const businessSummary = {
        topCategory: topCategory,
        topConfidence: Math.round((enhancedResults[0]?.confidence || 0) * 100),
        totalCategories: enhancedResults.length,
        highConfidenceResults: highConfidenceCount,
        recommendedAction: getRecommendedAction(
          topCategory,
          enhancedResults[0]?.confidence || 0,
          useCase as string
        ),
      };

      const technicalDetails = {
        model: model,
        classificationMode: classificationMode,
        processingTimeSeconds: processingTime,
        originalResultCount: classificationResults.length,
        filteredResultCount: filteredResults.length,
        confidenceThreshold: confidenceThreshold || 0.1,
        imageSource: imageSource,
        imageName: imageName,
      };

      const analytics = {
        confidenceStatistics: {
          average: avgConfidence,
          maximum: maxConfidence,
          minimum: minConfidence,
          standardDeviation: calculateStandardDeviation(confidenceScores),
        },
        categoryDistribution: categoryDistribution,
        qualityMetrics: {
          highConfidenceResults: enhancedResults.filter(
            (r) => r.isHighConfidence
          ).length,
          mediumConfidenceResults: enhancedResults.filter(
            (r) => r.isMediumConfidence
          ).length,
          lowConfidenceResults: enhancedResults.filter((r) => r.isLowConfidence)
            .length,
        },
        customCategories:
          classificationMode === 'zero_shot' ? customCategories : undefined,
      };

      // Build response based on output format
      const baseResponse = {
        classifications: enhancedResults,
        summary: businessSummary,
      };

      if (outputFormat === 'technical') {
        Object.assign(baseResponse, { technical: technicalDetails });
      } else if (outputFormat === 'analytics') {
        Object.assign(baseResponse, { analytics: analytics });
      } else if (outputFormat === 'comprehensive') {
        Object.assign(baseResponse, {
          technical: technicalDetails,
          analytics: analytics,
        });
      }

      return {
        ...baseResponse,
        classification: {
          mode: classificationMode,
          useCase: useCase,
          model: model,
          topCategory: topCategory,
          confidence: enhancedResults[0]?.confidence || 0,
        },
        metrics: {
          processingTimeSeconds: processingTime,
          totalResults: classificationResults.length,
          displayedResults: enhancedResults.length,
          averageConfidence: Math.round(avgConfidence * 100),
          estimatedCost: calculateEstimatedCost(model),
        },
        businessInsights: {
          useCase: getUseCaseDescription(
            useCase as string,
            classificationMode as string
          ),
          classificationTips: getClassificationTips(
            enhancedResults,
            classificationMode as string,
            useCase as string
          ),
          nextSteps: getNextSteps(
            useCase as string,
            topCategory,
            enhancedResults[0]?.confidence || 0
          ),
        },
        rawResults: classificationResults,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Image classification failed: ${errorMessage}`);
    }
  },
});

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance =
    squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

function getRecommendedAction(
  category: string,
  confidence: number,
  useCase: string
): string {
  if (confidence > 0.8) {
    if (useCase === 'moderation') {
      return category.toLowerCase().includes('nsfw') ||
        category.toLowerCase().includes('inappropriate')
        ? '🚨 Block content - high confidence inappropriate material'
        : '✅ Approve content - safe for publication';
    }
    return `✅ High confidence classification as "${category}" - proceed with automated action`;
  } else if (confidence > 0.5) {
    return `⚠️ Medium confidence - consider manual review for "${category}"`;
  } else {
    return `❓ Low confidence - manual review recommended`;
  }
}

function getUseCaseDescription(useCase: string, mode: string): string {
  const descriptions = {
    moderation: 'Content safety and moderation for safe user experiences',
    general: `${
      mode === 'zero_shot' ? 'Custom category' : 'General purpose'
    } image classification and tagging`,
    people: 'Human-focused analysis for demographics and emotions',
    creative: 'Creative content analysis for media and design workflows',
    business: 'Business-grade classification for commerce and automation',
    search: 'Custom model selection for specialized classification needs',
  };

  return (
    descriptions[useCase as keyof typeof descriptions] ||
    'AI-powered image classification'
  );
}

function getClassificationTips(
  results: Array<{
    label: string;
    confidence: number;
    isHighConfidence: boolean;
  }>,
  mode: string,
  useCase: string
): string[] {
  const tips: string[] = [];

  if (results.length === 0) {
    tips.push(
      '🔍 No confident classifications found - try adjusting the confidence threshold'
    );
  } else {
    const topResult = results[0];

    if (topResult.confidence > 0.8) {
      tips.push(
        '✅ High confidence classification - reliable for automated decisions'
      );
    } else if (topResult.confidence > 0.5) {
      tips.push('⚖️ Medium confidence - good for most use cases');
    } else {
      tips.push(
        '⚠️ Low confidence - consider manual review or different model'
      );
    }

    if (mode === 'zero_shot') {
      tips.push(
        '🎯 Zero-shot mode allows custom categories - refine labels for better accuracy'
      );
    }

    if (
      useCase === 'moderation' &&
      results.some((r) => r.label.toLowerCase().includes('nsfw'))
    ) {
      tips.push(
        '🛡️ Content moderation detected - implement appropriate content policies'
      );
    }

    const highConfidenceCount = results.filter(
      (r) => r.isHighConfidence
    ).length;
    if (highConfidenceCount > 3) {
      tips.push(
        '📊 Multiple high-confidence matches - image may fit several categories'
      );
    }
  }

  if (tips.length === 0) {
    tips.push(
      '💡 Good classification results - suitable for automated processing'
    );
  }

  return tips;
}

function getNextSteps(
  useCase: string,
  topCategory: string,
  confidence: number
): string[] {
  const steps: string[] = [];

  if (useCase === 'moderation') {
    steps.push('🛡️ Implement content filtering rules based on classifications');
    steps.push('📊 Set up monitoring dashboards for content safety metrics');
  } else if (useCase === 'business') {
    steps.push('🏷️ Automate product tagging and categorization workflows');
    steps.push('📈 Analyze classification patterns for business insights');
  } else if (useCase === 'general') {
    steps.push(
      '📁 Create automated file organization based on classifications'
    );
    steps.push('🔍 Build searchable metadata from image classifications');
  }

  if (confidence > 0.8) {
    steps.push(
      '⚡ Enable fully automated processing for high-confidence results'
    );
  } else {
    steps.push('👁️ Set up human review workflows for low-confidence results');
  }

  steps.push(
    '💾 Save successful classification settings for consistent results'
  );
  steps.push('🔄 Process image batches with the same model configuration');

  return steps;
}

function calculateEstimatedCost(model: string): string {
  const baseClassificationCost = 0.0005; // Cost per classification
  const modelMultiplier = model.includes('clip-vit-large')
    ? 2.0
    : model.includes('vit-base')
    ? 1.5
    : model.includes('resnet')
    ? 1.0
    : model.includes('mobile')
    ? 0.5
    : 1.0;

  const estimatedCost = baseClassificationCost * modelMultiplier;

  if (estimatedCost < 0.001) {
    return '< $0.001';
  }

  return `~$${estimatedCost.toFixed(4)}`;
}
