import { ClickupEventType } from "../common/models"
import { clickupRegisterTrigger } from "./register-trigger"

export const clickupTriggers = [
  {
    name: "task_created",
    eventType: ClickupEventType.TASK_CREATED,
    displayName: 'Task created',
    description: 'Triggered when a new task is created.'
  },
  {
    name: "task_updated",
    eventType: ClickupEventType.TASK_UPDATED,
    displayName: 'Task updated',
    description: 'Triggered when a task is updated.'
  },
  {
    name: "task_deleted",
    eventType: ClickupEventType.TASK_DELETED,
    displayName: 'Task deleted',
    description: 'Triggered when a task is deleted.'
  },
  {
    name: "task_comment_posted",
    eventType: ClickupEventType.TASK_COMMENT_POSTED,
    displayName: 'Task comment posted',
    description: 'Triggered when a task comment is posted.'
  },
  {
    name: "task_comment_updated",
    eventType: ClickupEventType.TASK_COMMENT_UPDATED,
    displayName: 'Task comment updated',
    description: 'Triggered when a task comment is updated.'
  }
].map((props) => clickupRegisterTrigger(props))