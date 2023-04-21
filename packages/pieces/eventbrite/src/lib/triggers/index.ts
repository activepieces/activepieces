import { eventbriteRegisterTrigger } from "./register"
import { props } from "../../common"

const triggerData = [
  {
    name: 'attendee_checked_in',
    displayName: 'Attendee Registered',
    event: 'attendee.checked_in',
    description: 'Triggered when an attendee\'s barcode is scanned in.',
    props: {
      event_id: props.event_id
    }
  },
  {
    name: 'event_created',
    displayName: 'New Event',
    event: 'event.created',
    description: 'Triggered when an event is initially created.',
  },
  {
    name: 'order_placed',
    displayName: 'New Order',
    event: 'order.placed',
    description: 'Triggers when an order is placed for an event.',
    props: {
      event_id: props.event_id
    }
  }
]

export const eventbriteTriggers = triggerData.map((trigger) => eventbriteRegisterTrigger(trigger))