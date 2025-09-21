import { createPiece } from "@activepieces/pieces-framework";
import { capsuleCrmAuth } from "./lib/common/auth";

import { createContact } from "./lib/actions/create-contact";
import { updateContact } from "./lib/actions/update-contact";
import { createOpportunity } from "./lib/actions/create-opportunity";
import { updateOpportunity } from "./lib/actions/update-opportunity";
import { createProject } from "./lib/actions/create-project";
import { createTask } from "./lib/actions/create-task";
import { addNoteToEntity } from "./lib/actions/add-note-to-entity";
import { findContact } from "./lib/actions/find-contact";
import { findProject } from "./lib/actions/find-project";
import { findOpportunity } from "./lib/actions/find-opportunity";

import { newCases } from "./lib/triggers/new-case";
import { newOpportunities } from "./lib/triggers/new-opportunity";
import { newTasks } from "./lib/triggers/new-task";
import { newProjects } from "./lib/triggers/new-projects";

export const capsuleCrm = createPiece({
  displayName: "Capsule CRM",
  auth: capsuleCrmAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/capsule-crm.png",
  authors: [
  ],
  actions: [
    createContact,
    updateContact,
    createOpportunity,
    updateOpportunity,
    createProject,
    createTask,
    addNoteToEntity,
    findContact,
    findProject,
    findOpportunity
  ],
  triggers: [
    newCases,
    newOpportunities,
    newTasks,
    newProjects
  ],
});