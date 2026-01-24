import { ChatSession, PlanItem } from '@activepieces/shared'
import { tool } from 'ai'
import { z } from 'zod'

export const WRITE_TODOS_TOOL_NAME = 'write_todos'

const PlanItemSchema = z.object({
    id: z.string().describe('Unique identifier for the todo item'),
    content: z
        .string()
        .max(100)
        .describe('The description/content of the todo item (max 100 chars)'),
    status: z
        .enum(['pending', 'completed', 'in_progress'])
        .describe('The current status of the todo item'),
})


export function createPlanningTool(state: Pick<ChatSession, 'plan'>) {
    return tool({
        description: `Manage and plan tasks using a structured todo list. Use this tool for:
- Complex multi-step tasks (3+ steps)
- After receiving new instructions - capture requirements
- After completing tasks - mark complete immediately

Task states: pending, completed

When merge=true, updates are merged with existing todos by id.
When merge=false, the new todos replace all existing todos.`,
        inputSchema: z.object({
            todos: z
                .array(PlanItemSchema)
                .min(1)
                .describe('Array of todo items to write'),
            merge: z
                .boolean()
                .default(true)
                .describe(
                    'Whether to merge with existing todos (true) or replace all (false)',
                ),
        }),
        execute: async ({ todos, merge }) => {
            if (!merge) {
                state.plan = todos
            }
            else {
                const existingMap = new Map<string, PlanItem>()
                for (const todo of state.plan ?? []) {
                    existingMap.set(todo.id, todo)
                }
                for (const newTodo of todos) {
                    existingMap.set(newTodo.id, newTodo)
                }
                state.plan = Array.from(existingMap.values())
            }
            const todoList = (state.plan ?? [])
                .map((t) => `- [${t.status}] ${t.id}: ${t.content}`)
                .join('\n')

            return { message: `Todo list updated successfully.\n\nCurrent todos:\n${todoList}` }
        },
    })
}

export const TODO_SYSTEM_PROMPT = `## \`${WRITE_TODOS_TOOL_NAME}\` (task planning)

You have access to a \`${WRITE_TODOS_TOOL_NAME}\` tool to help you manage and plan tasks. 
Use this tool whenever you are working on a complex task, You must use this tool before starting any task.

### When to Use This Tool

Use proactively for:
1. Complex multi-step tasks (3+ distinct steps)
2. Non-trivial tasks requiring careful planning
3. After receiving new instructions - capture requirements as todos
4. After completing tasks - mark complete and add follow-ups
5. When starting new tasks - mark as in_progress (ideally only one at a time)

### When NOT to Use

Skip for:
1. Single, straightforward tasks
2. Trivial tasks with no organizational benefit
3. Tasks completable in < 3 trivial steps
4. Purely conversational/informational requests

### Task States and Management

1. **Task States:**
  - pending: Not yet started
  - in_progress: Currently working on
  - completed: Finished successfully

2. **Task Management:**
  - Update status in real-time
  - Mark complete IMMEDIATELY after finishing
  - Only ONE task in_progress at a time
  - Complete current tasks before starting new ones`