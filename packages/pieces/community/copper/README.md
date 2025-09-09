# Copper CRM Piece for Activepieces

A comprehensive integration for Copper CRM that provides triggers and actions for managing contacts, leads, opportunities, projects, tasks, and activities.

## Overview

Copper is a CRM built for Google Workspace, helping teams manage their customer relationships seamlessly. This Activepieces piece enables workflows to trigger on CRM events and perform CRUD operations across core entities.

## Authentication

This piece uses Copper's API Key authentication:

1. **API Key**: Your Copper API key (found in Settings > Integrations > API Keys)
2. **User Email**: The email address associated with the API key

## Triggers

### New Entity Triggers
- **New Person**: Fires when a new person/contact is created
- **New Lead**: Fires when a new lead is created  
- **New Task**: Fires when a new task is created
- **New Activity**: Fires when a new activity is logged (call, email, note)

### Updated Entity Triggers
- **Updated Lead**: Fires when a lead is modified
- **Updated Task**: Fires when a task is updated
- **Updated Opportunity**: Fires when an opportunity changes
- **Updated Project**: Fires when a project is updated

All triggers use polling strategy with 5-minute intervals and automatically handle deduplication based on timestamps.

## Actions

### Write Actions

#### People
- **Create Person**: Adds a new person/contact with name, email, phone, address, etc.
- **Update Person**: Updates an existing person using their ID

#### Leads  
- **Create Lead**: Adds a new lead with contact info and status
- **Update Lead**: Updates an existing lead
- **Convert Lead**: Converts a lead into a person (optionally with company/opportunity)

#### Companies
- **Create Company**: Adds a new company with name, website, address, etc.  
- **Update Company**: Updates an existing company record

#### Opportunities
- **Create Opportunity**: Adds a new opportunity with value, pipeline stage, etc.
- **Update Opportunity**: Updates an existing opportunity

#### Projects
- **Create Project**: Adds a new project
- **Update Project**: Updates a project record

#### Tasks
- **Create Task**: Adds a new task under a person, lead, or opportunity

#### Activities
- **Create Activity**: Logs an activity (call, email, note) related to CRM entities

### Search Actions

- **Search Person**: Lookup people using name, email, company, or title
- **Search Lead**: Find leads by name, email, company, or status
- **Search Company**: Lookup companies by name, domain, website, or location
- **Search Opportunity**: Find opportunities by name, pipeline, status, or contacts
- **Search Project**: Lookup projects by name or status
- **Search Activity**: Find activities by type, parent resource, user, or date range

All search actions support pagination and return structured results.

## API Reference

This piece implements the [Official Copper API v1](https://developer.copper.com/) endpoints:

- People: `/people`, `/people/search`
- Leads: `/leads`, `/leads/search` 
- Companies: `/companies`, `/companies/search`
- Opportunities: `/opportunities`, `/opportunities/search`
- Projects: `/projects`, `/projects/search`
- Tasks: `/tasks`, `/tasks/search`
- Activities: `/activities`, `/activities/search`

## Implementation Details

### Architecture
- **Authentication**: Custom auth with API key + user email validation
- **HTTP Client**: Centralized request handler with proper headers and error handling
- **Triggers**: Time-based polling with cursor management for incremental syncing
- **Actions**: RESTful operations with comprehensive property validation
- **Search**: POST-based search endpoints with filtering and pagination

### Key Features
- ✅ Complete CRUD operations for all major entities
- ✅ Real-time polling triggers with deduplication  
- ✅ Comprehensive search capabilities
- ✅ Custom API call action for advanced use cases
- ✅ Proper error handling and validation
- ✅ TypeScript support with proper typing

### Error Handling
- API errors are properly caught and re-thrown with context
- Input validation ensures required fields are provided
- Authentication failures return clear error messages

## Testing

You can test this integration by:

1. Creating a free Copper account at https://www.copper.com/
2. Generating an API key in Settings > Integrations > API Keys
3. Using the API key and your user email for authentication
4. Testing actions like Create Person or Search Person
5. Setting up triggers to monitor new/updated records

## Minimum Requirements

- Activepieces version 0.36.1 or higher
- Valid Copper CRM account with API access
- API key with appropriate permissions

## Categories

- Sales & CRM

## Authors

- GPT-5 Assistant (for Activepieces bounty #9134)
