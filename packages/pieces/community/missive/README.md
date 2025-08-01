# Missive

This piece enables you to integrate with Missive's API to manage contacts, conversations, messages, and more.

## Authentication

This piece uses OAuth2 authentication. You'll need to create an application in your Missive account to get the required credentials.

## Actions

- Create Contact - Add a new contact within a specified contact book
- Update Contact - Modify fields for an existing contact by ID
- Create Draft/Post - Create a draft message or post in Missive, with option to send
- Create Task - Create a task associated with a conversation
- Find Contact - Search for a contact by email, name, or contact book
- Custom API Call - Make custom API calls to the Missive API

## Triggers

- New Message - Fires when a new message (email, SMS, chat) is received
- New Comment - Fires when a comment is added to an existing conversation
- New Contact Book - Fires when a new contact book is created in Missive
- New Contact Group - Fires when a new contact group is created within a contact book
- New Contact - Fires when a new contact is added to a contact book

## API Reference

- [Missive API Documentation](https://learn.missiveapp.com/api-documentation/rest-endpoints)
