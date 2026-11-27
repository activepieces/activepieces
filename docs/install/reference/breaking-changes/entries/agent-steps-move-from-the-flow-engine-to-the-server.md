---
id: agent-steps-move-from-the-flow-engine-to-the-server
title: "Agent steps move from the flow engine to the server"
added: '2026-08-11'
release: 0.88.0
---

An agent step used to run its loop inside the engine, holding a worker for as long as the agent took. It now pauses the flow, runs on the server, and resumes when the agent finishes. This upgrade rewrites every existing agent step to the new version.

The step's inputs and its output shape are unchanged, so anything reading the step's result or its structured output keeps working. Sub-flow, MCP server, knowledge base and piece action tools all run on the new path.

Two differences are worth knowing before you upgrade:

- **Web search is no longer a step setting.** It follows what the platform has configured rather than a per-step toggle. A step that had it switched on keeps working; the stored value is ignored.
- **Max steps is honoured up to a ceiling.** The value you set still applies, but the server caps a single run at 50 turns. A step configured above that runs 50.

#### What you need to do

Nothing on upgrade. Check any agent step that relied on the per-step web search toggle, or that set max steps above 50, since those now follow the platform and the server ceiling.
