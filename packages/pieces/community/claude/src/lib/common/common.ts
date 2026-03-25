export const baseUrl = 'https://api.anthropic.com/v1';

export const billingIssueMessage = `Error Occurred: 429 \n

1. Ensure that you have enough tokens on your Anthropic platform. \n
2. Generate a new API key. \n
3. Attempt the process again. \n

For guidance, visit: https://console.anthropic.com/settings/plans`;

export const unauthorizedMessage = `Error Occurred: 401 \n

Ensure that your API key is valid. \n
`;


export const modelOptions = [
    {value:'claude-opus-4-5-20251101',label:'Claude 4.5 Opus'},
    { value: 'claude-sonnet-4-5-20250929', label: 'Claude 4.5 Sonnet' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude 4.5 Haiku' },
    { value: 'claude-opus-4-1-20250805', label: 'Claude 4.1 Opus' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude 4 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
]