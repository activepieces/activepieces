import { registerWebhook } from "./register-webhook";

export const newSubscriber = registerWebhook({
    name: 'new_subscriber',
    description: 'Triggered when a new subscriber is added to a form',
    displayName: 'New Subscriber',
    event: 'subscriber.subscriber_activate',
    sampleData: {}
})