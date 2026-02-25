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
After installing Goodmem you can find the API key inside config.json.

## Authentication

This piece uses Custom Authentication:

- **Base URL**: The base URL of your Goodmem instance (e.g., `http://localhost:8080`, `https://api.goodmem.ai`)
- **API Key**: Your Goodmem API key (starts with `gm_`)

## Available Actions

### Space Management

#### Create Space
Create a new space (container for memories). Spaces organize your memories by topic, project, or use case.

#### List Spaces
Retrieve all spaces in your account with their configurations and metadata.

#### Get Space
Fetch details for a specific space including embedders, labels, and settings.

#### Update Space
Modify a space's name, public read access, or labels. You can either replace all labels or merge new ones with existing labels.

#### Delete Space
Permanently delete a space and all its memories.

#### Create Memory
Store a document or text as a memory in a space. The content is automatically chunked and embedded for semantic search.

#### Retrieve Memories (Semantic Search)
Perform similarity-based retrieval across one or more spaces. This is the core feature for RAG (Retrieval Augmented Generation) applications.

#### List Memories
List all memories in a space with filtering and sorting options.

#### Get Memory
Retrieve a specific memory by ID with optional full content.

#### Delete Memory
Permanently delete a memory and all its chunks from a space.

#### List Embedders
Retrieve all available embedders with their configurations, supported modalities, and dimensions.


