import { createAction, Property } from "@activepieces/pieces-framework";
import { generateChallenge, signChallenge, submitChallenge } from "./helper";

export const generateDeveloperTokenAction = createAction({
    name: "generate-developer-token-auth-api",
    displayName: "Generate Developer Token via Auth API",
    description: "Obtains an developer token using client credentials and Web3 signature. Generate your API key from DIMO Developer Console",
    props: {
        clientId: Property.ShortText({ displayName: "Client ID", required: true }),
        domain: Property.ShortText({ displayName: "Domain", required: true }),
        apiKey: Property.ShortText({ displayName: "API Key", required: true }),
    },
    run: async (ctx) => {

        const { clientId, domain, apiKey } = ctx.propsValue;


        // generate challange

        const challangeResponse = await generateChallenge({clientId, domain});

        if(challangeResponse.status !==200)
        {
            throw new Error(`Failed to generate challenge`);
        }

        const { challenge, state } = challangeResponse.body;

        // sign challange with web3

        const signature = await signChallenge({apiKey, challenge});

        // submit challange

        const submitResponse = await submitChallenge({clientId, domain, state, signature});

        if(submitResponse.status !== 200)
        {
            throw new Error(`Failed to submit challenge`);
        }

        return submitResponse.body;
    }
});
