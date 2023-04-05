import { eventbriteRegisterTrigger } from "./register"

const triggerData = [
  {
    name: 'attendee_checked_in',
    displayName: 'attendee.checked_in',
    event: 'attendee.checked_in',
    description: 'Triggered when an attendee\'s barcode is scanned in.',
    sampleData: {}
  },
  {
    name: 'attendee_checked_out',
    displayName: 'attendee.checked_out',
    event: 'attendee.checked_out',
    description: 'Triggered when an attendee\'s barcode is scanned out.',
    sampleData: {}
  },
  {
    name: 'event_created',
    displayName: 'event.created',
    event: 'event.created',
    description: 'Triggered when an event is initially created.',
    sampleData: {}
  },
  {
    name: 'event_published',
    displayName: 'event.published',
    event: 'event.published',
    description: 'Triggered when an event is published and made live.',
    sampleData: {}
  },
  {
    name: 'event_updated',
    displayName: 'event.updated',
    event: 'event.updated',
    description: 'Triggered when event data is updated.',
    sampleData: {}
  },
  {
    name: 'order_placed',
    displayName: 'order.placed',
    event: 'order.placed',
    description: 'Triggers when an order is placed for an event.',
    sampleData: {}
  },
  {
    name: 'order_updated',
    displayName: 'order.updated',
    event: 'order.updated',
    description: 'Triggers when order data is updated for an event.',
    sampleData: {}
  },
  {
    name: 'ticket_class_created',
    displayName: 'ticket_class.created',
    event: 'ticket_class.created',
    description: 'Triggers when a ticket class is created.',
    sampleData: {}
  },
  {
    name: 'venue_update',
    displayName: 'venue.update',
    event: 'venue.updated',
    description: 'Triggers when venue data is updated.',
    sampleData: {}
  }
]

export const eventbriteTriggers = triggerData.map((trigger) => eventbriteRegisterTrigger(trigger))