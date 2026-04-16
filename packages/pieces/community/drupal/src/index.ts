import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { drupalCreateEntityAction } from './lib/actions/create_entity'
import { drupalDeleteEntityAction } from './lib/actions/delete_entity'
import { drupalGetEntityAction } from './lib/actions/get_entity'
import { drupalListEntitiesAction } from './lib/actions/list_entities'
import { drupalCallServiceAction } from './lib/actions/services'
import { drupalUpdateEntityAction } from './lib/actions/update_entity'
import { drupalAuth } from './lib/auth'
import { drupalPollingId } from './lib/triggers/polling-id'
import { drupalPollingTimestamp } from './lib/triggers/polling-timestamp'
import { drupalWebhook } from './lib/triggers/webhook'

const markdownPropertyDescription = `
**Using Drupal's JSON:API**

Your Drupal site comes with JSON:API built-in. Authentication to access relevant parts requires the HTTP Basic Authentication module, which is also part of your Drupal site. Just ensure both are enabled and configure user authentication:

1. Enable the JSON:API and the HTTP Basic Authentication modules
2. Create a user account and give it the permissions you want Activepieces to have
3. Use that account's credentials for authentication

Provide the website URL in the format https://www.example.com.

For extra functionality, you can use the [Drupal Orchestration](https://www.drupal.org/project/orchestration) module.
`

export const drupal = createPiece({
    displayName: 'Drupal',
    auth: drupalAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/drupal.png',
    categories: [
        PieceCategory.BUSINESS_INTELLIGENCE,
        PieceCategory.COMMERCE,
        PieceCategory.CONTENT_AND_FILES,
        PieceCategory.FORMS_AND_SURVEYS,
        PieceCategory.MARKETING,
    ],
    authors: ['dbuytaert', 'jurgenhaas'],
    actions: [
        drupalCallServiceAction,
        drupalCreateEntityAction,
        drupalListEntitiesAction,
        drupalGetEntityAction,
        drupalUpdateEntityAction,
        drupalDeleteEntityAction,
    ],
    triggers: [drupalPollingId, drupalPollingTimestamp, drupalWebhook],
})
