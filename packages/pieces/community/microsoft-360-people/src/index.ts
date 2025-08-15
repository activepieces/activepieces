
    import { createPiece } from "@activepieces/pieces-framework";
    import { microsoft365PeopleAuth } from "./lib/auth";
    import { newOrUpdatedContact } from "./lib/triggers/new-or-updated-contact";
    import { createAContact } from "./lib/actions/create-a-contact";
    import { updateAContact } from "./lib/actions/update-a-contact";
    import { deleteAContact } from "./lib/actions/delete-a-contact";
    import { searchContacts } from "./lib/actions/search-contacts";
    import { createAContactFolder } from "./lib/actions/create-a-contact-folder";
    import { deleteAContactFolder } from "./lib/actions/delete-a-contact-folder";
    import { getAContactFolder } from "./lib/actions/get-a-contact-folder";

    export const microsoft360People = createPiece({
      displayName: "Microsoft 365 People",
      auth: microsoft365PeopleAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/microsoft-360-people.png",
      authors: [],
      actions: [
        createAContact,
        updateAContact,
        deleteAContact,
        searchContacts,
        createAContactFolder,
        deleteAContactFolder,
        getAContactFolder,
      ],
      triggers: [newOrUpdatedContact],
    });
    