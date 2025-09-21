
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createContact } from "./lib/actions/create-contact";
import { updateContact } from "./lib/actions/update-contact";
import { findContact } from "./lib/actions/find-contact";
import { createOpportunity } from "./lib/actions/create-opportunity";
import { updateOpportunity } from "./lib/actions/update-opportunity";
import { findOpportunity } from "./lib/actions/find-opportunity";
import { createProject } from "./lib/actions/create-project";
import { findProject } from "./lib/actions/find-project";
import { createTask } from "./lib/actions/create-task";
import { addNoteToEntity } from "./lib/actions/add-note-to-entity";
import { newCases } from "./lib/triggers/new-cases";
import { newOpportunities } from "./lib/triggers/new-opportunities";
import { newProjects } from "./lib/triggers/new-projects";
import { newTasks } from "./lib/triggers/new-tasks";
import { CapsuleCRMAuth } from "./lib/common/auth";

    export const capsulecrm = createPiece({
      displayName: "Capsulecrm",
      auth: CapsuleCRMAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/capsulecrm.png",
      authors: [],
      actions: [createContact,updateContact,findContact,createOpportunity,updateOpportunity,findOpportunity,createProject,findProject,createTask,addNoteToEntity],
      triggers: [newCases,newOpportunities,newProjects,newTasks],
    });
    