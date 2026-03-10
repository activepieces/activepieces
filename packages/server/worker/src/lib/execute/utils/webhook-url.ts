export function getWebhookUrl(publicApiUrl: string, flowId: string, simulate?: boolean): string {
    const suffix = simulate ? '/test' : ''
    return `${publicApiUrl}/api/v1/webhooks/${flowId}${suffix}`
}

export function getAppWebhookUrl(publicApiUrl: string, appName: string): string {
    return `${publicApiUrl}/api/v1/app-events/${appName}`
}
