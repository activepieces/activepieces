# Comet API Piece for Activepieces

This is a Comet API integration for Activepieces that allows users to access multiple AI models through a unified interface.

## Features

- ✅ Support for multiple AI models (GPT, Claude, Gemini, DeepSeek, etc.)
- ✅ Dynamic model list loading
- ✅ Complete parameter configuration (temperature, max_tokens, top_p)
- ✅ Detailed error handling
- ✅ Custom API call support
- ✅ API key validation

## Supported Models

### GPT Series
- gpt-5-chat-latest
- chatgpt-4o-latest
- gpt-4o-mini
- gpt-5-mini
- gpt-5-nano

### Claude Series
- claude-opus-4-1-20250805
- claude-sonnet-4-20250514
- claude-3-7-sonnet-latest
- claude-3-5-haiku-latest

### Gemini Series
- gemini-2.5-pro
- gemini-2.5-flash
- gemini-2.0-flash

### Other Models
- DeepSeek series (deepseek-v3.1, deepseek-v3, deepseek-r1-0528)
- Grok series (grok-4-0709, grok-3, grok-3-mini)
- Qwen series (qwen3-30b-a3b, qwen3-coder-plus-2025-07-22)

## Usage

### 1. Get API Key
1. Visit: https://www.cometapi.com/
2. Register an account and login
3. Go to API settings page to get your API key

### 2. Configure in Activepieces
1. Create a new flow in Activepieces
2. Add the "Comet API" piece
3. Configure your API key
4. Select the AI model to use
5. Enter your prompt

### 3. Available Actions

#### Ask Comet API
Send prompts to any AI model supported by Comet API.

**Parameters:**
- **Model**: The AI model to use
- **Prompt**: The prompt text to send to the AI
- **System Message** (optional): System message to set AI behavior
- **Temperature** (optional): Controls randomness (0-2)
- **Max Tokens** (optional): Maximum tokens to generate
- **Top P** (optional): Nucleus sampling parameter (0-1)

#### Custom API Call
Directly call any endpoint of the Comet API.

## Build

Run `nx build pieces-cometapi` to build the library.