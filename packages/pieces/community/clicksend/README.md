# ClickSend

ClickSend is a cloud-based messaging platform for sending SMS, MMS, voice, email, and more. This integration allows automation builders and AI agents to send messages, manage contacts, and monitor communication status across workflows.

## Authentication

To use this piece, you'll need:
- **Username**: Your ClickSend username
- **API Key**: Your ClickSend API key

You can get these credentials by signing up for a free account at [ClickSend](https://www.clicksend.com/).

## Actions

### Send SMS
Send one or more SMS messages to customers, leads, or internal users.

**Properties:**
- `to` (required): The phone number to send the message to (with country code)
- `body` (required): The body of the message to send
- `from` (required): The sender name or number (must be approved in ClickSend)
- `schedule` (optional): Schedule the message to be sent at a specific timestamp (Unix timestamp)

### Send MMS
Send event posters or product images via MMS.

**Properties:**
- `to` (required): The phone number to send the message to (with country code)
- `body` (required): The body of the message to send
- `from` (required): The sender name or number (must be approved in ClickSend)
- `media_url` (required): The URL of the media file to send (image, video, etc.)
- `schedule` (optional): Schedule the message to be sent at a specific timestamp (Unix timestamp)

### Create Contact
Capture webinar registrations into SMS lists.

**Properties:**
- `contact_list_id` (required): The ID of the contact list
- `phone_number` (required): The phone number of the contact
- `email` (optional): The email address of the contact
- `first_name` (optional): The first name of the contact
- `last_name` (optional): The last name of the contact
- `company_name` (optional): The company name of the contact
- `address_line_1` (optional): The first line of the address
- `address_line_2` (optional): The second line of the address
- `city` (optional): The city of the contact
- `state` (optional): The state/province of the contact
- `postal_code` (optional): The postal code of the contact
- `country` (optional): The country of the contact

### Update Contact
Keep contact details current after CRM sync.

**Properties:**
- `contact_id` (required): The ID of the contact to update
- `phone_number` (optional): The phone number of the contact
- `email` (optional): The email address of the contact
- `first_name` (optional): The first name of the contact
- `last_name` (optional): The last name of the contact
- `company_name` (optional): The company name of the contact
- `address_line_1` (optional): The first line of the address
- `address_line_2` (optional): The second line of the address
- `city` (optional): The city of the contact
- `state` (optional): The state/province of the contact
- `postal_code` (optional): The postal code of the contact
- `country` (optional): The country of the contact

### Delete Contact
Opt-out contacts automatically when unsubscribed.

**Properties:**
- `contact_id` (required): The ID of the contact to delete

### Create Contact List
Set up segmented marketing lists automatically.

**Properties:**
- `list_name` (required): The name of the contact list

### Search Contact by Email Address
Retrieves a contact in a list by email.

**Properties:**
- `contact_list_id` (required): The ID of the contact list
- `email` (required): The email address to search for

### Search Contact by Phone
Retrieves a contact in a list by phone number.

**Properties:**
- `contact_list_id` (required): The ID of the contact list
- `phone_number` (required): The phone number to search for

### Search Contact Lists
Check if a marketing list exists before adding contacts.

**Properties:**
- None (returns all contact lists)

## API Reference

For more detailed information about the ClickSend API, visit the [Official ClickSend API Documentation](https://developers.clicksend.com/docs/rest/v3/).

## Test Account Access

Sign up for a free account at [ClickSend Signup](https://www.clicksend.com/) to get your API credentials and start testing the integration.

## Use Cases

- **Customer Support**: Automatically send SMS notifications when support tickets are created
- **Lead Management**: Capture leads from forms and add them to SMS marketing lists
- **Event Marketing**: Send event reminders and updates via SMS/MMS
- **Order Notifications**: Keep customers informed about order status and delivery updates
- **Appointment Reminders**: Send automated appointment confirmations and reminders
- **Marketing Campaigns**: Manage segmented contact lists for targeted marketing campaigns

## Triggers

### New Incoming SMS
Triggers when a new SMS message is received. This trigger uses polling to check for new incoming messages and will fire whenever a new SMS is received.

**Properties:**
- None (automatically monitors all incoming SMS messages)

**Sample Data:**
```json
{
  "message_id": "12345678",
  "status": "RECEIVED",
  "message_timestamp": 1644321600,
  "message_time": "2022-02-08 01:00:00",
  "message_to": "+1234567890",
  "message_from": "+0987654321",
  "message_body": "Hello from ClickSend!",
  "message_direction": "in",
  "message_type": "sms",
  "message_parts": 1,
  "message_cost": "0.0250",
  "country": "US",
  "carrier": "Verizon",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com"
}
``` 