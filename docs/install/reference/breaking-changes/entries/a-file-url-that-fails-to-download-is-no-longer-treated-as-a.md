---
id: a-file-url-that-fails-to-download-is-no-longer-treated-as-a
title: "A file URL that fails to download is no longer treated as a file"
added: '2026-09-01'
release: 0.90.0
---

Any piece property that takes a file also accepts a URL, and the engine buffered whatever came back from that URL without checking the response status. A 4xx or 5xx produced a file named after the URL whose contents were the server's error page, and a piece could not tell that apart from the real thing — an expired signed link became an email with the storage provider's XML error attached. A failed download now fails the step, which is what the streaming path already did.

#### What you need to do

Nothing to configure. A flow that was silently passing on error pages will start failing at that step instead, and the fix is the URL itself — usually a link that has expired or that the instance is not authorized to read.
