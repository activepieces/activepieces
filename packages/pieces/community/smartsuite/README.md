# SmartSuite Piece for Activepieces

## Overview

This piece integrates [SmartSuite](https://www.smartsuite.com/) with Activepieces, enabling automation of project management, workflow, and data management tasks.

## Features

### Actions

| Action | Description |
|--------|-------------|
| **List Records** | List records from a SmartSuite table |
| **Get Record** | Get a specific record by ID |
| **Create Record** | Create a new record in a table |
| **Update Record** | Update an existing record |
| **Delete Record** | Delete a record from a table |
| **Search Records** | Search records using SmartSuite filters |

### Triggers

| Trigger | Description |
|---------|-------------|
| **New Record** | Triggers when a new record is created |
| **Updated Record** | Triggers when a record is updated |

## Authentication

This piece uses SmartSuite API Token authentication.

### Getting Your API Token & Workspace ID

1. Log in to your SmartSuite workspace
2. Click your user icon (upper-right corner)
3. Go to **API Token** section
4. Click the *** to reveal your token
5. Copy the **Workspace ID** from Account Settings

## API Reference

- Base URL: `https://app.smartsuite.com/api/v1/`
- Auth Header: `Authorization: Token YOUR_TOKEN`
- Account Header: `ACCOUNT-ID: YOUR_WORKSPACE_ID`

## Common Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/solutions/` | List all solutions |
| GET | `/api/v1/applications/` | List all tables |
| GET | `/api/v1/applications/{id}/records/` | List records |
| POST | `/api/v1/applications/{id}/records/` | Create record |
| PATCH | `/api/v1/applications/{id}/records/{id}/` | Update record |
| DELETE | `/api/v1/applications/{id}/records/{id}/` | Delete record |

## Common Use Cases

- **CRM Automation**: Sync SmartSuite records with other tools
- **Project Management**: Auto-create tasks from external triggers
- **Data Sync**: Keep SmartSuite data in sync with other platforms
- **Workflow Automation**: Trigger actions based on record changes

## Resources

- [SmartSuite API Documentation](https://developers.smartsuite.com/docs/intro)
- [SmartSuite Help Center](https://help.smartsuite.com/en/collections/2751280-api)
- [Activepieces Documentation](https://www.activepieces.com/docs)

## License

MIT License - see LICENSE file for details

## Authors

- ktwo
