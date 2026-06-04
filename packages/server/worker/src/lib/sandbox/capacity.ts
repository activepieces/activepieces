// firstBoxUid / numBoxes must match packages/server/api/src/assets/default.cf
// (isolate's `first_uid` and `num_boxes`) — iptables owner-match and sandbox UID
// assignment both rely on the same contiguous range.
const FIRST_BOX_UID = 60000
const NUM_BOXES = 1000
const WS_RPC_BASE_PORT = 52000

export const sandboxCapacity = {
    firstBoxUid: FIRST_BOX_UID,
    numBoxes: NUM_BOXES,
    wsRpcBasePort: WS_RPC_BASE_PORT,
    // boxIds are assigned 1..NUM_BOXES (see worker.ts), so the live port range is
    // WS_RPC_BASE_PORT+1 .. WS_RPC_BASE_PORT+NUM_BOXES. Using a 0-indexed range here
    // left the last box's port outside the iptables ACCEPT range in STRICT mode.
    wsRpcPortForBox: (boxId: number): number => WS_RPC_BASE_PORT + boxId,
    wsRpcPortRange: { first: WS_RPC_BASE_PORT + 1, last: WS_RPC_BASE_PORT + NUM_BOXES },
}
