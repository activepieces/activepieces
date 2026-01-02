# Mistral AI

Integrate with Mistral AI to leverage powerful language models for chat completions, embeddings, and file uploads.

## Authentication

This piece requires a Mistral AI API Key. You can obtain one from [Mistral AI Platform](https://console.mistral.ai/).

## Actions

### Create Chat Completion
Generate text completions from conversational prompts using Mistral AI models.

**Input:**
- Model: Select from available Mistral AI models
- Messages: Array of message objects with role and content
- Temperature: Control randomness (0-1)
- Max Tokens: Maximum number of tokens to generate
- Top P: Nucleus sampling parameter
- Stream: Enable streaming responses

### Create Embeddings
Generate vector embeddings for text inputs, useful for semantic search and similarity comparisons.

**Input:**
- Model: The embedding model to use (default: mistral-embed)
- Input: Text to generate embeddings for
- Encoding Format: Format of the embeddings (float)

### Upload File
Upload files for fine-tuning or batch processing.

**Input:**
- File: The file to upload
- Purpose: The intended purpose (fine-tune or batch)

### List Models
Retrieve a list of all available Mistral AI models.

## Custom API Call

Use the Custom API Call action to make authenticated requests to any Mistral AI API endpoint not covered by the standard actions.
