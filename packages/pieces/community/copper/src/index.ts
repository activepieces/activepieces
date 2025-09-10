import { createPiece } from "@activepieces/pieces-framework";
import { copperAuth } from "./lib/common/auth";

import { createPerson } from "./lib/actions/create-person";
import { updatePerson } from "./lib/actions/update-person";
import { createLead } from "./lib/actions/create-lead";
import { updateLead } from "./lib/actions/update-lead";
import { convertLead } from "./lib/actions/convert-lead";
import { createCompany } from "./lib/actions/create-company";
import { updateCompany } from "./lib/actions/update-company";
import { createOpportunity } from "./lib/actions/create-opportunity";
import { updateOpportunity } from "./lib/actions/update-opportunity";
import { createProject } from "./lib/actions/create-project";
import { updateProject } from "./lib/actions/update-project";
import { createTask } from "./lib/actions/create-task";
import { createActivity } from "./lib/actions/create-activity";
import { searchActivity } from "./lib/actions/search-activity";
import { searchPerson } from "./lib/actions/search-person";
import { searchLead } from "./lib/actions/search-lead";
import { searchCompany } from "./lib/actions/search-company";
import { searchOpportunity } from "./lib/actions/search-opportunity";
import { searchProject } from "./lib/actions/search-project";


import { newActivity } from "./lib/triggers/new-activity";
import { newPerson } from "./lib/triggers/new-person";
import { newLead } from "./lib/triggers/new-lead";
import { newTask } from "./lib/triggers/new-task";
import { updatedLead } from "./lib/triggers/updated-lead";
import { updatedTask } from "./lib/triggers/updated-task";
import { updatedOpportunity } from "./lib/triggers/updated-opportunity";
import { updatedOpportunityStatus } from "./lib/triggers/updated-opportunity-status";
import { updatedOpportunityStage } from "./lib/triggers/updated-opportunity-stage";
import { updatedProject } from "./lib/triggers/updated-project";
import { updatedLeadStatus } from "./lib/triggers/updated-lead-status";

export const copper = createPiece({
    displayName: "Copper",
    auth: copperAuth, // Use the imported auth object
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/copper.png",
    authors: [
    ],
    actions: [ 
        createPerson,
        updatePerson,
        createLead,
        updateLead,
        convertLead,
        createCompany,
        updateCompany,
        createOpportunity,
        updateOpportunity,
        createProject,
        updateProject,
        createTask,
        createActivity,
        searchActivity,
        searchPerson,
        searchLead,
        searchCompany,
        searchOpportunity,
        searchProject,
    ],
    triggers: [
      newActivity,
      newPerson,
      newLead,
      newTask,
      updatedLead,
      updatedTask,
      updatedOpportunity,
      updatedOpportunityStatus,
      updatedOpportunityStage,
      updatedProject,
      updatedLeadStatus
    ],
});