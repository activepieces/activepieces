import z from "zod";


const TodoItemSchema = z.object({
    id: z.string().describe("Unique identifier for the todo item"),
    content: z
      .string()
      .max(100)
      .describe("The description/content of the todo item (max 100 chars)"),
    status: z
      .enum(["pending", "in_progress", "completed", "cancelled"])
      .describe("The current status of the todo item"),
  });

export const QuickState = z.object({
    todos: z.array(TodoItemSchema),
})