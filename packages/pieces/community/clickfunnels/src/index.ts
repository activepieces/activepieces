import { createPiece, Property, TriggerStrategy, createTrigger, createAction } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { clickfunnelsAuth } from "./lib/common/common";

import { createOpportunityAction } from "./lib/actions/create-opportunity";
import { createTagAction } from "./lib/actions/create-tag";
import { deleteTagAction } from "./lib/actions/delete-tag";
import { enrollContactInCourseAction } from "./lib/actions/enroll-contact-in-course";
import { upsertContactAction } from "./lib/actions/upsert-contact";
import { getContactAction } from "./lib/actions/get-contact";

import { newScheduledEventTrigger } from "./lib/triggers/new-scheduled-event";
import { newCourseEnrollmentTrigger } from "./lib/triggers/new-course-enrollment";
import { newFormSubmissionTrigger } from "./lib/triggers/new-form-submission";
import { newOrderPaidTrigger } from "./lib/triggers/new-order-paid";
import { newSubscriptionInvoicePaidTrigger } from "./lib/triggers/new-subscription-invoice-paid";
import { newLessonCompletionTrigger } from "./lib/triggers/new-lesson-completion";
import { newContactIdentifiedTrigger } from "./lib/triggers/new-contact-identified";


// The main piece definition that Activepieces will load
export const clickfunnels = createPiece({
    displayName: "ClickFunnels",
    description: "Sales funnel builder for entrepreneurs.",
    auth: clickfunnelsAuth,
    minimumSupportedRelease: '0.20.0',
    logoUrl: "https://cdn.activepieces.com/pieces/clickfunnels.png",
    authors: [ 
    ],
    actions: [
        createOpportunityAction,
        createTagAction,
        deleteTagAction,
        enrollContactInCourseAction,
        upsertContactAction,
        getContactAction
    ],
    triggers: [
        newScheduledEventTrigger,
        newCourseEnrollmentTrigger,
        newFormSubmissionTrigger,
        newOrderPaidTrigger,
        newSubscriptionInvoicePaidTrigger,
        newLessonCompletionTrigger,
        newContactIdentifiedTrigger,

    ],
});