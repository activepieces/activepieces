# pieces-stopflow
An Activepieces piece to immediately stop the current flow's execution. This library was generated with Nx.

# Action: Stop Flow Execution
Description: When this action is reached in a flow, it terminates all subsequent execution.

**Inputs:** None.

**Outputs:** None.

# Use Case
This piece is primarily used to exit a loop, such as a "For Each" step, once a specific condition has been met. This prevents further items in a list from being processed, saving time and tasks.

**Example Flow:**

- A `Trigger` provides a list of items.

- A `For Each` step iterates over the list.

- A `Branch` step checks if the current item meets a condition.

- The `Stop Flow` action is placed in the "True" path of the Branch to halt the entire execution.

# Building
Run `nx build pieces-stopflow` to build the library.a