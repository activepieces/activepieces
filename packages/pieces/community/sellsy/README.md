# Sellsy Piece

This piece provides comprehensive integration with Sellsy CRM and sales management platform, enabling automation of CRM operations including contacts, companies, opportunities, tasks, and annotations.

## 🚀 Features

### Triggers (8)
- **New Contact** - Fires when a new contact is created
- **Updated Contact** - Fires when a contact is updated  
- **New Company** - Fires when a new company is created
- **Updated Company** - Fires when a company is updated
- **New Opportunity** - Fires when a new opportunity is created
- **Updated Opportunity Status** - Fires when opportunity stage changes
- **New Task** - Fires when a new task is created
- **Updated Task** - Fires when a task is updated

### Actions (8)
- **Create Annotation** - Add notes/comments to contacts, companies, or opportunities
- **Create Contact** - Create new contacts with full details
- **Update Contact** - Update existing contact information
- **Create Opportunity** - Create new sales opportunities
- **Update Opportunity** - Update opportunity details and stages
- **Create Company** - Create new company records
- **Find Contact** - Search for contacts by email, phone, or name
- **Find Company** - Search for companies by name or email

## 🔐 Authentication

This piece uses **API Key + Company ID** authentication:

1. **API Key**: Your Sellsy API key from account settings
2. **Company ID**: Your Sellsy company identifier

### Setup Instructions:
1. Log in to your Sellsy account
2. Navigate to Settings > API
3. Generate a new API key
4. Note your Company ID from the settings page

## 📦 Installation

This piece is part of the Activepieces community pieces and will be available in the Activepieces builder once merged.

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 🤝 Contributing

This piece follows Activepieces development guidelines and is ready for production use. 