# Mockify Piece

Create dynamic mock API endpoints and simulate backend responses for testing and workflow validation in Activepieces.

## Features

- **Custom Response Templates**: Define JSON responses with dynamic data.
- **HTTP Status Codes**: Simulate various success and error states (200, 400, 500, etc.).
- **Latency Simulation**: Add artificial delays to test frontend timeout handling.
- **Header Control**: (In development) Set custom response headers.

## How to Use

1. **Add Step**: In your Activepieces workflow, add a new step and search for the **Mockify** piece.
2. **Configure Action**: Select the **Mock API** action.
3. **Set Response**:
   - **Endpoint**: Enter a descriptive name (e.g., `/user-details`).
   - **Response Template**: Provide the JSON you want to simulate (e.g., `{"id": 1, "name": "John Doe"}`).
   - **Status Code**: Set to `200` for success or `404`/`500` for error testing.
4. **Test & Map**: Run a test to see the output. You can now use the simulated data in any subsequent step by mapping the output variables.

### Using the Trigger
1. **Select Trigger**: Choose **Mockify** as the trigger piece in your workflow.
2. **Configure Route**: Set the **Path** you want to listen on.
3. **Capture Data**: Any request sent to your Activepieces webhook URL with this path will now start the workflow with the request data.

## Triggers

### Mock Request Received
Starts your workflow whenever a request is made to your mock endpoint.
- **Path**: The relative path to listen on (e.g., `/my-webhook`).
- **Output**: Returns the `body`, `headers`, and `queryParams` of the incoming request.

### New Request Log
Triggers periodically to provide a summary of recent mock activity.
- **Limit Items**: Maximum number of log entries to retrieve (default: 10).

## Actions

### Mock API Action
Return a simulated API response with custom status and delay.
- **Endpoint Path**: The path of the simulated endpoint (e.g., `/users`).
- **Response Template**: The JSON body to return in the response.
- **Status Code**: The HTTP status code to return (e.g., `200`, `404`).
- **Delay (ms)**: Optional delay before returning the response (0-5000ms).

## Example Use Case

**Scenario**: You are building a frontend that needs to display a list of products, but the backend isn't ready.

1. **Configure Mockify**:
   - **Response Template**:
     ```json
     [
       { "id": 1, "name": "Wireless Mouse", "price": 29.99 },
       { "id": 2, "name": "Mechanical Keyboard", "price": 89.00 }
     ]
     ```
   - **Status Code**: `200`
2. **Result**: Your workflow now provides this JSON array. You can map it to an **HTTP Redirect** or a **Frontend Component** as if it came from a real server.

**Scenario 2: Automated Webhook Processing (Trigger)**
1. **Configure Mockify Trigger**:
   - **Path**: `/orders/new`
2. **Integration**: Send a POST request from your store to `https://activepieces.com/webhooks/.../orders/new`.
3. **Result**: The Activepieces workflow starts automatically with the order data in the trigger payload.

## Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Tests**:
   ```bash
   npm test
   ```

---
**Created by Abanoub Gerges Azer**
