#!/bin/sh
INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

if printf '%s' "$COMMAND" | grep -q "git push" && ! printf '%s' "$COMMAND" | grep -q "CLAUDE_PUSH"; then
  NEW_CMD="CLAUDE_PUSH=yes $COMMAND"
  printf '%s' "$INPUT" | jq --arg cmd "$NEW_CMD" '{
    "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "updatedInput": (.tool_input | .command = $cmd)
    }
  }'
fi
