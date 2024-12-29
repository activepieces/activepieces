export enum TestRegistryCommand {
    GET_TEST_REGISTRY = 'GET_TEST_REGISTRY',
  }
  
  export interface GetTestRegistryRequest {
    type: TestRegistryCommand.GET_TEST_REGISTRY
    agentName: string
  }
  
  export interface GetTestRegistryResponse {
    type: TestRegistryCommand.GET_TEST_REGISTRY
    data: {
      agentName: string
      testCases: Array<{
        title: string
        prompt: string
        idealOutput: Record<string, any>
      }>
    }
  }


  export enum TestRegistryCommandUpdate {
    TEST_REGISTRY_UPDATED = 'TEST_REGISTRY_UPDATED',
  }

 