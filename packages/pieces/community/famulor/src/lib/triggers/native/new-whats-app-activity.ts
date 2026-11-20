import { createPollingTrigger, type PollDefinition } from '../../common/polling';

const newWhatsAppActivityDefinition: PollDefinition = {
  "name": "newWhatsAppActivity",
  "displayName": "New WhatsApp Activity",
  "description": "Triggers when a WhatsApp conversation has new activity.",
  "path": "/history",
  "timeField": "last_activity_at",
  "query": {
    "type": "whatsapp"
  }
};
const newWhatsAppActivity = createPollingTrigger(newWhatsAppActivityDefinition);

export { newWhatsAppActivity, newWhatsAppActivityDefinition };
