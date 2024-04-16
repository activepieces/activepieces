import { FileId } from '@activepieces/shared'
import axios from 'axios'
import { system } from '../system/system'
import { SystemProp } from '../system/system-prop'

const API_URL = system.getOrThrow(SystemProp.WEBHOOK_URL)

const client = axios.create({
    baseURL: API_URL,
})

export const fileService = {
    async getData({ id }: GetDataParams): Promise<Buffer> {
        const response = await client.get<Buffer>(`v1/files/${id}`)
        return response.data
    },
}

type GetDataParams = {
    id: FileId
}
