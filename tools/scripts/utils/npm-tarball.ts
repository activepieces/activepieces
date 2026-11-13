const POLL_INTERVAL_MS = 10_000
const MAX_ATTEMPTS = 60

const waitUntilDownloadable = async ({ name, version }: { name: string, version: string }): Promise<boolean> => {
    const tarballUrl = `https://registry.npmjs.org/${name}/-/${name.split('/').pop()}-${version}.tgz`
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const response = await fetch(tarballUrl, { method: 'HEAD', signal: AbortSignal.timeout(POLL_INTERVAL_MS) }).catch(() => null)
        if (response?.ok) {
            return true
        }
        console.info(`[npmTarball] not downloadable yet, url=${tarballUrl} status=${response?.status} attempt=${attempt}/${MAX_ATTEMPTS}`)
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
    return false
}

export const npmTarball = { waitUntilDownloadable }
