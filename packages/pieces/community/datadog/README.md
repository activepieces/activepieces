# pieces-datadog

This library was generated with [Nx](https://nx.dev).

## Building

- Run `nx build pieces-datadog` to build the library.
- Add `datadog` to `AP_DEV_PIECES` environment variable to test

## Adding new actions

- Check the [Datadog API documentation](https://docs.datadoghq.com/api/latest/) to see the available endpoints and parameters. 
- Prefer using the typescript SDK ([`@datadog/datadog-api-client`](https://github.com/DataDog/datadog-api-client-typescript)) over the HTTP API for better type safety and documentation.
