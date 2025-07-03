# Fillout Forms

A simple integration piece for Fillout forms that allows you to receive form submissions and retrieve form data.

## Features

- **Trigger**: New Form Response - triggers when a form receives a new submission
- **Actions**:
  - Get Form Responses - retrieve all responses for a form
  - Get Single Response - get a specific submission by ID
  - Find Form by Title - search for forms by name

## Setup

1. Get your API key from your Fillout account (Settings > Developer)
2. Add it to the authentication field
3. Configure your forms and start automating!

## Usage

### Setting up the trigger
1. Create a flow with the "New Form Response" trigger
2. Enter your Form ID
3. Copy the webhook URL provided
4. Add this webhook URL to your Fillout form settings

### Using the actions
- Use "Find Form by Title" to discover form IDs by searching form names
- Use "Get Form Responses" to retrieve all submissions for a form
- Use "Get Single Response" to get details of a specific submission

## Requirements

- A Fillout account with API access
- Form ID(s) for the forms you want to work with

That's it! This piece follows standard Activepieces patterns and should be easy to understand and extend.