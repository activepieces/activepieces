import { createTrigger, OAuth2PropertyValue, TriggerStrategy } from "@activepieces/pieces-framework";
import { AuthenticationType, DedupeStrategy, httpClient, HttpMethod, HttpRequest , Polling, pollingHelper } from "@activepieces/pieces-common";
import { calltidycalapi } from "../common";
import { tidyCalAuth } from "../../";
import dayjs from "dayjs";


export const tidycalbookingcancelled = createTrigger({
    auth: tidyCalAuth,
    name: 'booking_canceled',
    displayName: 'Booking Canceled',
    description: 'Triggers when a new booking is canceled',
    props: {
    },
    sampleData: {
      "created_at": "2023-01-29T13:57:17.000000Z",
      "created_by": "https://api.calendly.com/users/AAAAAAA",
      "event": "invitee.canceled",
      "payload": {
        "cancel_url": "https://calendly.com/cancellations/AAAAAAAA",
        "cancellation": {
          "canceler_type": "host",
          "canceled_by": "Ashraf Samhouri",
          "reason": "testing"
        },
        "created_at": "2023-01-29T13:56:46.894198Z",
        "email": "test@test.com",
        "event": "https://api.calendly.com/scheduled_events/AAAAAAAAA",
        "first_name": null,
        "last_name": null,
        "name": "abdul",
        "new_invitee": null,
        "no_show": null,
        "old_invitee": null,
        "payment": null,
        "questions_and_answers": [],
        "reconfirmation": null,
        "reschedule_url": "https://calendly.com/reschedulings/AAAAAAAA",
        "rescheduled": false,
        "routing_form_submission": null,
        "status": "canceled",
        "text_reminder_number": null,
        "timezone": "Asia/Baghdad",
        "tracking": {
          "utm_campaign": null,
          "utm_source": null,
          "utm_medium": null,
          "utm_content": null,
          "utm_term": null,
          "salesforce_uuid": null
        },
        "updated_at": "2023-01-29T13:57:17.466943Z",
        "uri": "https://api.calendly.com/scheduled_events/AAAAAAAAAAAaA/invitees/AAAAAAAA"

      }
    },
    type: TriggerStrategy.POLLING,
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
});

const polling: Polling<OAuth2PropertyValue, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const currentValues = await calltidycalapi<{
            cancelled_at: string
        }[]>(HttpMethod.GET, `bookings?cancelled=true`, auth.access_token, undefined);

        currentValues.body = currentValues.body.filter((item) => {
            const itemEpochMS = dayjs(item.cancelled_at).valueOf();
            return itemEpochMS > lastFetchEpochMS;
        });

        const items = currentValues.body.map((item) => ({
            epochMilliSeconds: dayjs(item.cancelled_at).valueOf(),
            data: item
        }));
        return items;
    }
};