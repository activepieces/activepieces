import { useQuery } from "@tanstack/react-query"
import { sampleDataApi } from "./sample-data-api"

export const sampleDataHooks = {
   useSampleData: (sampleDataFileId: string | undefined) => {
    return useQuery({
        queryKey: ['sampleData', sampleDataFileId],
        queryFn: async () => {
            const file = await sampleDataApi.get(sampleDataFileId!)
            return file.data
        },
        enabled: !!sampleDataFileId,
    })
   }    
}