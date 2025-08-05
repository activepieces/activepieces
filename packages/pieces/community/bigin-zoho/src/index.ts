
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
    import {
      OAuth2PropertyValue,
      createPiece,
    } from '@activepieces/pieces-framework';
    import { PieceCategory } from '@activepieces/shared';

    import { biginZohoAuth } from './lib/common/auth';

    import { createContact } from './lib/actions/create-contact';
    import { updateContact } from './lib/actions/update-contact';
    import { createCompany } from './lib/actions/create-company';
    import { updateCompany } from './lib/actions/update-company';
    import { searchContact } from './lib/actions/search-contact';
    import { createPipeline } from './lib/actions/create-pipeline';
    import { updatePipeline } from './lib/actions/update-pipeline';
    import { searchCompany } from './lib/actions/search-company';
    import { searchProduct } from './lib/actions/search-product';
    import { searchPipeline } from './lib/actions/search-pipeline';
    import { searchUser } from './lib/actions/search-user';
    import { createCall } from './lib/actions/create-call';
    import { createEvent } from './lib/actions/create-event';
    import { updateEvent } from './lib/actions/update-event';
    import { createTask } from './lib/actions/create-task';
    import { updateTask } from './lib/actions/update-task';

    import { newContact } from './lib/triggers/new-contact';
    import { updatedContact } from './lib/triggers/updated-contact';
    import { newCompany } from './lib/triggers/new-company';
    import { updatedCompany } from './lib/triggers/updated-company';
    import { newPipeline } from './lib/triggers/new-pipeline';
    import { updatedPipeline } from './lib/triggers/updated-pipeline';
    import { newCall } from './lib/triggers/new-call';
    import { newEvent } from './lib/triggers/new-event';
    import { newTask } from './lib/triggers/new-task';

    export const biginZoho = createPiece({
      displayName: 'Bigin by Zoho',
      description: 'Simple and affordable CRM software by Zoho',
      auth: biginZohoAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/bigin-zoho.png",
      categories: [PieceCategory.SALES_AND_CRM],
      authors: ["sparkybug"],
      actions: [
        createContact,
        updateContact,
        searchContact,
        createCompany,
        updateCompany,
        searchCompany,
        createPipeline,
        updatePipeline,
        searchPipeline,
        createCall,
        createEvent,
        updateEvent,
        createTask,
        updateTask,
        searchProduct,
        searchUser,
        createCustomApiCallAction({
          baseUrl: () => 'https://www.zohoapis.com/bigin/v1',
          auth: biginZohoAuth,
          authMapping: async (auth) => ({
            Authorization: `Zoho-oauthtoken ${(auth as OAuth2PropertyValue).access_token}`,
          }),
        }),
      ],
      triggers: [
        newContact,
        updatedContact,
        newCompany,
        updatedCompany,
        newPipeline,
        updatedPipeline,
        newCall,
        newEvent,
        newTask,
      ],
    });
    
    export { biginZohoAuth };
    