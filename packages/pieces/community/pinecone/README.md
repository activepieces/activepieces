# Pinecone

Pinecone is a vector database for machine learning applications that makes it easy to build high-performance vector search applications. This piece provides comprehensive actions to interact with the Pinecone API, allowing you to manage indexes, vectors, and perform similarity searches.

## Authentication

This piece requires a Pinecone API key. To obtain your API key:

1. Log in to your [Pinecone account](https://pinecone.io/)
2. Go to your dashboard
3. Navigate to "API Keys" section
4. Copy your API key

You can sign up for a free Pinecone account to test this integration.

## Actions

### Index Management

#### Create Index
Create a new Pinecone index with specified dimensions and configuration.

**Parameters:**
- `Index Name` (required): Unique name for the index (max 45 characters)
- `Dimension` (required): Number of dimensions in vectors (1-40,000)
- `Distance Metric` (required): Similarity metric (cosine, euclidean, dotproduct)
- `Number of Pods` (optional): Number of pods for performance scaling
- `Number of Replicas` (optional): Number of replicas for availability
- `Pod Type` (optional): Type of pods to use (p1.x1, p1.x2, etc.)

**Example:**
```json
{
  "name": "my-embeddings-index",
  "dimension": 1536,
  "metric": "cosine",
  "pods": 1,
  "replicas": 1,
  "podType": "p1.x1"
}
```

#### Get Index Statistics
Retrieve comprehensive statistics about an index including vector count, namespaces, and storage usage.

**Parameters:**
- `Index Name` (required): Name of the index to query
- `Metadata Filter` (optional): Filter statistics by metadata conditions

### Vector Operations

#### Upsert Vector
Insert new vectors or update existing ones in an index. This is the primary way to add data to your index.

**Parameters:**
- `Index Name` (required): Target index name
- `Vectors` (required): Array of vector objects with id, values, and metadata
- `Namespace` (optional): Logical partition within the index

**Example Vectors:**
```json
[
  {
    "id": "vector-1",
    "values": [0.1, 0.2, 0.3, ...],
    "metadata": {
      "category": "product",
      "title": "Example Product"
    }
  },
  {
    "id": "vector-2", 
    "values": [0.4, 0.5, 0.6, ...],
    "metadata": {
      "category": "article",
      "title": "Example Article"
    }
  }
]
```

#### Get Vector
Retrieve a specific vector by its ID.

**Parameters:**
- `Index Name` (required): Source index name
- `Vector ID` (required): Unique identifier of the vector
- `Namespace` (optional): Namespace containing the vector

#### Update Vector
Update an existing vector's values or metadata.

**Parameters:**
- `Index Name` (required): Target index name
- `Vector ID` (required): ID of vector to update
- `Vector Values` (optional): New vector values array
- `Metadata` (optional): New metadata object
- `Namespace` (optional): Namespace containing the vector

#### Delete Vector
Remove one or more vectors from an index.

**Parameters:**
- `Index Name` (required): Target index name
- `Vector IDs` (required): Single ID or array of IDs to delete
- `Namespace` (optional): Namespace containing the vectors

### Search Operations

#### Search Vectors
Find vectors similar to a query vector using semantic search.

**Parameters:**
- `Index Name` (required): Index to search in
- `Query Vector` (required): Vector to find similar matches for
- `Top K Results` (optional): Number of results to return (default: 10)
- `Include Vector Values` (optional): Include actual vector values in response
- `Include Metadata` (optional): Include metadata in response (default: true)
- `Metadata Filter` (optional): Filter results by metadata conditions
- `Namespace` (optional): Namespace to search in

**Example Query Vector:**
```json
[0.1, 0.2, 0.3, 0.4, 0.5, ...]
```

**Example Metadata Filter:**
```json
{
  "category": {"$eq": "product"},
  "price": {"$gte": 10, "$lt": 100}
}
```

## Common Use Cases

### 1. Semantic Search
Build powerful search experiences that understand meaning rather than just keywords.

### 2. Recommendation Systems
Find similar products, content, or users based on vector similarity.

### 3. Retrieval-Augmented Generation (RAG)
Enhance AI applications by retrieving relevant context for language models.

### 4. Content Moderation
Detect similar or duplicate content by comparing embeddings.

### 5. Personalization
Create personalized experiences based on user behavior embeddings.

## Best Practices

### Vector Preparation
- Ensure all vectors in an index have the same dimensions
- Normalize vectors when using cosine similarity
- Use consistent embedding models for related vectors

### Index Configuration
- Choose dimensions based on your embedding model
- Select the appropriate distance metric for your use case:
  - **Cosine**: Good for text embeddings and when vector magnitude doesn't matter
  - **Euclidean**: Good when absolute distances matter
  - **Dot Product**: Good for pre-normalized vectors

### Performance Optimization
- Use namespaces to logically separate different data types
- Batch upsert operations when inserting many vectors
- Consider pod type and replicas based on your performance needs

### Metadata Usage
- Keep metadata lightweight for better performance
- Use metadata filters to narrow search results
- Structure metadata consistently across vectors

## Error Handling

The piece includes comprehensive error handling for common scenarios:
- Invalid API keys
- Index not found or not ready
- Dimension mismatches
- Rate limiting
- Network connectivity issues

All actions return structured responses with success indicators and detailed error messages.

## Requirements

- Pinecone API key
- Internet connectivity
- Vectors must match index dimensions
- Valid JSON format for metadata and filters

## Support

For issues specific to this piece, please refer to the Activepieces documentation. For Pinecone-specific questions, consult the [Pinecone documentation](https://docs.pinecone.io/).