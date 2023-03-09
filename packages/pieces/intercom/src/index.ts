import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { getOrCreateContact } from './lib/actions/create-or-get-contact.action';
export const intercom = createPiece({
    displayName:"Intercom",
    logoUrl:"https://cdn.activepieces.com/pieces/intercom.png",
    name:"intercom",
    version:packageJson.version,
    triggers:[],
    actions:[getOrCreateContact],
})