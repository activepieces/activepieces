import { Property } from "@activepieces/framework";
const authenticationMarkdown = `
[Click here](https://posthog.com/docs/api/overview#personal-api-keys-recommended) to learn how to obtain your Personal API key.
`;

export const posthogAuthentication = Property.SecretText({
    displayName: "Personal API Key",
    description: authenticationMarkdown,
    required: true
});