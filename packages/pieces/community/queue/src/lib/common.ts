
export function constructQueueName(queueName: string, testing: boolean) {
  return `_queue_rmAPlFmX0s_${testing ? 'testing_' : ''}${queueName}`
}