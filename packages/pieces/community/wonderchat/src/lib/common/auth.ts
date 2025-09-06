import { PieceAuth, Property } from "@activepieces/pieces-framework";

const markdown = `
To get your API Key, follow these steps:

1. Log in to your **WonderChat dashboard**.
2. Navigate to the **API** section in the settings.
3. Copy your API Key.
`;


export const wonderchatAuth = PieceAuth.CustomAuth({
    description: markdown,
    required: true,
    props: {
        apiKey: PieceAuth.SecretText({
            displayName: 'API Key',
            description: 'Your WonderChat API Key.',
            required: true,
        }),
    },
});
