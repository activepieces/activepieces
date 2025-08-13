# Hugging Face Piece

This piece provides integration with Hugging Face's inference API, allowing you to use various AI models for text processing, image generation, computer vision tasks, and more.

## Authentication

To use this piece, you'll need:
- **Access Token**: Your Hugging Face API access token from [Hugging Face](https://huggingface.co/settings/tokens)
- **Model**: The specific Hugging Face model you want to use (e.g., "gpt2", "bert-base-uncased", "stabilityai/stable-diffusion-2")

## Actions

### 1. Document Question Answering
**Use Case**: Parse invoices, contracts, or any document scans to extract specific information.

**Description**: Run a compatible Hugging Face model to answer questions using an image of a document.

**Properties**:
- `image`: Upload a document image (JPEG, PNG, WebP)
- `question`: The question to ask about the document
- `model`: Specific model to use (optional, overrides auth model)

**Recommended Models**: `impira/layoutlm-document-qa`, `microsoft/layoutlm-base-uncased`

### 2. Language Translation
**Use Case**: Auto-translate customer tickets, knowledge base entries, or any text content.

**Description**: Use a compatible translation model to translate text between languages.

**Properties**:
- `text`: The text to translate
- `sourceLanguage`: Source language (with auto-detect option)
- `targetLanguage`: Target language
- `model`: Specific translation model to use (optional)

**Recommended Models**: `Helsinki-NLP/opus-mt-ru-en`, `facebook/nllb-200-distilled-600M`

### 3. Text Classification
**Use Case**: Route incoming messages, categorize content, or detect sentiment automatically.

**Description**: Use a compatible classification model to categorize text (sentiment, topic, intent, etc.).

**Properties**:
- `text`: The text to classify
- `classificationType`: Type of classification (sentiment, topic, intent, language, spam, custom)
- `customLabels`: Custom labels for classification (when type is "Custom Labels")
- `model`: Specific classification model to use (optional)

**Recommended Models**: `facebook/bart-large-mnli`, `cardiffnlp/twitter-roberta-base-sentiment`

### 4. Text Summarization
**Use Case**: Condense long support emails, blog posts, or documents into brief summaries.

**Description**: Generate an abstractive summary of long text using a summarization model.

**Properties**:
- `text`: The long text to summarize
- `maxLength`: Maximum length of the summary (in words)
- `minLength`: Minimum length of the summary (in words)
- `doSample`: Whether to use sampling for generation
- `model`: Specific summarization model to use (optional)

**Recommended Models**: `facebook/bart-large-cnn`, `google/pegasus-xsum`

### 5. Chat Completion
**Use Case**: Build auto-reply agents, draft support responses, or create content outlines.

**Description**: Generate assistant replies using a chat-style LLM on Hugging Face.

**Properties**:
- `messages`: Array of messages in the conversation (system, user, assistant)
- `maxTokens`: Maximum number of tokens to generate
- `temperature`: Controls randomness (0.0 = deterministic, 1.0 = very random)
- `topP`: Nucleus sampling parameter (0.0 to 1.0)
- `model`: Specific chat model to use (optional)

**Recommended Models**: `microsoft/DialoGPT-medium`, `facebook/blenderbot-400M-distill`

### 6. Create Image
**Use Case**: Create product mockups, marketing banners, or AI-generated illustrations.

**Description**: Generate an image from a text prompt using a compatible Hugging Face diffusion model.

**Properties**:
- `prompt`: Text description of the image to generate
- `negativePrompt`: Text describing what you don't want in the image
- `width`: Width of the generated image in pixels
- `height`: Height of the generated image in pixels
- `numInferenceSteps`: Number of denoising steps (higher = better quality, slower)
- `guidanceScale`: How closely to follow the prompt (higher = more closely)
- `seed`: Random seed for reproducible results
- `model`: Specific image generation model to use (optional)

**Recommended Models**: `stabilityai/stable-diffusion-2`, `runwayml/stable-diffusion-v1-5`

### 7. Object Detection
**Use Case**: Identify products, logos, or people in images to trigger automation workflows.

**Description**: Detect and locate objects in an image using a compatible Hugging Face object detection model.

**Properties**:
- `image`: The image to analyze for object detection
- `confidenceThreshold`: Minimum confidence score for detected objects (0.0 to 1.0)
- `maxResults`: Maximum number of objects to detect
- `model`: Specific object detection model to use (optional)

**Recommended Models**: `facebook/detr-resnet-50`, `hustvl/yolos-tiny`

### 8. Image Classification
**Use Case**: Automatically tag uploaded images, sort photos into categories, or detect inappropriate content.

**Description**: Classify an image into categories or labels using a compatible Hugging Face image classification model.

**Properties**:
- `image`: The image to classify
- `topK`: Number of top classification results to return
- `model`: Specific image classification model to use (optional)

**Recommended Models**: `google/vit-base-patch16-224`, `microsoft/resnet-50`

## Getting Started

1. **Install the piece** in your Activepieces instance
2. **Configure authentication** with your Hugging Face access token and preferred model
3. **Choose an action** based on your use case
4. **Configure the action properties** according to your needs
5. **Test the action** with sample data
6. **Integrate into your workflows** to automate AI-powered tasks

## Model Selection Tips

- **Text Models**: Look for models with "text-generation", "text-classification", or "translation" in their tags
- **Image Models**: Search for models with "image-generation", "object-detection", or "image-classification" tags
- **Document Models**: Use models specifically trained for document understanding tasks
- **Performance**: Larger models generally provide better results but may be slower

## Rate Limits and Costs

- Hugging Face inference API has rate limits based on your account type
- Free tier users have limited requests per month
- Paid plans offer higher limits and priority access
- Monitor your usage in the Hugging Face dashboard

## Support

For issues with this piece, please check:
1. Your Hugging Face API token is valid and has sufficient permissions
2. The model you're using supports the task you're trying to perform
3. Your input data meets the model's requirements
4. You're within your API rate limits

## Examples

### Document Q&A Workflow
1. Customer uploads invoice image
2. Use Document Question Answering to extract invoice total
3. Create CRM record with extracted data

### Content Moderation Workflow
1. User uploads image
2. Use Image Classification to detect inappropriate content
3. If flagged, send to human reviewer
4. If clean, approve for publication

### Multilingual Support Workflow
1. Receive support ticket in foreign language
2. Use Language Translation to convert to English
3. Process with English support team
4. Translate response back to original language
5. Send to customer
