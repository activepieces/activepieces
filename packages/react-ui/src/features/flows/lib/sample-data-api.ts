import { api } from "@/lib/api"
import { File, SaveSampleDataRequest } from "@activepieces/shared"

export const sampleDataApi = {
    save(request: SaveSampleDataRequest) {
        return api.post<File>(`/v1/sample-data`, request)
    },
    get(id: string) {
        return api.get<File>(`/v1/sample-data/${id}`)
    }
}