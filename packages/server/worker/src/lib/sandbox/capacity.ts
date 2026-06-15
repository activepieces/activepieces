// firstBoxUid / numBoxes must match packages/server/api/src/assets/default.cf
// (isolate's `first_uid` and `num_boxes`) — sandbox UID assignment relies on the
// same contiguous range.
const FIRST_BOX_UID = 60000
const NUM_BOXES = 1000
const WS_RPC_BASE_PORT = 52000

export const sandboxCapacity = {
    firstBoxUid: FIRST_BOX_UID,
    numBoxes: NUM_BOXES,
    wsRpcBasePort: WS_RPC_BASE_PORT,
    // boxIds are assigned 1..NUM_BOXES (see worker.ts), so each box gets a stable
    // per-box WS-RPC port WS_RPC_BASE_PORT+boxId.
    wsRpcPortForBox: (boxId: number): number => WS_RPC_BASE_PORT + boxId,
}
