import packageJson from "../package.json";
import { createPiece } from "@activepieces/pieces-framework";
import { blackbaudUpsertContact } from "./lib/actions/upsert-contact";
import { blackbaudSearchAfterDate } from "./lib/actions/search-contacts-after-date";
import {blackbaudGetGiftSubtypes} from './lib/actions/get_gift_subtype';
import {blackbaudGetFundraisingList} from './lib/actions/get_fandraising_list';
import {blackbaudCreateGift} from './lib/actions/create-gift';

export const blackbaud = createPiece({
    name: 'blackbaud',
    displayName: "Blackbaud",
    logoUrl: 'https://cdn.activepieces.com/pieces/blackbaud.png',
    version: packageJson.version,
    authors: ['abuaboud', 'HKudria'],
    actions: [blackbaudSearchAfterDate, blackbaudUpsertContact, blackbaudGetGiftSubtypes, blackbaudGetFundraisingList, blackbaudCreateGift],
    triggers: [],
});
