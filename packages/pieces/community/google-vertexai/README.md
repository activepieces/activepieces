# Google Vertex AI Piece

Integrate your automation workflows with Google Vertex AI to leverage powerful AI models including Gemini and other advanced language models.

## Overview

The Google Vertex AI piece enables you to:
- Generate content and responses using Gemini and other Vertex AI models
- Make custom API requests to Vertex AI endpoints
- Build intelligent automation workflows with AI capabilities

## Authentication

This piece uses **Service Account Authentication** for secure access to Google Vertex AI APIs.

### How to Set Up

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Vertex AI API**
   - Navigate to "APIs & Services" > "Enabled APIs & services"
   - Click "Enable APIs and Services"
   - Search for "Vertex AI API"
   - Click on it and press "Enable"

3. **Create a Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Give it a name (e.g., "activepieces-vertexai")
   - Click "Create and Continue"
   - Grant the following roles:
     - **Vertex AI User** - to use Vertex AI models
     - **Editor** (or more restricted permissions as needed)
   - Click "Continue" and then "Done"

4. **Create and Download Service Account Key**
   - Click on the newly created service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose **JSON** format
   - Click "Create" - this will download a JSON file

5. **Add the Key to Activepieces**
   - In Activepieces, paste the entire JSON content from the downloaded file into the "Service Account JSON Key" field
   - The piece will validate the credentials automatically

## Actions

### 1. Generate Content (Gemini)

Generate responses using Google Vertex AI's Gemini model.

**Parameters:**
- **Location** (default: `us-central1`) - Google Cloud region where your Vertex AI resources are located
- **Model** (default: `gemini-2.5-flash`) - The Vertex AI model to use (e.g., `gemini-pro`, `gemini-2.5-flash`)
- **System Message** (optional) - Instructions to guide the model's behavior and tone
- **User Message** (required) - The prompt or question to send to the model

**Example Output:**
```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "text": "The model's response here..."
          }
        ]
      }
    }
  ]
}
```

### 2. Raw API Request

Make custom authenticated requests directly to the Vertex AI API for advanced use cases.

**Parameters:**
- **Method** (required) - HTTP method: GET, POST, PUT, PATCH, or DELETE
- **URL** (required) - Full Vertex AI API endpoint URL (e.g., `https://aiplatform.googleapis.com/v1/projects/...`)
- **Body** (optional) - JSON payload for the request

**Example:**
- Method: `POST`
- URL: `https://aiplatform.googleapis.com/v1/projects/{projectId}/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent`
- Body: Custom JSON payload

## Available Models

Common Vertex AI models you can use:
- `gemini-pro` - Large language model for text generation
- `gemini-pro-vision` - Multimodal model with vision capabilities
- `gemini-2.5-flash` - Faster, optimized model
- `text-bison` - Specialized for text tasks
- `code-bison` - Optimized for code generation

For the full list of available models, check the [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models).

## Common Use Cases

### 1. Generate Blog Content
Use the Generate Content action with a detailed prompt to automatically create blog posts based on a topic.

### 2. Customer Support Automation
Provide customer queries to Gemini for intelligent response suggestions.

### 3. Code Generation
Use the Generate Content action with code-related prompts to generate code snippets.

### 4. Data Analysis
Send data to Vertex AI for analysis and insights.

### 5. Custom API Integration
Use the Raw API Request action for advanced Vertex AI features not covered by the basic actions.

## Error Handling

Common errors and solutions:

- **Authentication Failed**: Verify your Service Account JSON key is valid and has the necessary permissions
- **API Not Enabled**: Ensure Vertex AI API is enabled in your Google Cloud project
- **Invalid Model**: Check the model name matches available Vertex AI models in your region
- **Location Not Found**: Verify the specified location is available in your Google Cloud region

## Best Practices

1. **Use System Messages**: Provide clear system messages to guide the model's behavior
2. **Handle Rate Limits**: Implement delays if making many requests in succession
3. **Cache Responses**: Store responses when possible to reduce API calls
4. **Monitor Costs**: Vertex AI API calls incur costs - monitor your usage in Google Cloud Console
5. **Use Raw Request for Advanced Features**: When specific features aren't available through the basic actions, use the Raw API Request action

## Links

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Vertex AI API Reference](https://cloud.google.com/vertex-ai/docs/reference/rest)
- [Gemini Model Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models)
- [Google Cloud Console](https://console.cloud.google.com/)
