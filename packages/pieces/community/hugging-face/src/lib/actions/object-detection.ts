import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from '@huggingface/inference';
import type {
  ObjectDetectionInput,
  ObjectDetectionOutput,
} from '@huggingface/tasks';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';

export const objectDetection = createAction({
  name: 'object_detection',
  auth: huggingFaceAuth,
  displayName: 'Object Detection',
  description:
    'Detect and locate objects in images with precise bounding boxes - perfect for inventory management, content moderation, and automated tagging',
  props: {
    useCase: Property.StaticDropdown({
      displayName: 'Use Case',
      description: 'What type of object detection do you need?',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: '📋 General Objects (COCO Dataset)',
            value: 'general',
          },
          {
            label: '📊 Documents & Tables',
            value: 'documents',
          },
          {
            label: '🛡️ Security & Monitoring',
            value: 'security',
          },
          {
            label: '🏢 Business & Commerce',
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
      displayName: 'Detection Model',
      description: 'Select the best model for your detection task',
      required: true,
      refreshers: ['useCase'],
      options: async ({ useCase }) => {
        // Define model options based on use case
        const getModelsByUseCase = (type: string) => {
          switch (type) {
            case 'general':
              return [
                {
                  label: 'DETR ResNet-50 (🏆 Industry Standard)',
                  value: 'facebook/detr-resnet-50',
                  description: '306K downloads | 80+ object classes',
                },
                {
                  label: 'YOLOS Small (⚡ Fast Detection)',
                  value: 'hustvl/yolos-small',
                  description: '756K downloads | Lightweight & efficient',
                },
                {
                  label: 'YOLOS Tiny (🚀 Ultra Fast)',
                  value: 'hustvl/yolos-tiny',
                  description: '128K downloads | Mobile-friendly',
                },
                {
                  label: 'YOLOv8 (🔬 Latest Technology)',
                  value: 'Ultralytics/YOLOv8',
                  description: '4.6K downloads | State-of-the-art accuracy',
                },
              ];
            case 'documents':
              return [
                {
                  label: 'Table Transformer Detection (📊 Table Expert)',
                  value: 'microsoft/table-transformer-detection',
                  description: '2.3M downloads | Perfect for table detection',
                },
                {
                  label: 'Table Structure Recognition (🔍 Structure Analysis)',
                  value: 'microsoft/table-transformer-structure-recognition',
                  description: '1.2M downloads | Analyzes table structure',
                },
                {
                  label: 'Doc Table Detection (📋 Document Focus)',
                  value: 'TahaDouaji/detr-doc-table-detection',
                  description: '651K downloads | Document-specific tables',
                },
              ];
            case 'security':
              return [
                {
                  label: 'License Plate Detection (🚗 Vehicle Focus)',
                  value: 'keremberke/yolov5n-license-plate',
                  description: '151K downloads | Vehicle identification',
                },
                {
                  label: 'CRAFT Text Detection (📝 Text Security)',
                  value: 'hezarai/CRAFT',
                  description: '101K downloads | Text content monitoring',
                },
                {
                  label: 'DETR ResNet-50 (👁️ General Security)',
                  value: 'facebook/detr-resnet-50',
                  description: '306K downloads | People & object detection',
                },
              ];
            case 'business':
              return [
                {
                  label: 'Stock Pattern Detection (📈 Trading Analysis)',
                  value: 'foduucom/stockmarket-pattern-detection-yolov8',
                  description: '8.2K downloads | Financial chart analysis',
                },
                {
                  label: 'RT-DETR R101 (💼 Professional Quality)',
                  value: 'PekingU/rtdetr_r101vd_coco_o365',
                  description: '139K downloads | High-precision detection',
                },
                {
                  label: 'RT-DETR R50 (⚖️ Balanced Performance)',
                  value: 'PekingU/rtdetr_r50vd_coco_o365',
                  description: '84K downloads | Business-grade accuracy',
                },
              ];
            default:
              return [];
          }
        };

        if (useCase === 'search') {
          try {
            const response = await httpClient.sendRequest({
              method: HttpMethod.GET,
              url: 'https://huggingface.co/api/models?pipeline_tag=object-detection&sort=downloads&limit=50',
            });

            const models = response.body as Array<{
              id: string;
              downloads: number;
              likes: number;
            }>;

            return {
              disabled: false,
              placeholder: 'Select from 50+ detection models...',
              options: models
                .filter((model) => model.downloads > 10000)
                .slice(0, 25)
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
              options: getModelsByUseCase('general'),
            };
          }
        }

        return {
          disabled: false,
          options: getModelsByUseCase(useCase as string),
        };
      },
    }),
    image: Property.File({
      displayName: 'Image to Analyze',
      description:
        'Upload an image for object detection. Supports JPG, PNG, WebP formats.',
      required: true,
    }),
    confidenceThreshold: Property.Number({
      displayName: 'Confidence Threshold',
      description:
        'Minimum confidence score for detections (0.1-0.9). Higher values = fewer but more accurate detections.',
      required: false,
      defaultValue: 0.5,
    }),
    maxDetections: Property.Number({
      displayName: 'Max Detections',
      description: 'Maximum number of objects to detect (1-100)',
      required: false,
      defaultValue: 50,
    }),
    filterSettings: Property.StaticDropdown({
      displayName: 'Detection Filter',
      description: 'How to handle detection results',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '🎯 High Confidence Only (>0.7)', value: 'high_confidence' },
          { label: '⚖️ Balanced Results (>0.5)', value: 'balanced' },
          { label: '📊 All Detections (>0.1)', value: 'all_results' },
          { label: '⚙️ Custom Threshold', value: 'custom' },
        ],
      },
      defaultValue: 'balanced',
    }),
    outputFormat: Property.StaticDropdown({
      displayName: 'Output Format',
      description: 'How to structure the detection results',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '📋 Business Summary', value: 'business' },
          { label: '🔧 Technical Details', value: 'technical' },
          { label: '📊 Statistical Analysis', value: 'analytics' },
          { label: '🌐 All Information', value: 'comprehensive' },
        ],
      },
      defaultValue: 'business',
    }),
  },
  async run(context) {
    const {
      useCase,
      model,
      image,
      confidenceThreshold,
      maxDetections,
      filterSettings,
      outputFormat,
    } = context.propsValue;

    if (!image?.data) {
      throw new Error('Please provide an image file for analysis');
    }

    // Determine actual confidence threshold
    let actualThreshold: number;
    switch (filterSettings) {
      case 'high_confidence':
        actualThreshold = 0.7;
        break;
      case 'balanced':
        actualThreshold = 0.5;
        break;
      case 'all_results':
        actualThreshold = 0.1;
        break;
      case 'custom':
        actualThreshold = confidenceThreshold || 0.5;
        break;
      default:
        actualThreshold = 0.5;
    }

    // Get image MIME type
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

    const mimeType = getMimeType(image.filename);
    const imageBlob = new Blob([new Uint8Array(image.data)], {
      type: mimeType,
    });

    const hf = new InferenceClient(context.auth as string);

    // Build detection arguments
    const args: ObjectDetectionInput = {
      inputs: imageBlob,
      parameters: {
        threshold: actualThreshold,
      },
    };

    // Track detection start time
    const startTime = Date.now();

    try {
      // Perform object detection
      const detectionResults: ObjectDetectionOutput = await hf.objectDetection(
        args,
        {
          retry_on_error: true,
        }
      );

      // Calculate detection metrics
      const detectionTime = (Date.now() - startTime) / 1000;
      const totalDetections = detectionResults.length;
      const limitedResults = detectionResults.slice(0, maxDetections || 50);

      // Group detections by label
      const labelCounts = limitedResults.reduce((acc, detection) => {
        acc[detection.label] = (acc[detection.label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate confidence statistics
      const confidenceScores = limitedResults.map((d) => d.score);
      const avgConfidence =
        confidenceScores.reduce((sum, score) => sum + score, 0) /
        confidenceScores.length;
      const maxConfidence = Math.max(...confidenceScores);
      const minConfidence = Math.min(...confidenceScores);

      // Prepare different output formats
      const businessSummary = {
        totalObjectsDetected: limitedResults.length,
        objectCategories: Object.keys(labelCounts).length,
        mostFrequentObject: Object.entries(labelCounts).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0],
        averageConfidence: Math.round(avgConfidence * 100),
        highConfidenceDetections: limitedResults.filter((d) => d.score > 0.8)
          .length,
      };

      const technicalDetails = {
        model: model,
        threshold: actualThreshold,
        processingTime: detectionTime,
        imageFormat: mimeType,
        detectionCount: limitedResults.length,
        truncated: totalDetections > (maxDetections || 50),
      };

      const analytics = {
        labelDistribution: labelCounts,
        confidenceStatistics: {
          average: avgConfidence,
          maximum: maxConfidence,
          minimum: minConfidence,
          standardDeviation: calculateStandardDeviation(confidenceScores),
        },
        qualityMetrics: {
          highQuality: limitedResults.filter((d) => d.score > 0.8).length,
          mediumQuality: limitedResults.filter(
            (d) => d.score > 0.5 && d.score <= 0.8
          ).length,
          lowQuality: limitedResults.filter((d) => d.score <= 0.5).length,
        },
      };

      // Enhanced detection results with additional metadata
      const enhancedDetections = limitedResults.map((detection, index) => {
        const boxArea =
          (detection.box.xmax - detection.box.xmin) *
          (detection.box.ymax - detection.box.ymin);
        const boxCenter = {
          x: (detection.box.xmin + detection.box.xmax) / 2,
          y: (detection.box.ymin + detection.box.ymax) / 2,
        };

        return {
          id: index + 1,
          label: detection.label,
          confidence: Math.round(detection.score * 100) / 100,
          confidencePercent: Math.round(detection.score * 100),
          boundingBox: detection.box,
          metadata: {
            area: Math.round(boxArea * 10000) / 10000,
            center: {
              x: Math.round(boxCenter.x * 1000) / 1000,
              y: Math.round(boxCenter.y * 1000) / 1000,
            },
            width:
              Math.round((detection.box.xmax - detection.box.xmin) * 1000) /
              1000,
            height:
              Math.round((detection.box.ymax - detection.box.ymin) * 1000) /
              1000,
          },
        };
      });

      // Build response based on output format
      const baseResponse = {
        detections: enhancedDetections,
        summary: businessSummary,
      };

      if (outputFormat === 'technical') {
        Object.assign(baseResponse, {
          technical: technicalDetails,
        });
      } else if (outputFormat === 'analytics') {
        Object.assign(baseResponse, {
          analytics: analytics,
        });
      } else if (outputFormat === 'comprehensive') {
        Object.assign(baseResponse, {
          technical: technicalDetails,
          analytics: analytics,
        });
      }

      return {
        ...baseResponse,
        detection: {
          useCase: useCase,
          model: model,
          imageFile: image.filename,
          threshold: actualThreshold,
          maxDetections: maxDetections || 50,
        },
        metrics: {
          detectionTimeSeconds: detectionTime,
          totalDetections: totalDetections,
          displayedDetections: limitedResults.length,
          averageConfidence: Math.round(avgConfidence * 100),
          processingCost: calculateEstimatedCost(model, totalDetections),
        },
        businessInsights: {
          useCase: getUseCaseDescription(useCase as string),
          detectionTips: getDetectionTips(
            enhancedDetections,
            actualThreshold,
            useCase as string
          ),
          nextSteps: getNextSteps(
            useCase as string,
            limitedResults.length,
            Object.keys(labelCounts).length
          ),
        },
        rawResults: detectionResults,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Object detection failed: ${errorMessage}`);
    }
  },
});

// Helper function to calculate standard deviation
function calculateStandardDeviation(values: number[]): number {
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance =
    squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

// Helper function to get use case descriptions
function getUseCaseDescription(useCase: string): string {
  const descriptions = {
    general: 'Versatile object detection for everyday items and common objects',
    documents:
      'Specialized detection for tables, forms, and document structures',
    security:
      'Security-focused detection for monitoring and identification tasks',
    business:
      'Business-oriented detection for inventory, products, and commerce',
    search: 'Custom model selection for specialized detection requirements',
  };

  return (
    descriptions[useCase as keyof typeof descriptions] ||
    'AI-powered object detection'
  );
}

// Helper function to provide detection tips
function getDetectionTips(
  detections: Array<{ confidence: number; label: string }>,
  threshold: number,
  useCase: string
): string[] {
  const tips: string[] = [];

  if (detections.length === 0) {
    tips.push('🔍 No objects detected - try lowering the confidence threshold');
    tips.push('📸 Ensure image has clear, well-lit objects');
  } else if (detections.length < 3) {
    tips.push(
      '💡 Few objects detected - consider lowering threshold for more results'
    );
  } else if (detections.length > 20) {
    tips.push(
      '📊 Many objects detected - consider higher threshold for quality'
    );
  }

  if (threshold > 0.7) {
    tips.push('🎯 High threshold set - only very confident detections shown');
  } else if (threshold < 0.3) {
    tips.push('⚠️ Low threshold may include false positives');
  }

  const avgConfidence =
    detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
  if (avgConfidence < 0.6) {
    tips.push('📈 Consider using a different model for better accuracy');
  }

  if (
    useCase === 'documents' &&
    detections.some((d) => d.label.includes('table'))
  ) {
    tips.push('📋 Tables detected - great for document processing workflows');
  }

  if (tips.length === 0) {
    tips.push('✅ Good detection results - objects identified successfully');
  }

  return tips;
}

// Helper function to suggest next steps
function getNextSteps(
  useCase: string,
  detectionCount: number,
  uniqueLabels: number
): string[] {
  const steps: string[] = [];

  if (useCase === 'business') {
    steps.push('📊 Use detections to trigger inventory management workflows');
    steps.push('🏷️ Implement automatic product tagging and categorization');
  }

  if (useCase === 'security') {
    steps.push('🚨 Set up alerts for specific object types detected');
    steps.push('📹 Integrate with monitoring systems for real-time analysis');
  }

  if (useCase === 'documents') {
    steps.push('📄 Extract detected tables for data processing');
    steps.push('🔍 Combine with OCR for complete document analysis');
  }

  if (detectionCount > 10) {
    steps.push('📈 Consider batch processing for multiple images');
  }

  if (uniqueLabels > 5) {
    steps.push('🏷️ Implement multi-category filtering and sorting');
  }

  steps.push('💾 Save successful detection settings for consistent results');
  steps.push('🔄 Process similar images with the same model configuration');

  return steps;
}

// Helper function to estimate costs (rough approximation)
function calculateEstimatedCost(model: string, detectionCount: number): string {
  const baseDetectionCost = 0.001; // Cost per detection
  const modelMultiplier = model.includes('microsoft/table-transformer')
    ? 1.5
    : model.includes('yolov8') || model.includes('rtdetr')
    ? 2.0
    : model.includes('yolos-tiny')
    ? 0.5
    : 1.0;

  const estimatedCost = baseDetectionCost * detectionCount * modelMultiplier;

  if (estimatedCost < 0.001) {
    return '< $0.001';
  }

  return `~$${estimatedCost.toFixed(4)}`;
}
