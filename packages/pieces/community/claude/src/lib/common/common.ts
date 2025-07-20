export const baseUrl = 'https://api.anthropic.com/v1';

export const billingIssueMessage = `Error Occurred: 429 \n

1. Ensure that you have enough tokens on your Anthropic platform. \n
2. Generate a new API key. \n
3. Attempt the process again. \n

For guidance, visit: https://console.anthropic.com/settings/plans`;

export const unauthorizedMessage = `Error Occurred: 401 \n

Ensure that your API key is valid. \n
`;
