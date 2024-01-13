import { createAction, Property } from "@activepieces/pieces-framework";

export const generateTwiml = createAction({
    name: 'generate-twiml',
    description: 'Generate Twiml Message',
    displayName: 'Turns your message to Twiml',
    props: {
        message: Property.ShortText({
            description: 'The message',
            displayName: 'Message',
            required: true,
        })
    },
    async run(context) {
          // Generate TwiML
          const { message } = context.propsValue;
    const twimlResponse = `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Say voice="woman">${message}</Say>
        <Gather numDigits="1" action="https://your-response-handler-url.com">
            <Say voice="woman">Press 1 to confirm, or press 2 to modify.</Say>
        </Gather>
        <Pause length="2"/>
        <Say voice="woman">${message}</Say>
        <Gather numDigits="1" action="https://your-response-handler-url.com">
            <Say voice="woman">Press 1 to confirm, or press 2 to modify.</Say>
        </Gather>
        <Say voice="woman">We did not receive any input. Goodbye!</Say>
        <Hangup/>
    </Response>`;

// Return TwiML response
return twimlResponse;
    }
});
