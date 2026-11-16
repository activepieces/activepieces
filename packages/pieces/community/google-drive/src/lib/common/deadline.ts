function abortAfter(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(timer) };
}

function untilAborted<T>({
  promise,
  signal,
  message,
}: {
  promise: Promise<T>;
  signal: AbortSignal;
  message: string;
}): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new Error(message));
    if (signal.aborted) {
      onAbort();
    } else {
      signal.addEventListener('abort', onAbort, { once: true });
    }
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', onAbort));
  });
}

async function runWithin<T>({
  ms,
  message,
  call,
}: {
  ms: number;
  message: string;
  call: (signal: AbortSignal) => Promise<T>;
}): Promise<T> {
  if (ms <= 0) {
    throw new Error(message);
  }
  const { signal, cancel } = abortAfter(ms);
  try {
    return await untilAborted({ promise: call(signal), signal, message });
  } finally {
    cancel();
  }
}

export const driveDeadline = {
  abortAfter,
  untilAborted,
  runWithin,
};
