## Setup

Create a `.env` file in `packages/copilot/.env` with your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

## Running Testing

to run the copilot against all use cases, run `nx test copilot`

## Compiling Examples

The examples are generated from the UI and saved as JSON files in `packages/copilot/src/lib/examples/original`.

To compile the examples into a format that can be used by the copilot, run `nx compile copilot`.

This will create a new directory `packages/copilot/src/lib/examples/compiled` with the compiled examples.
