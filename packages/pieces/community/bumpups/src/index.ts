import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { generateCreatorDescription } from './lib/actions/generate-creator-description'
import { generateCreatorHashtags } from './lib/actions/generate-creator-hashtags'
import { generateCreatorTakeaways } from './lib/actions/generate-creator-takeaways'
import { generateCreatorTitles } from './lib/actions/generate-creator-titles'
import { generateTimestamps } from './lib/actions/generate-timestamps'
import { sendChat } from './lib/actions/send-chat'
import { BumpupsAuth } from './lib/common/auth'
import { BASE_URL } from './lib/common/client'

export const bumpups = createPiece({
    displayName: 'Bumpups',
    auth: BumpupsAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/bumpups.png',
    authors: ['Niket2035', 'sanket-a11y'],
    actions: [
        generateCreatorDescription,
        generateCreatorHashtags,
        generateCreatorTakeaways,
        generateCreatorTitles,
        generateTimestamps,
        sendChat,
        createCustomApiCallAction({
            auth: BumpupsAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => ({
                'X-Api-Key': `${auth}`,
            }),
        }),
    ],
    triggers: [],
})
