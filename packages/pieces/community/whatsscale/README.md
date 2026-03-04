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

### Planned (Sprints 4-9)
- Send Video/Document to Contact, Group, Channel, CRM Contact
- Send Location, Poll
- Set Text/Image/Video Story
- CRM: Create, Get, Find, Update, Delete Contact, Add/Remove Tag, List
- Check WhatsApp Number
- Make an API Call

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

## Links

- Website: [whatsscale.com](https://whatsscale.com)
- API Docs: [whatsscale.com/api-docs](https://whatsscale.com/api-docs)
