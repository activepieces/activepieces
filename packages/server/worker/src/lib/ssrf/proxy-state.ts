let proxyPort: number | null = null

export const egressProxyState = {
    setPort: (port: number | null): void => {
        proxyPort = port
    },
    getPort: (): number | null => proxyPort,
}
