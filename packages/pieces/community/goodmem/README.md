# Goodmem Piece

This piece provides a complete integration with Goodmem, a powerful vector-based memory storage and semantic retrieval system for AI applications. Store documents as memories with vector embeddings and perform similarity-based semantic search across your data.

## Prerequisites

### 1. Install Goodmem

You need a running Goodmem instance. Install it on your VM or local machine:

**Visit:** [https://goodmem.ai/](https://goodmem.ai/)

Follow the installation instructions for your platform (Docker, local installation, or cloud deployment).

### 2. Create an Embedder

Before you can create spaces and memories, you need to set up an embedder model:

### 3. Get Your API Key

## Authentication

This piece uses Custom Authentication:

- **Base URL**: The base URL of your Goodmem instance (e.g., `http://localhost:8080`, `https://api.goodmem.ai`)
- **API Key**: Your Goodmem API key (starts with `gm_`)

## Available Actions

### Create Space
Create a new space (container for memories) with configurable settings. If a space with the same name already exists, it will be reused instead of creating a duplicate.

**Options:**
- **Space Name** (required) — Unique name for the space
- **Embedder** (required, dropdown) — Select from available embedder models that convert text to vector embeddings
- **Advanced Chunking Options** (optional, collapsible) — Fine-tune how documents are split into chunks:
  - **Chunk Size** (default: 256) — Number of characters/tokens per chunk
  - **Chunk Overlap** (default: 25) — Overlapping characters between consecutive chunks
  - **Keep Separator Strategy** (default: Keep at End) — Where to attach separators when splitting (Keep at End, Keep at Start, or Discard)
  - **Length Measurement** (default: Character Count) — How chunk size is measured (Character Count or Token Count)

### Create Memory
Store a document or plain text as a memory in a space. The content is automatically chunked and embedded for semantic search.

**Options:**
- **Space** (required, dropdown) — Select the space to store the memory in
- **File** (optional) — Upload a file (PDF, DOCX, TXT, images, etc.). Content type is auto-detected.
- **Text Content** (optional) — Plain text content. If both file and text are provided, file takes priority.
- **Source** (optional) — Where this memory came from (e.g., "google-drive", "gmail")
- **Author** (optional) — The author or creator of the content
- **Tags** (optional) — Comma-separated tags for categorization (e.g., "legal,research,important")
- **Additional Metadata** (optional) — Extra key-value metadata as JSON

### Retrieve Memories
Perform semantic search across one or more spaces to find relevant memory chunks. Supports advanced post-processing with reranking and LLM-generated contextual responses.

**Options:**
- **Query** (required) — Natural language search query
- **Spaces** (required, multi-select dropdown) — Select one or more spaces to search across
- **Maximum Results** (default: 5) — Limit the number of returned memories
- **Include Memory Definition** (default: true) — Fetch full memory metadata alongside matched chunks
- **Wait for Indexing** (default: true) — Retry for up to 60 seconds when no results found (useful when memories were just added)

**Advanced Post-Processing:**
- **Reranker** (optional, dropdown) — Select a reranker model to improve result ordering
- **LLM** (optional, dropdown) — Select an LLM to generate contextual responses alongside retrieved chunks
- **Relevance Threshold** (optional) — Minimum score (0-1) for including results. Used with Reranker or LLM.
- **LLM Temperature** (optional) — Creativity setting for LLM generation (0-2). Used when LLM is selected.
- **Chronological Resort** (default: false) — Reorder results by creation time instead of relevance score

### Get Memory
Retrieve a specific memory by its ID, including metadata, processing status, and optionally the original content.

**Options:**
- **Memory ID** (required) — The UUID of the memory to fetch
- **Include Content** (default: true) — Fetch the original document content in addition to metadata

### Delete Memory
Permanently delete a memory and all its associated chunks and vector embeddings.

**Options:**
- **Memory ID** (required) — The UUID of the memory to delete


