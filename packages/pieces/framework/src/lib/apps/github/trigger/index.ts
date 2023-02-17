import { Trigger } from "../../../framework/trigger/trigger";
import { githubNewRepoEvent } from "./new-star";

export const triggers: Trigger[] = [githubNewRepoEvent]