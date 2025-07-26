**Delay After Queue Piece**

- A custom Activepieces piece that provides rate control for flow execution. This piece allows you to create queues that process flows one at a time with configurable delays between executions.

**Features**

- Queue-based rate limiting: Multiple flows using the same queue name are processed sequentially

- Configurable delays: Set delays in seconds or minutes (max total delay of 10 minutes)

- Project-scoped queues: Queues are shared across all flows in a project

- Automatic cleanup: Queue entries are automatically removed after processing

**Usage**

- Add the "Delay After Queue" action to your flow

- Configure a unique queue name

- Set the delay amount and unit (seconds or minutes) — maximum total delay allowed is 10 minutes

- The flow will wait in the queue and apply the specified delay before continuing

**Configuration**

- Queue Name: A unique identifier for the queue (required)

- Delay Unit: Choose between seconds or minutes (hours not supported)

- Delay Amount: The number of time units to delay (max total delay 10 minutes)

**Limitations**

- Delay durations longer than 10 minutes are not supported to avoid flow timeout errors.

- If you need longer delays, consider splitting your flow or using external scheduling mechanisms.

**Example Use Cases**

- Rate limiting API calls

- Preventing database overload

- Managing resource-intensive operations

- Coordinating multiple flows that use the same external service

**Building**

- Run nx build pieces-delay-after-queue to build the library.
