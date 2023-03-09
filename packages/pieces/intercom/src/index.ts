import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { createContact } from './lib/actions/create-contact.action';
export const intercom = createPiece({
    displayName:"Intercom",
    logoUrl:"https://cdn.activepieces.com/pieces/intercom.png",
    name:"intercom",
    version:packageJson.version,
    triggers:[],
    actions:[createContact],
})