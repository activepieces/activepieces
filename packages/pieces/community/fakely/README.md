# Fakely Piece

Generate realistic fake and dummy data for testing and simulation in Activepieces workflows.

## Features

- **Multi-Field Generation**: Create an array of fake objects with specific fields like `first_name`, `last_name`, `email`, etc.
- **Custom Templates**: Define a JSON template using `@faker-js/faker` syntax for tailored data structures.
- **Locale Support**: (In development) Generate data for specific regions and languages.
- **Batch Generation**: Single run can produce multiple records for stress testing or database seeding.

## How to Use

1. **Add Step**: In your Activepieces workflow, add a new step and search for the **Fakely** piece.
2. **Configure Action**: Select the **Generate Fake Data** action.
3. **Define Output**:
   - **Fields**: Select the types of data you need (e.g., `first_name`, `email`, `company_name`).
   - **Count**: Specify how many records you want to generate.
4. **Advanced Templates**: Use the **Template** field to create deeply nested JSON objects if needed (e.g., `{"user": {"email": "{{internet.email}}"}}`).
5. **Map Output**: The action returns an array of objects. You can use these in a **Loop** step or map them directly to other actions.

### Using the Trigger
1. **Select Trigger**: Choose **Fakely** as the trigger piece in your workflow.
2. **Configure Polling**: Select the **New Fake Data Batch** trigger.
3. **Set Constraints**: Define the **Fields** and **Count** of records to generate on each interval.
4. **Automate**: The workflow will now automatically start on a schedule, providing freshly generated data.

## Triggers

### New Fake Data Batch
Triggers periodically to provide a new batch of fake data.
- **Fields**: List of fields to generate.
- **Count**: Number of records to generate per interval.

## Actions

### Generate Fake Data
Produces an array of objects populated with fake data.
- **Fields**: List of fields to generate (e.g., name, internet, person).
- **Count**: Number of records to generate.
- **Template**: Optional JSON template for advanced mappings.

## Example Use Case

**Scenario**: You need to seed a test database with 100 fake users, each having a unique email and a profile picture.

1. **Configure Fakely**:
   - **Fields**: Leave empty (to use a template).
   - **Count**: `100`
   - **Template**:
     ```json
     {
       "id": "{{string.uuid}}",
       "fullName": "{{person.fullName}}",
       "email": "{{internet.email}}",
       "avatar": "{{image.avatar}}"
     }
     ```
2. **Result**: Fakely will output an array of 100 objects matching this structure. You can then connect this to a **Database** or **Spreadsheet** step to save the records.

**Scenario 2: Periodic CRM Sync (Trigger)**
1. **Configure Fakely Trigger**:
   - **Fields**: `first_name`, `last_name`, `email`
   - **Count**: `10`
2. **Automation**: Set the polling interval (e.g., every hour).
3. **Result**: Every hour, your workflow starts with 10 new fake leads, which you can push to your CRM for load testing.

## Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Tests**:
   ```bash
   npm test
   ```
