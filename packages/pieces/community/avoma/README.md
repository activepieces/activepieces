# Avoma Integration for Activepieces

This piece integrates Avoma's AI-powered meeting assistant with Activepieces workflows.

## Features

### Triggers
- **New Note**: Triggers when notes are generated for meetings
- **New Meeting Scheduled**: Triggers when meetings are booked via scheduling pages
- **Meeting Rescheduled**: Triggers when meetings are rescheduled
- **Meeting Cancelled**: Triggers when meetings are cancelled

### Actions
- **Create Call**: Creates a new call in Avoma
- **Get Meeting Recording**: Retrieves video and audio recordings
- **Get Meeting Transcription**: Gets meeting transcriptions

## Setup

1. Sign up for an Avoma Business plan trial at https://www.avoma.com/pricing
2. Get your API credentials from Settings → Integrations → API
3. Configure the piece with your API Token and Account ID

## Usage Examples

### Automatically save meeting notes to a database
```
Trigger: New Note
Action: Save to Database
```

### Send notifications for cancelled meetings
```
Trigger: Meeting Cancelled
Action: Send Email/Slack Message
```

### Archive meeting recordings
```
Trigger: New Meeting Scheduled (completed)
Action: Get Meeting Recording → Upload to Cloud Storage
```

## API Reference

This integration uses the Avoma API v1. For more details, see the [official documentation](https://dev694.avoma.com/).

## Support

For issues related to this integration, please open an issue on the Activepieces repository.