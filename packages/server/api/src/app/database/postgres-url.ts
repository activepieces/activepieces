export const postgresUrl = {
    dropSslModeParams({ url }: { url: string }): string {
        const parsed = new URL(url)
        SSL_MODE_PARAMS.forEach((param) => parsed.searchParams.delete(param))
        return parsed.toString()
    },
}

const SSL_MODE_PARAMS = ['ssl', 'sslmode', 'uselibpqcompat']
