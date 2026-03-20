import { createAction } from "@activepieces/pieces-framework";
import { listWorkSlots } from "@hulymcp/huly/operations/time.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listWorkSlotsAction = createAction({
  auth: hulyAuth,
  name: "list_work_slots",
  displayName: "List Work Slots",
  description: "List work time slots in your Huly workspace",
  props: {},
  async run(context) {
    const slots = await withHulyClient(context.auth, listWorkSlots({}));
    return slots.map((s) => ({
      id: s.id,
      todo_id: s.todoId ?? null,
      date: s.date,
      due_date: s.dueDate,
      title: s.title ?? null,
    }));
  },
});
