# WhatsScale

WhatsApp automation for Activepieces — send messages, manage contacts, and automate workflows through WhatsApp.

## Authentication

WhatsScale uses API key authentication. Get your key from [whatsscale.com/dashboard](https://whatsscale.com/dashboard).

## Actions

### Sprint 1 (Current)
| Action | Description |
|--------|-------------|
| Send a Message (Manual Entry) | Send text by entering phone number or group ID |

### Planned (Sprints 2-9)
- Send Text/Image/Video/Document to Contact, Group, Channel, CRM Contact
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
