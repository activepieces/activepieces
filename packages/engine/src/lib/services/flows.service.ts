import { PopulatedFlow, SeekPage } from '@activepieces/shared'

export async function getAllEnabledPopulatedFlows(internalApiUrl: string, engineToken: string, projectId: string): Promise<SeekPage<PopulatedFlow>> {
    const response = await fetch(`${internalApiUrl}v1/engine/populated-flows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
        },
        body: JSON.stringify({
            projectId,
        }),
    })
    return response.json()
}

