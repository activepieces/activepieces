import { FileId } from '@activepieces/shared'
import axios from 'axios'

export const fileService = {
    async getData({ id }: GetDataParams): Promise<Buffer> {
        const response = await axios.get<Buffer>(`https://cloud.activepieces.com/api/v1/files/${id}`)
        return response.data
    },
}

type GetDataParams = {
    id: FileId
}
