import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { extractAction } from './lib/actions/extract'
import { searchAction } from './lib/actions/search'

const markdownDescription = `
Follow these steps to obtain your Tavily API Key:

1. Visit [tavily](https://tavily.com/) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the dashboard.
`

export const tavilyAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.tavily.com/search',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          api_key: auth,
          query: 'test',
          search_depth: 'basic',
        },
      })
      return {
        valid: true,
      }
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      }
    }
  },
})

export const tavily = createPiece({
  displayName: 'Tavily',
  description: 'Search engine tailored for AI agents.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/tavily.jpg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['OsamaHaikal'],
  auth: tavilyAuth,
  actions: [searchAction, extractAction],
  triggers: [],
})
