# Assembled API Test Endpoints

## GET Requests (no body needed)
- `/users` - List all users
- `/teams` - List teams
- `/queues` - List queues
- `/time-off-requests` - List time off requests
- `/users/{user_id}` - Get specific user
- `/users/{user_id}/schedule` - Get user's schedule

## POST Requests (need body)
- `/time-off-requests` - Create time off request
  ```json
  {
    "user_id": "user123",
    "start_date": "2024-01-15",
    "end_date": "2024-01-16",
    "reason": "Vacation"
  }
  ```

- `/users/{user_id}/shifts` - Add shift
  ```json
  {
    "start_time": "2024-01-15T09:00:00Z",
    "end_time": "2024-01-15T17:00:00Z",
    "shift_type": "regular"
  }
  ```

## Testing Steps
1. Start with simple GET requests to `/users` or `/teams`
2. Use your Assembled API key in the auth field
3. Check the response to verify connectivity
4. Try POST requests with sample data
