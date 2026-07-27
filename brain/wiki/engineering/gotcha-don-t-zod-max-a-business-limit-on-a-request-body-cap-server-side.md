---
icon: ✂️
---

# Gotcha: don't zod .max() a business limit on a request body — cap server-side

A `.max()` on a request-body field (list length, string length) rejects the **whole** request with a 400 the moment a user crosses it. For a limit a user can legitimately reach — e.g. editing a list that hits 50 items, or a preferences blob that gets long — that means their entire save is thrown away and they lose their edits. The limit should just *apply*, not blow up the request.

Rule: reserve `.max()` for a true trust-boundary DoS/payload guard (and Fastify's global body limit already covers gross abuse). For business limits, accept the input and cap it gracefully server-side (`slice(0, MAX)` on the string / array in the service layer), so the write always succeeds with the limit quietly enforced.

Surfaced 2026-07 on the chat memory endpoints (`POST /v1/chat/memory`): the request schema had `.max(50)`/`.max(280)`; the save helper already `slice`d to the same caps, so the `.max()` was both redundant and a data-loss bug. Removed it; kept the graceful server-side cap.
