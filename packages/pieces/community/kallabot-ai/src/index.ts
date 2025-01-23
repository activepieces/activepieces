import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { makeCall } from './lib/actions/make-call';
import { getCallDetails } from './lib/actions/get-call-details';

const authDescription = `
To obtain your API Key:

1. Go to kallabot.com and log in to your account
2. Click on your profile picture in the top right corner
3. Select "Settings" from the dropdown menu
4. Navigate to the "API & Integrations" tab
5. Copy the generated API key and paste it here

Note: Keep your API key secure and never share it publicly.
`;

export const kallabotAuth = PieceAuth.SecretText({
    description: authDescription,
    displayName: 'API Key',
    required: true,
    validate: async ({ auth }) => {
        // TODO: Add validation when API is available
        if (auth.length < 5) {
            return {
                valid: false,
                error: 'API Key is too short'
            }
        }
        return {
            valid: true
        }
    }
});

export const kallabotAi = createPiece({
    displayName: "Kallabot",
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://media-hosting.imagekit.io//60166f46183f4b2f/White%20(11).png?Expires=1832088361&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=rQyWySGVtRl7X8~-~~h~mCfxKbBqZmnQd-BDZzWWjRKDZjwXtzuKtBALGBuJHobl1Ihzz1oON3LL81ceeHvb~6m4ngakV0dzAtAkEuXNajnHZllqWy9jtrykTYp5Ui7Ziduk~QUfsm0~6aPnn8a72fcR-0lDHJEVD-KLWgEI1kBiMZDVcd0KdtBmpeSGlFva6gmGFZR8jWDt42Jcj342V8RoEJfDTg5Uqasxrv6K4z01fIGHwHpIZhJp9vRB24BfZczJZ4Y~vY8RPPzfBIk~xYA~V0oLou5A3e~divuCmNXp-DQbKyJwWzF5pZZHlbSLNdfcbyKPSUandJOOMurlyw__",
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ["Abdul Rahman"],
    auth: kallabotAuth,
    actions: [makeCall, getCallDetails],
    triggers: [],
    description: "AI-powered voice agents and conversational interfaces",
});
    