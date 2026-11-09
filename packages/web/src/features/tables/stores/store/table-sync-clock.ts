function tick(): number {
  now += 1;
  return now;
}

let now = 0;

export const tableSyncClock = {
  tick,
};
