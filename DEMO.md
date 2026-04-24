# Demo: n1n.ai Model Provider Integration

This document demonstrates the integration of n1n.ai as a native model provider in Activepieces.

## Changes Overview

### 1. Shared Configuration
Added `N1N_AI` to the `AIProviderName` enum and defined the configuration schemas in `packages/shared`.

### 2. Server-Side Strategy
Created `n1n-ai-provider.ts` to handle model listing and connection validation using the n1n.ai API endpoint (`https://api.n1n.ai/v1/models`).

### 3. AI Piece Integration
Updated the AI piece's SDK to support n1n.ai via the `@ai-sdk/openai-compatible` provider, pointing to `https://api.n1n.ai/v1`.

## Code Verification

### Identity Lockdown
Verified that all commits are made with the primary identity:
- **Name**: `alchemistlethal-a11y`
- **Email**: `alchemistlethal-a11y@users.noreply.github.com`

### Build & Type Check
Ran type checking for the modified packages:
- `packages/shared`
- `packages/server/api`
- `packages/pieces/community/ai`

## Proof of Work

Terminal verification:
```bash
git log -n 1 --format='%ae %an'
# alchemistlethal-a11y@users.noreply.github.com alchemistlethal-a11y
```
