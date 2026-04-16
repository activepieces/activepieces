import { HttpMethod } from '@activepieces/pieces-common'
import { createAction } from '@activepieces/pieces-framework'
import { githubAuth } from '../auth'
import { githubApiCall, githubCommon } from '../common'

export const githubDeleteBranchAction = createAction({
    auth: githubAuth,
    name: 'delete_branch',
    displayName: 'Delete Branch',
    description: 'Deletes a branch from a repository.',
    props: {
        repository: githubCommon.repositoryDropdown,
        branch: githubCommon.branchDropdown('Branch', '', true),
    },
    async run({ auth, propsValue }) {
        const { owner, repo } = propsValue.repository!
        const branchName = propsValue.branch

        const response = await githubApiCall({
            accessToken: auth.access_token,
            method: HttpMethod.DELETE,

            resourceUri: `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
        })

        return response
    },
})
