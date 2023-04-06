import { activeCampaignRegisterTrigger } from './register'
import { sampleData } from './sample-data'

export const activeCampaignTriggers = [
  {
    event: 'forward', 
    description: "Campaign forwarded", 
    displayName: "Campaign forwarded", 
    active: false,
    sampleData: sampleData?.['forward'] ?? {} 
  },
  {
    event: 'open', 
    description: "Campaign opened", 
    displayName: "Campaign opened", 
    active: true,
    sampleData: sampleData?.['open'] ?? {} 
  },
  {
    event: 'share', 
    description: "Campaign shared", 
    displayName: "Campaign shared", 
    active: false,
    sampleData: sampleData?.['share'] ?? {} 
  },
  {
    event: 'sent', 
    description: "Campaign starts sending", 
    displayName: "Campaign starts sending", 
    active: true,
    sampleData: sampleData?.['sent'] ?? {} 
  },
  {
    event: 'subscribe', 
    description: "Contact added", 
    displayName: "Contact added", 
    active: true,
    sampleData: sampleData?.['subscribe'] ?? {} 
  },
  {
    event: 'subscriber_note', 
    description: "Contact note added", 
    displayName: "Contact note added", 
    active: false,
    sampleData: sampleData?.['subscriber_note'] ?? {} 
  },
  {
    event: 'contact_tag_added', 
    description: "Contact tag added", 
    displayName: "Contact tag added", 
    active: true,
    sampleData: sampleData?.['contact_tag_added'] ?? {} 
  },
  {
    event: 'contact_tag_removed', 
    description: "Contact tag removed", 
    displayName: "Contact tag removed", 
    active: false,
    sampleData: sampleData?.['contact_tag_removed'] ?? {} 
  },
  {
    event: 'unsubscribe', 
    description: "Contact unsubscription", 
    displayName: "Contact unsubscription", 
    active: true,
    sampleData: sampleData?.['unsubscribe'] ?? {} 
  },
  {
    event: 'update', 
    description: "Contact updated", 
    displayName: "Contact updated", 
    active: false,
    sampleData: sampleData?.['update'] ?? {} 
  },
  {
    event: 'deal_add', 
    description: "Deal added", 
    displayName: "Deal added", 
    active: true,
    sampleData: sampleData?.['deal_add'] ?? {} 
  },
  {
    event: 'deal_note_add', 
    description: "Deal note added", 
    displayName: "Deal note added", 
    active: false,
    sampleData: sampleData?.['deal_note_add'] ?? {} 
  },
  {
    event: 'deal_pipeline_add', 
    description: "Deal pipeline added", 
    displayName: "Deal pipeline added", 
    active: true,
    sampleData: sampleData?.['deal_pipeline_add'] ?? {} 
  },
  {
    event: 'deal_stage_add', 
    description: "Deal stage added", 
    displayName: "Deal stage added", 
    active: true,
    sampleData: sampleData?.['deal_stage_add'] ?? {} 
  },
  {
    event: 'deal_task_add', 
    description: "Deal task added", 
    displayName: "Deal task added", 
    active: true,
    sampleData: sampleData?.['deal_task_add'] ?? {} 
  },
  {
    event: 'deal_task_complete', 
    description: "Deal task completed", 
    displayName: "Deal task completed", 
    active: false,
    sampleData: sampleData?.['deal_task_complete'] ?? {} 
  },
  {
    event: 'deal_tasktype_add', 
    description: "Deal task type added", 
    displayName: "Deal task type added", 
    active: false,
    sampleData: sampleData?.['deal_tasktype_add'] ?? {} 
  },
  {
    event: 'deal_update', 
    description: "Deal updated", 
    displayName: "Deal updated", 
    active: false,
    sampleData: sampleData?.['deal_update'] ?? {} 
  },
  {
    event: 'bounce', 
    description: "Email bounces", 
    displayName: "Email bounces", 
    active: true,
    sampleData: sampleData?.['bounce'] ?? {} 
  },
  {
    event: 'reply', 
    description: "Email replies", 
    displayName: "Email replies", 
    active: true,
    sampleData: sampleData?.['reply'] ?? {} 
  },
  {
    event: 'click', 
    description: "Link clicked", 
    displayName: "Link clicked", 
    active: true,
    sampleData: sampleData?.['click'] ?? {} 
  },
  {
    event: 'list_add', 
    description: "List added", 
    displayName: "List added", 
    active: false,
    sampleData: sampleData?.['list_add'] ?? {} 
  },
  {
    event: 'sms_reply', 
    description: "SMS reply", 
    displayName: "SMS reply", 
    active: false,
    sampleData: sampleData?.['sms_reply'] ?? {} 
  },
  {
    event: 'sms_sent', 
    description: "SMS sent", 
    displayName: "SMS sent", 
    active: false,
    sampleData: sampleData?.['sms_sent'] ?? {} 
  },
  {
    event: 'sms_unsub', 
    description: "SMS unsubscribe", 
    displayName: "SMS unsubscribe", 
    active: false,
    sampleData: sampleData?.['sms_unsub'] ?? {} 
  }
]
.filter(trigger => trigger.active)
.map(trigger => activeCampaignRegisterTrigger(trigger))