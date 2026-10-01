import { createPiece } from "@activepieces/pieces-framework";
import { systemeIoAuth } from "./lib/common/auth"

import { newContact } from "./lib/triggers/new-contact";
import { newSale } from "./lib/triggers/new-sale";
import { newTagAddedToContact } from "./lib/triggers/new-tag-added-to-contact"
import { contactTagRemoved } from "./lib/triggers/contact-tag-removed";
import { newOptIn } from "./lib/triggers/new-opt-in";
import { saleCanceled } from "./lib/triggers/sale-canceled";

import { createContact } from "./lib/actions/create-contact";
import { addTagToContact } from "./lib/actions/add-tag-to-contact";
import { removeTagFromContact } from "./lib/actions/remove-tag-from-contact";
import { findContactByEmail } from "./lib/actions/find-contact-by-email";
import { updateContact } from "./lib/actions/update-contact"
import { findContacts } from "./lib/actions/find-contacts";
import { getContact } from "./lib/actions/get-contact";
import { deleteContact } from "./lib/actions/delete-contact";
import { createTag } from "./lib/actions/create-tag";
import { deleteTag } from "./lib/actions/delete-tag";
import { enrollContactInCourse } from "./lib/actions/enroll-contact-in-course";
import { removeCourseEnrollment } from "./lib/actions/remove-course-enrollment";
import { addContactToCommunity } from "./lib/actions/add-contact-to-community";
import { removeContactFromCommunity } from "./lib/actions/remove-contact-from-community";
import { cancelSubscription } from "./lib/actions/cancel-subscription";
import { systemeAiActions } from "./lib/actions/ai";
import { PieceCategory } from '@activepieces/pieces-framework';

export const systemeIo = createPiece({
  displayName: "Systeme.io",
  auth: systemeIoAuth,
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.MARKETING],
  description: "Systeme.io is a CRM platform that allows you to manage your contacts, sales, and marketing campaigns.",
  logoUrl: "https://cdn.activepieces.com/pieces/systeme-io.png",
  authors: ['ezhil56x', 'onyedikachi-david'],
  actions: [
    createContact,
    addTagToContact,
    removeTagFromContact,
    findContactByEmail,
    updateContact,
    findContacts,
    getContact,
    deleteContact,
    createTag,
    deleteTag,
    enrollContactInCourse,
    removeCourseEnrollment,
    addContactToCommunity,
    removeContactFromCommunity,
    cancelSubscription,
    ...systemeAiActions,
  ],
  triggers: [
    newContact,
    newSale,
    newTagAddedToContact,
    contactTagRemoved,
    newOptIn,
    saleCanceled,
  ],
});
