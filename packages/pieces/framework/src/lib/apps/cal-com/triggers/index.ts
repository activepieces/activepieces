import { EventTrigger } from "../common";
import { registerWebhooks } from "./register-webhook";

export const triggers = [
  {type: EventTrigger.BOOKING_CANCELLED, displayName: "Booking Cancelled"},
  {type: EventTrigger.BOOKING_CREATED, displayName: "Booking Created"},
  {type: EventTrigger.BOOKING_RESCHEDULED, displayName: "Booking Rescheduled"}
].map(
  (eventTrigger) => registerWebhooks({
    name: eventTrigger.type,
    displayName: eventTrigger.displayName,
    description: `Create a webhook to monitor when ${eventTrigger.displayName}`
  })
)