import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework'
import * as Contentful from 'contentful-management'
import { ContentfulAuth } from './auth'

export const makeClient = (auth: AppConnectionValueForAuthProperty<typeof ContentfulAuth>) => {
    return {
        client: Contentful.createClient(
            { accessToken: auth.props.apiKey },
            {
                type: 'plain',
                defaults: { spaceId: auth.props.space, environmentId: auth.props.environment },
            },
        ),
    }
}
