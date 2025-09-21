# Capsule CRM

This piece integrates with Capsule CRM, a cloud CRM tool for managing contacts (people & organisations), sales opportunities, tasks, cases, milestones, tags, custom fields, and projects.

## Setup

To use this piece, you need to:

1. Go to Capsule CRM Developer Settings (https://capsulecrm.com/user/myAccount)
2. Navigate to API & Webhooks section
3. Create a new OAuth2 application
4. Set the redirect URI to: `https://cloud.activepieces.com/redirect`
5. Copy the Client ID and Client Secret

## Actions

### Write Actions
- **Create Contact**: Create a new Person or Organisation
- **Update Contact**: Update fields on an existing Contact
- **Create Opportunity**: Create a new sales Opportunity
- **Update Opportunity**: Update existing Opportunity fields
- **Create Project**: Create a new Project associated with a contact or opportunity
- **Create Task**: Create a new Task
- **Add Note to Entity**: Add a comment/note to an entity (contact, opportunity, project)

### Search Actions
- **Find Contact**: Find a Person or Organisation by search criteria
- **Find Project**: Find a Project by search criteria
- **Find Opportunity**: Find an Opportunity by search criteria

### Triggers
- **New Cases**: Fires when a new case is created in Capsule CRM
- **New Opportunities**: Fires when a new opportunity is created
- **New Tasks**: Fires when a new task is created
- **New Projects**: Fires when a project is created

## API Reference

Capsule CRM API Documentation: https://developer.capsulecrm.com/v2