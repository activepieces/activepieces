# WhatsScale

WhatsApp automation for Activepieces — send messages, manage contacts, and automate workflows through WhatsApp.

## Authentication

WhatsScale uses API key authentication. Get your key from [whatsscale.com/dashboard](https://whatsscale.com/dashboard).

## Actions

### Send Text
| Action | Description |
|--------|-------------|
| Send a Message (Manual Entry) | Send text by entering phone number or group ID manually |
| Send a Message to a Contact | Send text to a WhatsApp contact (dropdown) |
| Send a Message to a Group | Send text to a WhatsApp group (dropdown) |
| Send a Text to a Channel | Broadcast text to a WhatsApp Channel (dropdown) |
| Send a Message to a CRM Contact | Send text to a WhatsScale CRM contact (dropdown) |

### Send Image
| Action | Description |
|--------|-------------|
| Send an Image to a Contact | Send image to a WhatsApp contact (dropdown) |
| Send an Image to a Group | Send image to a WhatsApp group (dropdown) |
| Send an Image to a Channel | Broadcast image to a WhatsApp Channel (dropdown) |
| Send an Image to a CRM Contact | Send image to a WhatsScale CRM contact (dropdown) |
| Send an Image (Manual Entry) | Send image by entering phone number or group ID manually |

### Send Video
| Action | Description |
|--------|-------------|
| Send a Video to a Contact | Send video to a WhatsApp contact (dropdown) |
| Send a Video to a Group | Send video to a WhatsApp group (dropdown) |
| Send a Video to a Channel | Broadcast video to a WhatsApp Channel (dropdown) |
| Send a Video to a CRM Contact | Send video to a WhatsScale CRM contact (dropdown) |
| Send a Video (Manual Entry) | Send video by entering phone number or group ID manually |

### Send Document
| Action | Description |
|--------|-------------|
| Send a Document to a Contact | Send document (PDF, DOCX, XLSX, etc.) to a contact (dropdown) |
| Send a Document to a Group | Send document to a WhatsApp group (dropdown) |
| Send a Document to a CRM Contact | Send document to a WhatsScale CRM contact (dropdown) |

### Send Location
| Action | Description |
|--------|-------------|
| Send a Location to a Contact | Send a GPS location pin to a WhatsApp contact (dropdown) |
| Send a Location to a Group | Send a GPS location pin to a WhatsApp group (dropdown) |
| Send a Location to a CRM Contact | Send a GPS location pin to a WhatsScale CRM contact (dropdown) |

### Send Poll
| Action | Description |
|--------|-------------|
| Send a Poll to a Contact | Send a poll with options to a WhatsApp contact (dropdown) |
| Send a Poll to a Group | Send a poll with options to a WhatsApp group (dropdown) |
| Send a Poll to a Channel | Broadcast a poll to a WhatsApp Channel (dropdown) |
| Send a Poll to a CRM Contact | Send a poll to a WhatsScale CRM contact (dropdown) |

### Set Story
| Action | Description |
|--------|-------------|
| Set a Text Story | Post a text status update to your WhatsApp story with optional background color |
| Set an Image Story | Post an image to your WhatsApp story with optional caption |
| Set a Video Story | Post a video to your WhatsApp story with optional caption |

### CRM Contacts
| Action | Description |
|--------|-------------|
| Create a CRM Contact | Create a new contact with phone, name, and tags |
| Get a CRM Contact | Retrieve a contact by ID (dropdown) |
| Find a CRM Contact by Phone | Look up a contact by phone number (with country code) |
| Update a CRM Contact | Update name and/or tags of an existing contact |
| Delete a CRM Contact | Permanently delete a contact |
| Add a Tag to a CRM Contact | Add a single tag to a contact |
| Remove a Tag from a CRM Contact | Remove a single tag from a contact |
| List CRM Contacts | Retrieve contacts with optional tag filter and pagination |

### Planned (Sprints 8-10)
- Check WhatsApp Number
- Make an API Call
- Triggers: Watch Incoming Messages, Group Messages, Channel Messages

## Architecture

```
Activepieces Flow
       │
       ▼
proxy.whatsscale.com
       │
   ┌───┴───┐
   ▼       ▼
 WAHA    Supabase
(WhatsApp) (CRM)
```

All actions communicate through the WhatsScale proxy, which handles authentication, file preparation, and async job polling.

## Media URL Support

All image, video, and document actions support:
- Direct URLs (JPEG, PNG, MP4, PDF, DOCX, etc.)
- Google Drive share links
- Dropbox share links
- Any publicly accessible URL

## Links

- Website: [whatsscale.com](https://whatsscale.com)
- API Docs: [whatsscale.com/api-docs](https://whatsscale.com/api-docs)
