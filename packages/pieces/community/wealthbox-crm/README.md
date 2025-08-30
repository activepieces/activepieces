# Wealthbox CRM Piece

This Activepieces piece integrates with Wealthbox CRM, a modern, easy-to-use CRM tailored for financial advisors. It supports contacts, notes, tasks, projects, events, opportunities, workflow automations, and household management.

## Features

### Triggers
- **New Task** - Fires when a new task is created
- **New Contact** - Fires when a new contact is created  
- **New Event** - Fires when a new event is created
- **New Opportunity** - Fires when a new opportunity is created

### Actions
- **Create Contact** - Adds a new contact with rich details (name, address, email, tags, etc.)
- **Create Note** - Adds a note linked to a contact
- **Create Project** - Starts a new project with description and organizer
- **Create Household** - Creates a household record with emails and tags
- **Add Member to Household** - Adds a member to an existing household
- **Create Event** - Creates a calendar event linked to contact
- **Create Opportunity** - Logs an opportunity including stage, close date, and amount
- **Create Task** - Creates tasks tied to contacts with due dates and assignment types
- **Start Workflow** - Triggers a workflow template on a contact/project/opportunity

### Search Actions
- **Find Contact** - Locate a contact by name, email, or phone
- **Find Task** - Finds an existing task by subject or description

## Authentication

This piece uses OAuth 2.0 authentication with Wealthbox CRM. Users will need to:

1. Connect their Wealthbox CRM account
2. Grant necessary permissions (login and data access)
3. The piece will handle token refresh automatically

## Use Cases

- **Lead Capture**: Automatically create contacts from form submissions
- **Client Communication**: Log call summaries and notes against client records
- **Project Management**: Launch project-based onboarding for new clients
- **Family Management**: Group family member contacts into households
- **Meeting Scheduling**: Schedule advisory meetings on behalf of clients
- **Opportunity Tracking**: Automate opportunity tracking after meetings
- **Task Assignment**: Assign follow-up actions when opportunities are created
- **Workflow Automation**: Trigger multi-step sequences based on CRM events

## API Endpoints

The piece integrates with the Wealthbox CRM API at `https://api.crmworkspace.com/v1` and supports all major CRM operations including:

- Contact management (CRUD operations)
- Task and event scheduling
- Opportunity and project tracking
- Workflow automation
- Household management
- Note and comment systems

## Requirements

- Activepieces version 0.36.1 or higher
- Wealthbox CRM account with API access
- OAuth 2.0 credentials from Wealthbox

## Installation

1. Install the piece in your Activepieces instance
2. Configure OAuth 2.0 authentication
3. Start building workflows with Wealthbox CRM triggers and actions

## Support

For issues or questions about this piece, please refer to the Activepieces community or create an issue in the repository.
