
export const readStream = async ({
  response,
  onChunk,
  onEnd,
}: {
  response: { body: ReadableStream<Uint8Array>},
  onChunk: (chunk: string) => void,
  onEnd: () => void,
}): Promise<void> => {

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onEnd();
        break;
      }

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    }
  } finally {
    reader.releaseLock();
  }
};
