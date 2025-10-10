
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createPlan } from "./lib/actions/create-plan";
import { createTask } from "./lib/actions/create-task";
import { createBucket } from "./lib/actions/create-bucket";
import { updatePlan } from "./lib/actions/update-plan";
import { updateTask } from "./lib/actions/update-task";
import { updateBucket } from "./lib/actions/update-bucket";
import { findPlannerPlan } from "./lib/actions/find-a-plan";
import { findPlannerTask } from "./lib/actions/find-task";
import { getPlannerBucket } from "./lib/actions/get-a-bucket";
import { newPlanCreatedTrigger } from "./lib/triggers/new-plan-created";
import { newTaskAssignedToUserTrigger } from "./lib/triggers/new-task-assigned-to-user";
import { newTaskCreatedTrigger } from "./lib/triggers/new-task-created";

    export const microsoft365planner = createPiece({
      displayName: "Microsoft365planner",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/microsoft365planner.png",
      authors: ["Niket2035"],
      actions: [createPlan,createTask,createBucket,updatePlan,updateTask,updateBucket,findPlannerPlan,findPlannerTask,getPlannerBucket],
      triggers: [newPlanCreatedTrigger,newTaskAssignedToUserTrigger,newTaskCreatedTrigger],
    });
    