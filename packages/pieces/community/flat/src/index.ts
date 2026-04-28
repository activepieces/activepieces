import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { flatAuth } from './lib/auth';
import { listCollectionsAction } from './lib/actions/list-collections';
import { createCollectionAction } from './lib/actions/create-collection';
import { deleteCollectionAction } from './lib/actions/delete-collection';
import { getCollectionAction } from './lib/actions/get-collection';
import { editCollectionAction } from './lib/actions/edit-collection';
import { listCollectionScoresAction } from './lib/actions/list-collection-scores';
import { deleteScoreFromCollectionAction } from './lib/actions/delete-score-from-collection';
import { addScoreToCollectionAction } from './lib/actions/add-score-to-collection';
import { untrashCollectionAction } from './lib/actions/untrash-collection';

export const flat = createPiece({
  displayName: 'Flat',
  description: 'The Flat API allows you to easily extend the abilities of the [Flat Platform](https://flat.io), with a wide range of use cases including the following:  * Creating and importing new music scores using MusicXML, MIDI, Guitar Pro (GP3, GP4, GP5, GPX, GP), PowerTab, TuxGuitar and MuseScore files * Browsing, updating, copying, exporting the user\'s scores (for example in MP3, WAV or MIDI) * Managing educational resources with Flat for Education: creating & updating the organization accounts, the classes, rosters and assignments.  The Flat API is built on HTTP. Our API is RESTful It has predictable resource URLs. It returns HTTP response codes to indicate errors. It also accepts and returns JSON in the HTTP body. The [schema](/swagger.yaml) of this API follows the [OpenAPI Initiative (OAI) specification](https://www.openapis.org/), you can use and work with [compatible Swagger tools](http://swagger.io/open-source-integrations/). This API features Cross-Origin Resource Sharing (CORS) implemented in compliance with [W3C spec](https://www.w3.org/TR/cors/).  You can use your favorite HTTP/REST library for your programming language to use Flat\'s API. This specification and reference is [available on Github](https://github.com/FlatIO/api-reference).  Getting Started and learn more:  * [API Overview and introduction](https://flat.io/developers/docs/api/) * [Authentication (Personal Access Tokens or OAuth2)](https://flat.io/developers/docs/api/authentication.html) * [SDKs](https://flat.io/developers/docs/api/sdks.html) * [Rate Limits](https://flat.io/developers/docs/api/rate-limits.html) * [Changelog](https://flat.io/developers/docs/api/changelog.html) ',
  auth: flatAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/flat.png',
  authors: [],
  actions: [
    listCollectionsAction,
    createCollectionAction,
    deleteCollectionAction,
    getCollectionAction,
    editCollectionAction,
    listCollectionScoresAction,
    deleteScoreFromCollectionAction,
    addScoreToCollectionAction,
    untrashCollectionAction,
  ],
  triggers: [],
});
