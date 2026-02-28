# Twenty CRM Piece

Twenty is an open-source CRM platform designed to be a flexible alternative to Salesforce. This piece allows you to integrate your Twenty workspace with other tools via Activepieces.

## Setup Instructions

### 1. Get your Workspace URL
Your Workspace URL (Base URL) is the address you use to access Twenty. 
* If you are using the cloud version, it looks like: `https://[your-workspace].twenty.com`
* If you are self-hosting, it is the URL of your local or hosted instance.

### 2. Generate an API Key
1. Log in to your Twenty workspace.
2. Navigate to **Settings** > **Developers** > **API Keys**.
3. Click **+ New Key**.
4. Give it a name (e.g., "Activepieces") and copy the generated token.

---

## Supported Triggers

### New Person
- **Type**: Polling
- **Description**: Triggers whenever a new person record is created in your workspace.

## Supported Actions

### Create Contact
- **Description**: Creates a new person record.
- **Fields**: First Name (Required), Last Name, Email.

---

## Authors
- [Akash5908](https://github.com/Akash5908)