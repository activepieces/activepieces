import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { serviceNowAuth, ServiceNowAuth } from "./lib/common/auth";
import { createRecordAction } from "./lib/actions/create-record";
import { updateRecordAction } from "./lib/actions/update-record";
import { attachFileAction } from "./lib/actions/attach-file";
import { getRecordAction } from "./lib/actions/get-record";
import { findRecordAction } from "./lib/actions/find-record";
import { findFileAction } from "./lib/actions/find-file";
import { newRecordTrigger } from "./lib/triggers/new-record";
import { updatedRecordTrigger } from "./lib/triggers/updated-record";


export const serviceNow = createPiece({
  displayName: "ServiceNow",
  description: 'IT Service Management (ITSM) platform to manage digital workflows for enterprise operations.',
  auth: serviceNowAuth,
  minimumSupportedRelease: '0.3.1',
  logoUrl: "https://cdn.activepieces.com/pieces/service-now.png",
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['david-oluwaseun420'],
  actions: [
    createRecordAction,
    updateRecordAction,
    attachFileAction,
    getRecordAction,
    findRecordAction,
    findFileAction,
    createCustomApiCallAction({
        auth: serviceNowAuth,
        baseUrl: (auth) => {
            return (auth as ServiceNowAuth).instance_url;
        },
        authMapping: async (auth) => {
            return {
                'x-sn-apikey': (auth as ServiceNowAuth).api_key,
            }
        }
    })
  ],
  triggers: [
    newRecordTrigger,
    updatedRecordTrigger 
  ],
});