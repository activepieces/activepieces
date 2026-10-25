---
title: Pre-publish verification runs in the main chat, not a task
status: accepted
icon: ✅
---

# Pre-publish verification runs in the main chat, not a task

## Decision

The test-before-going-live check runs in the main chat. Tasks (`ap_run_task`) never test, publish or turn on a flow: `ap_test_flow`, `ap_test_step`, `ap_lock_and_publish` and `ap_change_flow_status` are left out of their tools. A task's check is validation, and it hands the flow back to the main chat to test and turn on.

## Context

000046 planned a separate verifier sub-agent, and 000048 made tasks general runners with the main chat's tools. That left open where the live test belongs. Decided 13 Oct on AI-5.

## Why

A live test can write real data, so it needs the user's approval, and `ap_test_flow` already shows that approval card in the main chat (`wrapTestFlowGate`). What comes after the test is a conversation: read the result, fix or ask, then "Turn it on?". Tasks can't ask the user questions, so a task that tests would hand the result straight back anyway. We rejected a verifier task for that reason: it adds a hop for a check that's one tool call in the main chat.

## Consequences

Each "Turn it on?" and every live test result shows up in the main conversation, so its context grows a little. Giving tasks test or publish tools later means moving the approval card and the write-check gate along with them.

