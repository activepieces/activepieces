# SimplyBook.me Piece for Activepieces

This Piece provides integration with SimplyBook.me, an online appointment & scheduling platform. It enables Activepieces workflows to respond to scheduling events and manage related objects like clients, offers, and invoices.

## Features

### Triggers
- **New Booking** - Fires when a new booking is created
- **Booking Change** - Fires when booking details change (date, time, service, provider, status, intake form answers)
- **Booking Cancellation** - Fires when a booking is canceled
- **New Client** - Fires when a new client is added (via booking or manually)
- **New Offer** - Fires when a new offer (proposal or quote) is created
- **New Invoice** - Fires when a new invoice is generated/paid (with Accept Payments feature)

### Actions

#### Write Actions
- **Cancel a Booking** - Cancel an existing booking
- **Create a Booking** - Create a new booking with required booking parameters
- **Create a Booking's Comment** - Add a comment or note to a booking
- **Create a Client** - Create a new client record
- **Create a Detailed Report** - Generate a detailed report (metrics, bookings, revenue)
- **Create a Note** - Create a note (generic) in the system
- **Delete a Client** - Delete an existing client

#### Search/Read Actions
- **Find Booking** - Find bookings based on search criteria
- **Find Client** - Find clients based on search criteria
- **Find Invoice** - Find invoices based on search criteria

## Setup

1. Sign up for a free account at [SimplyBook.me](https://simplybook.me/en/)
2. In your admin panel, go to 'Custom Features' and enable the 'API' feature
3. Copy your Company Login and API Key from the API settings
4. Use these credentials when configuring the SimplyBook.me Piece in Activepieces

## API Reference

- [SimplyBook.me API Documentation](https://simplybook.net/en/api/developer-api)

## Test Account Access

You can sign up for free at https://simplybook.me/en/ to test the integration.
