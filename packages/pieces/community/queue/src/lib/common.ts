
export function constructQueueName(queueName: string, testing: boolean) {
  return `_queue_rmAPlFmX0s_${testing ? 'testing_' : ''}${queueName}`
}

export function formatStorageError(e: unknown) {
  const size = (e as { maxStorageSizeInBytes: number }).maxStorageSizeInBytes;
  return new Error(JSON.stringify({
    message: `Queue write operation failed. The total size of the queue has exceeded the maximum limit of ${Math.floor(size / 1024)} kb.`,
    details: {
      maxSizeInKb: Math.floor(size / 1024),
      suggestion: "Consider consume faster from the queue or reduce the size of the items being added to the queue."
    }
  }));
}