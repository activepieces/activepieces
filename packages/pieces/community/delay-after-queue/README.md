# Delay After Queue Piece

A custom Activepieces piece that provides rate control for flow execution. This piece allows you to create queues that process flows one at a time with configurable delays between executions.

## Features

- **Queue-based rate limiting**: Multiple flows using the same queue name are processed sequentially
- **Configurable delays**: Set delays in seconds, minutes, or hours
- **Project-scoped queues**: Queues are shared across all flows in a project
- **Automatic cleanup**: Queue entries are automatically removed after processing

## Usage

1. Add the "Delay After Queue" action to your flow
2. Configure a unique queue name
3. Set the delay amount and unit
4. The flow will wait in the queue and apply the specified delay before continuing

## Configuration

- **Queue Name**: A unique identifier for the queue (required)
- **Delay Unit**: Choose between seconds, minutes, or hours
- **Delay Amount**: The number of time units to delay

## Example Use Cases

- Rate limiting API calls
- Preventing database overload
- Managing resource-intensive operations
- Coordinating multiple flows that use the same external service

## Building

Run `nx build pieces-delay-after-queue` to build the library.
