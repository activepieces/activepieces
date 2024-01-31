import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { getDataDefinition } from './lib/actions/get-data-definition';
import { pushData } from './lib/actions/push-data';
import { downloadStandardPDF } from './lib/actions/download-standard-pdf';
import { eventOnData } from './lib/trigger/event-on-data.trigger';
import { downloadCustomExportInItsOriginalFormat } from './lib/actions/download-custom-export-in-its-original-format';
import { eventOnDataDeleted } from './lib/trigger/event-on-data-deleted';
import { eventOnDataFinished } from './lib/trigger/event-on-data-finished';
import { eventOnDataPushed } from './lib/trigger/event-on-data-pushed';
import { eventOnDataPulled } from './lib/trigger/event-on-data-received';
import { eventOnDataUpdated } from './lib/trigger/event-on-data-updated';
import { CreateListItem } from './lib/actions/create-list-item';
import { getListDefinition } from './lib/actions/get-list-definition';
import { getListItem } from './lib/actions/get-list-item';
import { getAllListItems } from './lib/actions/get-all-list-items';
import { editListItem } from './lib/actions/edit-list-item';
import { deleteListItem } from './lib/actions/delete-list-item';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { endpoint } from './lib/common';

const markdownDescription = `
To connect to Kizeo Forms, you need an API Token provided by their support team.
`;

export const kizeoFormsAuth = PieceAuth.SecretText({
  displayName: 'Kizeo Forms API Key',
  required: true,
  description: markdownDescription,
});

export const kizeoForms = createPiece({
  displayName: 'Kizeo Forms',
  minimumSupportedRelease: '0.6.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/kizeo-forms.png',
  authors: ['BastienMe'],
  auth: kizeoFormsAuth,
  actions: [
    getDataDefinition,
    pushData,
    downloadStandardPDF,
    downloadCustomExportInItsOriginalFormat,
    getListDefinition,
    getListItem,
    getAllListItems,
    CreateListItem,
    editListItem,
    deleteListItem,
    createCustomApiCallAction({
        baseUrl: () => endpoint,
        auth: kizeoFormsAuth,
        authMapping: (auth) => {
            return {
                'Authorization': auth as string,
            }
        }
    })
    
  ],
  triggers: [
    eventOnData,
    eventOnDataDeleted,
    eventOnDataFinished,
    eventOnDataPushed,
    eventOnDataPulled,
    eventOnDataUpdated,
  ],
});
