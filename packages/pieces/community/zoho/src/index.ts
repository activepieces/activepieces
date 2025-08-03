
    import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createCall } from './lib/actions/create-call';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { createEvent } from './lib/actions/create-event';
import { updateEvent } from './lib/actions/update-event';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { createCompany } from './lib/actions/create-company';
import { updateCompany } from './lib/actions/update-company';
import { createPipelineRecord } from './lib/actions/create-pipeline-record';
import { updatePipelineRecord } from './lib/actions/update-pipeline-record';
import { searchContact } from './lib/actions/search-contact';
import { searchCompany } from './lib/actions/search-company';
import { searchProduct } from './lib/actions/search-product';
import { searchPipelineRecord } from './lib/actions/search-pipeline-record';
import { searchUser } from './lib/actions/search-user';
import { newCall } from './lib/triggers/new-call';
import { newContact } from './lib/triggers/new-contact';
import { updatedContact } from './lib/triggers/updated-contact';
import { newEvent } from './lib/triggers/new-event';
import { newTask } from './lib/triggers/new-task';
import { newCompany } from './lib/triggers/new-company';
import { updatedCompany } from './lib/triggers/updated-company';
import { newPipelineRecord } from './lib/triggers/new-pipeline-record';
import { updatedPipelineRecord } from './lib/triggers/updated-pipeline-record';

    export const zohoAuth = PieceAuth.OAuth2({
      props: {
        location: Property.StaticDropdown({
          displayName: 'Location',
          description: 'The location of your Zoho account',
          required: true,
          options: {
            options: [
              {
                label: 'zoho.eu (Europe)',
                value: 'zoho.eu',
              },
              {
                label: 'zoho.com (United States)',
                value: 'zoho.com',
              },
              {
                label: 'zoho.com.au (Australia)',
                value: 'zoho.com.au',
              },
              {
                label: 'zoho.jp (Japan)',
                value: 'zoho.jp',
              },
              {
                label: 'zoho.in (India)',
                value: 'zoho.in',
              },
              {
                label: 'zohocloud.ca (Canada)',
                value: 'zohocloud.ca',
              },
            ],
          },
        }),
      },
      description: 'Authentication for Zoho',
      scope: ['ZohoCRM.users.ALL','ZohoCRM.org.ALL', 'ZohoCRM.settings.ALL', 'ZohoCRM.modules.ALL', 'ZohoCRM.bulk.ALL', 'ZohoCRM.bulk.backup.ALL', 'ZohoFiles.files.ALL'],
      authUrl: 'https://accounts.{location}/oauth/v2/auth',
      tokenUrl: 'https://accounts.{location}/oauth/v2/token',
      required: true,
    });

    export const zoho = createPiece({
      displayName: "Zoho",
      auth: zohoAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/zoho.png",
      authors: [],
        actions: [createCall, createContact, updateContact, createEvent, updateEvent, createTask, updateTask, createCompany, updateCompany, createPipelineRecord, updatePipelineRecord, searchContact, searchCompany, searchProduct, searchPipelineRecord, searchUser],
  triggers: [newCall, newContact, updatedContact, newEvent, newTask, newCompany, updatedCompany, newPipelineRecord, updatedPipelineRecord],
    });
    