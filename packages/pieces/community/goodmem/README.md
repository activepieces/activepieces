# GoodMem Piece

Store documents as memories with vector embeddings and perform similarity-based semantic retrieval using GoodMem.

## Prerequisites

### 1. Install GoodMem

You need a running GoodMem instance. Install it on your VM or local machine:

**Visit:** [https://goodmem.ai/](https://goodmem.ai/)

### 2. Create an Embedder

Before creating spaces, set up an embedder model in GoodMem. The embedder will appear in the dropdown when creating a space.

### 3. Get Your API Key

After installing GoodMem you can find the API key inside `config.json`.

## Authentication

- **Base URL**: Your GoodMem instance URL (e.g., `http://localhost:8080`)
- **API Key**: Your GoodMem API key (starts with `gm_`)

## Available Actions

- **Create Space** — Create a new space with an embedder (dropdown) and optional advanced chunking options (chunk size, overlap, separator strategy, length measurement). Reuses existing spaces by name.
- **Create Memory** — Store a document or text as a memory in a space (dropdown). Supports metadata fields (source, author, tags) and file uploads.
- **Retrieve Memories** — Semantic search across one or more spaces (multi-select dropdown). Optional post-processing with Reranker (dropdown) and LLM (dropdown), plus Relevance Threshold, LLM Temperature, Max Results, and Chronological Resort.
- **Get Memory** — Retrieve a specific memory by ID with optional full content.
- **Delete Memory** — Permanently delete a memory from a space.
