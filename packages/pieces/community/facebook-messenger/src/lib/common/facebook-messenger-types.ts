/**
 * Facebook Messenger webhook payload structure definitions
 */

export interface FacebookWebhookPayload {
    object: string;  // Always 'page' for Messenger webhooks
    entry: Entry[];
  }
  
  export interface Entry {
    id: string;     // Page ID
    time: number;   // Unix timestamp when the event was sent
    messaging: MessagingEvent[];
  }
  
  export interface MessagingEvent {
    sender: {
      id: string;   // PSID (Page-Scoped User ID) of the user who sent the message
    };
    recipient: {
      id: string;   // Page ID that received the message
    };
    timestamp: number;  // Unix timestamp when the message was sent
    message?: Message;  // Present when user sends a message
    postback?: Postback; // Present when user clicks a postback button
    delivery?: Delivery; // Present for message delivery receipts
    read?: Read;        // Present when the user reads a message
  }
  
  export interface Message {
    mid: string;    // Message ID
    text?: string;  // Text content (if text message)
    attachments?: Attachment[]; // Present if message contains attachments
    quick_reply?: QuickReply;   // Present if message is a response to quick reply
  }
  
  export interface Attachment {
    type: string;   // Type like 'image', 'video', 'audio', 'file', or 'location'
    payload: {
      url?: string; // URL to media (for image, video, audio, file)
      coordinates?: {  // For location attachments
        lat: number;
        long: number;
      };
      // Other payload properties depending on type
    };
  }
  
  export interface QuickReply {
    payload: string;  // Developer-defined payload string
  }
  
  export interface Postback {
    title: string;    // Button text
    payload: string;  // Developer-defined payload string
    referral?: any;   // Optional referral info
  }
  
  export interface Delivery {
    mids: string[];   // Array of message IDs
    watermark: number; // All messages before this timestamp were delivered
  }
  
  export interface Read {
    watermark: number; // All messages before this timestamp were read
  }
