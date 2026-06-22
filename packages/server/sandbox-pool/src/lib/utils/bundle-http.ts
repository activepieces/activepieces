import axios from 'axios'

// Plain axios on purpose (not safeHttp): these URLs are S3 pre-signed links generated
// by our own app from admin-configured object storage — zero user influence, same trust
// level as the AWS SDK S3 client the app already uses unfiltered. Routing them through
// the SSRF filter would needlessly break self-hosted S3/MinIO on private networks.
export const bundleHttp = {
    async getBuffer(url: string): Promise<Buffer> {
        const response = await axios.get<ArrayBuffer>(url, {
            responseType: 'arraybuffer',
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        })
        return Buffer.from(response.data)
    },

    async put(url: string, data: Buffer): Promise<void> {
        await axios.put(url, data, {
            headers: { 'Content-Length': data.length },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        })
    },
}
