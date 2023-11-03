# Notes

## Untested pieces

Not all webhook trigger event types (https://developers.convertkit.com/#webhooks) have been tested. The ConvertKit team discourages to trigger certain events such as bounces and complaints, even for pure testing purposes.

For that reason the following webhook event types have not been tested by me:

- subscriber.subscriber_bounce
- subscriber.subscriber_complain

If you run into problems with these events, please create an issue and tag/message me (gunther@mailcraft.co).

## No debounce in form fields

I have not implmented a debounce in any form fields. This means that that calls to the ConvertKit API will be triggered on every keystroke for certain fields. This is not ideal, but I have not found a way to implement this in a way that works with the current implementation of the form fields in Activepieces.

# Building

Run `nx build pieces-convertkit` to build the library.

# ToDo

- Versioning of piece https://www.activepieces.com/docs/developers/piece-reference/piece-versioning
- Implement retry logic on fetch
- Make sure the proper refreshers are set on the pieces
- Default values for Date fields
- Add tests
