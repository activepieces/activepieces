# Cody AI Integration

🧩 **Product Overview**

Cody is an AI model framework that generates responses from bots, ingests knowledge base documents, and continues conversations. This integration allows Activepieces to interface with Cody, sending prompts, adding context documents, or continuing chat conversations.

## 🛠️ Actions

| Action | Description |
|--------|-------------|
| **Create Document From Text** | Upload text content to create a new document within the Cody knowledge base |
| **Upload File to Knowledge Base** | Add a file directly into a specific folder in the knowledge base |
| **Send Message** | Send your message and receive the AI-generated response |
| **Create Conversation** | Creates new conversation with bot (supports Focus Mode for document-specific knowledge) |
| **Find Bot** | Finds bot based on name |
| **Find Conversation** | Finds conversation based on bot or name |

## 🔧 Authentication

This piece uses **API Key** authentication. You'll need to:

1. Sign up for a Cody AI account
2. Navigate to your API settings in the Cody AI dashboard
3. Generate an API key
4. Use this key in the Activepieces connection setup

## 📚 API Reference

For detailed API documentation, visit: [Cody API Documentation](https://developers.meetcody.ai/)

## 🚀 Getting Started

1. **Set up Authentication**: Add your Cody AI API key to create a connection
2. **Find Your Bot**: Use the "Find Bot" action to locate the bot you want to interact with
3. **Create Conversations**: Use "Create Conversation" to start new chat sessions
4. **Send Messages**: Use "Send Message" to interact with your AI bot
5. **Manage Knowledge Base**: Use "Create Document From Text" or "Upload File to Knowledge Base" to enhance your bot's knowledge

## 💡 Use Cases

- **Customer Support Automation**: Create conversational AI bots for customer service
- **Knowledge Management**: Upload documents and files to enhance bot knowledge
- **Focus Mode Conversations**: Create conversations limited to specific documents for targeted responses
- **Content Generation**: Use AI bots to generate responses and content
- **Workflow Automation**: Integrate AI responses into your business workflows
- **Document Processing**: Upload and process various file types in the knowledge base

## 🔗 Integration Features

- **Comprehensive Error Handling**: Robust error management for production use
- **Rich Response Data**: Detailed metadata and response information
- **Flexible Search**: Find bots and conversations with exact or partial matching
- **File Upload Support**: Upload various file types to the knowledge base
- **Custom API Calls**: Use the custom API call action for advanced use cases

## 📝 Notes

- All actions include comprehensive error handling and validation
- The piece follows Activepieces standards for consistency and reliability
- Rich response data provides detailed information for workflow integration
- API responses include success status, data, and helpful metadata

## 🤝 Contributing

This piece was built following Activepieces development standards. For contributions:

1. Follow the [Activepieces Piece Development Guidelines](https://www.activepieces.com/docs/developers/building-pieces/create-action)
2. Ensure all actions include proper error handling
3. Provide comprehensive property descriptions
4. Include rich response data for workflow integration
5. Test thoroughly before submitting

## 📄 License

This integration is part of the Activepieces open-source project and follows the same license terms.