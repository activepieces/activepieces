# Mailchimp Piece for Activepieces

This piece integrates with Mailchimp's Marketing API to provide comprehensive email marketing automation capabilities.

## Overview

Mailchimp is an email marketing platform for managing audiences, sending campaigns, tracking engagement, and automating lifecycle communications. This piece lets you trigger on campaign and audience events, manage subscribers/tags/campaigns, and look up customers or campaigns to power end-to-end marketing automations.

## Authentication

The piece uses OAuth2 authentication with Mailchimp. You'll need to:
1. Create a Mailchimp developer account
2. Set up an OAuth2 application
3. Configure the redirect URI in your Activepieces instance

## Triggers

### 1. Member Subscribed to Audience
- **Name**: `subscribe`
- **Description**: Runs when an Audience subscriber is added
- **Properties**: 
  - `list_id`: The audience/list to monitor

### 2. Member Unsubscribed from Audience
- **Name**: `unsubscribe`
- **Description**: Runs when an Audience subscriber is removed
- **Properties**: 
  - `list_id`: The audience/list to monitor

### 3. New Campaign
- **Name**: `new_campaign`
- **Description**: Fires when a new campaign is created or sent
- **Properties**: 
  - `list_id`: The audience/list to monitor

### 4. Link Clicked
- **Name**: `link_clicked`
- **Description**: Fires when a recipient clicks a specified link in a campaign
- **Properties**: 
  - `list_id`: The audience/list to monitor

### 5. Email Opened
- **Name**: `email_opened`
- **Description**: Fires when a recipient opens an email in a specific campaign
- **Properties**: 
  - `list_id`: The audience/list to monitor

### 6. New or Updated Subscriber
- **Name**: `subscriber_updated`
- **Description**: Fires when a subscriber is added or updated
- **Properties**: 
  - `list_id`: The audience/list to monitor

## Actions

### Write Actions

#### 1. Add Member to an Audience (List)
- **Name**: `add_member_to_list`
- **Description**: Add a member to an existing Mailchimp audience (list)
- **Properties**:
  - `first_name`: First name of the new contact
  - `last_name`: Last name of the new contact
  - `email`: Email of the new contact (required)
  - `list_id`: Audience to add the contact to (required)
  - `status`: Subscription status (subscribed, unsubscribed, cleaned, pending, transactional)

#### 2. Create Campaign
- **Name**: `create_campaign`
- **Description**: Create a new Mailchimp campaign
- **Properties**:
  - `list_id`: Audience to send the campaign to (required)
  - `campaign_title`: The title of the campaign (required)
  - `campaign_subject`: The subject line of the campaign (required)
  - `from_name`: The name that will appear in the "From" field (required)
  - `from_email`: The email address that will appear in the "From" field (required)
  - `reply_to`: The email address that will receive replies
  - `campaign_type`: Type of campaign (regular, plaintext, absplit, rss, variate)
  - `content_type`: Type of content (template, html, url)
  - `template_id`: ID of the template to use (if content_type is template)
  - `html_content`: HTML content of the campaign (if content_type is html)
  - `url`: URL to use for the campaign (if content_type is url)

#### 3. Get Campaign Report
- **Name**: `get_campaign_report`
- **Description**: Get report details of a sent campaign
- **Properties**:
  - `campaign_id`: The ID of the campaign to get the report for (required)
  - `include_fields`: Fields to include in the response
  - `exclude_fields`: Fields to exclude from the response

#### 4. Create Audience
- **Name**: `create_audience`
- **Description**: Creates a new Mailchimp audience (list)
- **Properties**:
  - `audience_name`: The name of the audience to create (required)
  - `audience_description`: A description of the audience
  - `from_name`: The name that will appear in the "From" field of emails (required)
  - `from_email`: The email address that will appear in the "From" field (required)
  - `reply_to`: The email address that will receive replies
  - `subject_line`: The subject line for emails sent to this audience
  - `language`: The language of the audience (en, es, fr, de, it, pt, nl, ru, ja, zh)
  - `notify_on_subscribe`: Email address to notify when someone subscribes
  - `notify_on_unsubscribe`: Email address to notify when someone unsubscribes
  - `double_optin`: Whether to use double opt-in for new subscribers
  - `marketing_permissions`: Whether to include marketing permissions in emails

#### 5. Add or Update Subscriber
- **Name**: `add_member_to_list` (existing action)
- **Description**: Adds a new subscriber to an audience or updates existing subscriber

#### 6. Archive Subscriber
- **Name**: `archive_subscriber`
- **Description**: Archive an existing audience member
- **Properties**:
  - `list_id`: The audience/list containing the subscriber (required)
  - `email`: Email of the subscriber to archive (required)

#### 7. Unsubscribe Email
- **Name**: `unsubscribe_email`
- **Description**: Unsubscribe an email address from an audience
- **Properties**:
  - `list_id`: The audience/list containing the subscriber (required)
  - `email`: Email of the subscriber to unsubscribe (required)
  - `send_goodbye`: Whether to send a goodbye email to the subscriber
  - `send_notify`: Whether to send a notification email to the list owner

### Search Actions

#### 1. Find Campaign
- **Name**: `find_campaign`
- **Description**: Finds an existing campaign by ID or search criteria
- **Properties**:
  - `search_type`: How to search for the campaign (id, title, subject)
  - `campaign_id`: The ID of the campaign to find (if search_type is "id")
  - `search_query`: The title or subject to search for (if search_type is "title" or "subject")
  - `include_fields`: Fields to include in the response
  - `exclude_fields`: Fields to exclude from the response

#### 2. Find Customer
- **Name**: `find_customer`
- **Description**: Finds a customer by email address
- **Properties**:
  - `email`: Email address of the customer to find (required)
  - `include_fields`: Fields to include in the response
  - `exclude_fields`: Fields to exclude from the response

#### 3. Find Tag
- **Name**: `find_tag`
- **Description**: Finds a tag by name or ID
- **Properties**:
  - `list_id`: The audience/list to search in (required)
  - `search_type`: How to search for the tag (name, id)
  - `tag_name`: The name of the tag to search for (if search_type is "name")
  - `tag_id`: The ID of the tag to search for (if search_type is "id")

#### 4. Find Subscriber
- **Name**: `find_subscriber`
- **Description**: Finds an existing subscriber by email address
- **Properties**:
  - `list_id`: The audience/list to search in (required)
  - `email`: Email address of the subscriber to find (required)
  - `include_fields`: Fields to include in the response
  - `exclude_fields`: Fields to exclude from the response

### Additional Actions

#### 1. Add Subscriber to a Tag
- **Name**: `add_subscriber_to_tag`
- **Description**: Adds a subscriber to a tag
- **Properties**:
  - `list_id`: The audience/list containing the subscriber (required)
  - `email`: Email of the subscriber (required)
  - `tag_names`: Array of tag names to add to the subscriber (required)

#### 2. Remove Subscriber from Tag
- **Name**: `remove_subscriber_from_tag`
- **Description**: Removes a subscriber from a tag

#### 3. Add Note to Subscriber
- **Name**: `add_note_to_subscriber`
- **Description**: Add a note to a subscriber

#### 4. Update Subscriber Status
- **Name**: `update_subscriber_status`
- **Description**: Update the status of a subscriber in a list

## Webhook Events

The piece supports the following webhook events:
- `subscribe`: When a subscriber is added
- `unsubscribe`: When a subscriber is removed
- `profile`: When a subscriber's profile is updated
- `cleaned`: When a subscriber's email is cleaned
- `upemail`: When a subscriber's email is changed
- `campaign`: When a campaign is sent or cancelled
- `pending`: When a subscriber's email is pending
- `transactional`: For transactional emails
- `click`: When a subscriber clicks a link
- `open`: When a subscriber opens an email

## Usage Examples

### Creating a Welcome Campaign
1. Use the "Create Campaign" action to set up a new campaign
2. Configure the campaign settings (title, subject, content)
3. Use the "New Campaign" trigger to automate follow-up actions

### Subscriber Onboarding
1. Use the "Member Subscribed to Audience" trigger
2. Follow up with the "Add Subscriber to Tag" action to categorize the subscriber
3. Use the "Create Campaign" action to send a welcome series

### Engagement Tracking
1. Use the "Email Opened" trigger to detect engagement
2. Follow up with the "Add Subscriber to Tag" action to mark as engaged
3. Use the "Link Clicked" trigger to track specific link interactions

## Error Handling

All actions include comprehensive error handling and will throw descriptive error messages when operations fail. Common error scenarios include:
- Invalid email addresses
- Non-existent audiences or campaigns
- API rate limiting
- Authentication failures

## Rate Limits

Be aware of Mailchimp's API rate limits:
- 10 requests per second for most endpoints
- 1000 requests per hour for batch operations
- Webhook delivery may be delayed during high traffic periods

## Support

For issues or questions about this piece, please refer to:
- [Mailchimp Marketing API Documentation](https://mailchimp.com/developer/marketing/api/)
- [Activepieces Documentation](https://www.activepieces.com/docs)
- [Activepieces Community](https://community.activepieces.com/)
