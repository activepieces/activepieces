import { ExecutionState } from '@activepieces/shared'

type AddTagParams = {
    name: string
}

export const createTagsManager = (state: ExecutionState) => {
    return {
        add: async (params: AddTagParams): Promise<void> => {
            state.addTags([params.name])
        },
    }
}