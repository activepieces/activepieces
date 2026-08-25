# Azure DevOps Piece

Track work, code, and ship software with Azure DevOps. Automate your work item management and integrate with Azure Boards.

## What is Azure DevOps?

[Azure DevOps](https://azure.microsoft.com/en-us/products/devops) is a suite of development tools from Microsoft for planning, collaborating, and shipping software. Azure Boards provides work item tracking with Kanban boards, backlogs, team dashboards, and custom reporting.

This piece lets you create, update, and track work items directly from Activepieces.

## Setup

To connect Azure DevOps to Activepieces, you need a Personal Access Token (PAT):

1. Go to [Azure DevOps](https://dev.azure.com/) and sign in
2. Click your profile icon (top-right) and select **Personal access tokens**
3. Click **+ New Token**
4. Give it a name and set an expiration date
5. Under **Scopes**, select:
   - **Work Items**: Read & Write
   - **Project and Team**: Read
   - *(Optional, only for the instant trigger)* **Service Connections**: Read & Manage — lets the piece register and clean up its Service Hooks subscriptions.
6. Click **Create** and copy the token (you won't see it again)

You'll also need your **Organization URL**, which looks like `https://dev.azure.com/mycompany`.

## Actions

| Action | Description |
|--------|-------------|
| **Create Work Item** | Create a new Bug, Task, User Story, or any work item type |
| **Get Work Item** | Retrieve details of a work item by ID |
| **Update Work Item** | Update title, description, state, assignee, or priority |
| **List Work Items** | Query work items using WIQL (Work Item Query Language) |
| **Add Comment** | Add a comment to an existing work item |

## Triggers

| Trigger | Description |
|---------|-------------|
| **New or Updated Work Item (Instant)** | Fires instantly via Azure DevOps Service Hooks when a work item is created, updated, or commented on. Requires a public Activepieces webhook URL. |
| **New or Updated Work Item** | Polling fallback that checks every few minutes. Use when your Activepieces instance is not reachable from the public internet. |

### Instant trigger setup

The instant trigger registers a Service Hooks subscription in Azure DevOps automatically and removes it when the flow is disabled. Service Hooks deliver events to the webhook URL shown in the trigger's "Test" step — this URL must be reachable from Azure DevOps over HTTPS. If your Activepieces instance runs behind a private network, use the polling trigger instead.

## Example Workflow

**Auto-create Azure DevOps bugs from support tickets:**

1. **Trigger:** New Zendesk ticket with priority "High"
2. **Action:** Create Work Item (type: Bug)
3. **Action:** Add Comment with ticket details
4. **Action:** Send Slack notification to #dev channel

**Sync work item status changes:**

1. **Trigger:** New or Updated Work Item (state: Resolved)
2. **Action:** Update related Jira issue to "Done"
3. **Action:** Post update to Microsoft Teams

## Work Item Types

Azure DevOps supports various work item types depending on your process template:

- **Basic:** Epic, Issue, Task
- **Agile:** Epic, Feature, User Story, Task, Bug
- **Scrum:** Epic, Feature, Product Backlog Item, Task, Bug, Impediment
- **CMMI:** Epic, Feature, Requirement, Task, Bug, Change Request, Issue, Review, Risk

The piece automatically loads available types from your project.

## WIQL Queries

The List Work Items action supports WIQL queries. Example:

```sql
SELECT [System.Id], [System.Title] 
FROM WorkItems 
WHERE [System.TeamProject] = @project 
  AND [System.State] = 'Active' 
  AND [System.AssignedTo] = @me
ORDER BY [System.ChangedDate] DESC
```

## API Reference

This piece uses the [Azure DevOps REST API v7.1](https://learn.microsoft.com/en-us/rest/api/azure/devops/). For advanced use cases, the **Custom API Call** action lets you call any endpoint directly.
