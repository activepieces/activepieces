import { GetTestRegistryRequest, GetTestRegistryResponse, TestRegistryCommand, TestRegistryCommandUpdate } from '@activepieces/copilot-shared'
import { getTestRegistry } from '../../evaluation/test-registry'
import { createCommandHandler } from './command-handler'
import { Socket } from 'socket.io'
import { addResult } from '../../util/websocket-utils'


export const createEmptyResponse = (agentName: string): GetTestRegistryResponse => ({
  type: TestRegistryCommand.GET_TEST_REGISTRY,
  data: {
    agentName,
    testCases: [],
  },
})


const handleTestRegistry = async (socket: Socket, request: GetTestRegistryRequest): Promise<void> => {
  try {
    const testRegistry = getTestRegistry(request.agentName)
    
    const response = testRegistry 
      ? {
          type: TestRegistryCommand.GET_TEST_REGISTRY,
          data: testRegistry,
        }
      : createEmptyResponse(request.agentName)

    addResult(socket, {
      type: TestRegistryCommandUpdate.TEST_REGISTRY_UPDATED,
      data: response,
    })
  } catch (error) {
    console.error('Error loading test registry:', error)
    addResult(socket, {
      type: TestRegistryCommandUpdate.TEST_REGISTRY_UPDATED,
      data: createEmptyResponse(request.agentName),
    })
  }
}

export const getTestRegistryHandler = createCommandHandler(
  TestRegistryCommand.GET_TEST_REGISTRY,
  handleTestRegistry
) 