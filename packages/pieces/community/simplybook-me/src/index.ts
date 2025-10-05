

import { PieceCategory } from "@activepieces/shared";
import { createPiece } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "./lib/common/auth";


import { cancelBooking } from "./lib/actions/cancel-booking";
import { createBooking } from "./lib/actions/create-booking";
import { addCommentToBooking } from "./lib/actions/add-comment-to-booking";
import { createClient } from "./lib/actions/create-client";
import { deleteClient } from "./lib/actions/delete-client";
import { findBooking } from "./lib/actions/find-booking";
import { findClient } from "./lib/actions/find-client";
import { findInvoice } from "./lib/actions/find-invoice";
import { generateDetailedReport } from "./lib/actions/generate-detailed-report";
import { createCalendarNote } from "./lib/actions/create-calendar-note";

import { newBooking } from "./lib/triggers/new-booking";
import { bookingChanged } from "./lib/triggers/booking-changed";
import { bookingCanceled } from "./lib/triggers/booking-canceled";
import { newClient } from "./lib/triggers/new-client";
import { newOffer } from "./lib/triggers/new-offer";
import { newInvoice } from "./lib/triggers/new-invoice";

export const simplybookMe = createPiece({
    displayName: "Simplybook.me",
    description: "Appointment booking system for service-based businesses.",
    auth: simplybookMeAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/simplybook-me.png",
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['Pranith124'],
    actions: [
        createBooking,
        cancelBooking,
        addCommentToBooking,
        createClient,
        deleteClient,
        createCalendarNote,
        findBooking,
        findClient,
        findInvoice,
        generateDetailedReport,
    ],
    triggers: [
        newBooking,
        bookingChanged,
        bookingCanceled,
        newClient,
        newOffer,
        newInvoice,
    ],
});