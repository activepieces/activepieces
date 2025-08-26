/**
 * Mailchimp Piece Demo Script
 * 
 * This script demonstrates how to use the new Mailchimp triggers, actions, and search functions
 * in an Activepieces workflow. This is for demonstration purposes only.
 */

// Example workflow configurations using the new Mailchimp functionality

const mailchimpWorkflowExamples = {
  
  // 1. Campaign Management Workflow
  campaignWorkflow: {
    name: "Automated Campaign Management",
    description: "Create campaigns, monitor performance, and manage subscribers",
    steps: [
      {
        name: "create_campaign",
        type: "action",
        settings: {
          type: "regular",
          list_id: "{{audience_id}}",
          subject_line: "Welcome to Our Newsletter - {{current_date}}",
          title: "Welcome Campaign {{current_date}}",
          from_name: "Your Company",
          reply_to: "noreply@yourcompany.com",
          html_content: `
            <h1>Welcome to Our Newsletter!</h1>
            <p>Thank you for subscribing. We're excited to share our latest updates with you.</p>
            <p>Best regards,<br>The Team</p>
          `,
          text_content: "Welcome to Our Newsletter! Thank you for subscribing. We're excited to share our latest updates with you. Best regards, The Team"
        }
      },
      {
        name: "get_campaign_report",
        type: "action",
        settings: {
          campaign_id: "{{steps.create_campaign.output.id}}"
        },
        delay: "24h" // Wait 24 hours after campaign creation
      }
    ]
  },

  // 2. Subscriber Management Workflow
  subscriberWorkflow: {
    name: "Advanced Subscriber Management",
    description: "Automatically manage subscribers based on various triggers",
    steps: [
      {
        name: "new_subscriber_trigger",
        type: "trigger",
        trigger_type: "new_or_updated_subscriber",
        settings: {
          list_id: "{{audience_id}}"
        }
      },
      {
        name: "add_welcome_tag",
        type: "action",
        action_type: "add_or_update_subscriber",
        settings: {
          list_id: "{{trigger.data.list_id}}",
          email: "{{trigger.data.email}}",
          status: "subscribed",
          tags: ["Welcome", "New Subscriber"]
        }
      },
      {
        name: "find_subscriber_details",
        type: "action",
        action_type: "find_subscriber",
        settings: {
          list_id: "{{trigger.data.list_id}}",
          email: "{{trigger.data.email}}"
        }
      }
    ]
  },

  // 3. E-commerce Integration Workflow
  ecommerceWorkflow: {
    name: "E-commerce Customer Tracking",
    description: "Track new customers and orders from connected stores",
    steps: [
      {
        name: "new_customer_trigger",
        type: "trigger",
        trigger_type: "new_customer",
        settings: {
          store_id: "{{store_id}}"
        }
      },
      {
        name: "add_customer_to_audience",
        type: "action",
        action_type: "add_or_update_subscriber",
        settings: {
          list_id: "{{customer_audience_id}}",
          email: "{{trigger.email_address}}",
          status: "subscribed",
          first_name: "{{trigger.first_name}}",
          last_name: "{{trigger.last_name}}",
          tags: ["Customer", "E-commerce"]
        }
      },
      {
        name: "new_order_trigger",
        type: "trigger",
        trigger_type: "new_order",
        settings: {
          store_id: "{{store_id}}"
        }
      },
      {
        name: "tag_high_value_customer",
        type: "action",
        action_type: "add_or_update_subscriber",
        condition: "{{trigger.order_total > 100}}",
        settings: {
          list_id: "{{customer_audience_id}}",
          email: "{{trigger.customer.email_address}}",
          status: "subscribed",
          tags: ["High Value Customer", "VIP"]
        }
      }
    ]
  },

  // 4. Campaign Performance Monitoring
  performanceMonitoring: {
    name: "Campaign Performance Tracking",
    description: "Monitor campaign opens, clicks, and engagement",
    steps: [
      {
        name: "email_opened_trigger",
        type: "trigger",
        trigger_type: "email_opened",
        settings: {
          campaign_id: "{{campaign_id}}"
        }
      },
      {
        name: "tag_engaged_subscriber",
        type: "action",
        action_type: "add_or_update_subscriber",
        settings: {
          list_id: "{{audience_id}}",
          email: "{{trigger.email_address}}",
          status: "subscribed",
          tags: ["Engaged", "Email Opener"]
        }
      },
      {
        name: "link_clicked_trigger",
        type: "trigger",
        trigger_type: "link_clicked",
        settings: {
          campaign_id: "{{campaign_id}}"
        }
      },
      {
        name: "tag_highly_engaged",
        type: "action",
        action_type: "add_or_update_subscriber",
        settings: {
          list_id: "{{audience_id}}",
          email: "{{trigger.email_address}}",
          status: "subscribed",
          tags: ["Highly Engaged", "Link Clicker", "VIP"]
        }
      }
    ]
  },

  // 5. Audience Segmentation Workflow
  segmentationWorkflow: {
    name: "Dynamic Audience Segmentation",
    description: "Automatically segment subscribers based on behavior and tags",
    steps: [
      {
        name: "segment_tag_trigger",
        type: "trigger",
        trigger_type: "new_segment_tag_subscriber",
        settings: {
          list_id: "{{audience_id}}",
          tag_name: "VIP"
        }
      },
      {
        name: "create_vip_campaign",
        type: "action",
        action_type: "create_campaign",
        settings: {
          type: "regular",
          list_id: "{{audience_id}}",
          subject_line: "Exclusive VIP Offer - Just for You!",
          title: "VIP Exclusive Campaign",
          from_name: "VIP Team",
          reply_to: "vip@yourcompany.com",
          html_content: `
            <h1>Exclusive VIP Offer!</h1>
            <p>As one of our valued VIP customers, you get early access to our latest products.</p>
            <p>Use code VIP20 for 20% off your next purchase.</p>
          `
        }
      }
    ]
  },

  // 6. Search and Data Management
  dataManagement: {
    name: "Data Management and Search",
    description: "Find and manage campaigns, customers, and subscribers",
    steps: [
      {
        name: "find_recent_campaigns",
        type: "action",
        action_type: "find_campaign",
        settings: {
          status: "sent",
          count: 10
        }
      },
      {
        name: "find_vip_customers",
        type: "action",
        action_type: "find_customer",
        settings: {
          store_id: "{{store_id}}"
        }
      },
      {
        name: "find_vip_tags",
        type: "action",
        action_type: "find_tag",
        settings: {
          list_id: "{{audience_id}}",
          tag_name: "VIP"
        }
      },
      {
        name: "cleanup_unengaged",
        type: "action",
        action_type: "archive_subscriber",
        condition: "{{subscriber.stats.avg_open_rate < 0.05}}",
        settings: {
          list_id: "{{audience_id}}",
          email: "{{subscriber.email_address}}"
        }
      }
    ]
  }
};

// Utility functions for common operations
const mailchimpUtils = {
  
  // Create a new audience with standard settings
  createStandardAudience: (name, companyInfo) => ({
    name: name,
    contact_company: companyInfo.company,
    contact_address1: companyInfo.address,
    contact_city: companyInfo.city,
    contact_state: companyInfo.state,
    contact_zip: companyInfo.zip,
    contact_country: companyInfo.country,
    permission_reminder: "You subscribed to our newsletter on our website.",
    campaign_defaults_from_name: companyInfo.company,
    campaign_defaults_from_email: companyInfo.email,
    campaign_defaults_subject: `Newsletter from ${companyInfo.company}`,
    campaign_defaults_language: "en",
    email_type_option: true
  }),

  // Standard welcome campaign template
  createWelcomeCampaign: (listId, companyName) => ({
    type: "regular",
    list_id: listId,
    subject_line: `Welcome to ${companyName}!`,
    title: "Welcome Campaign",
    from_name: companyName,
    reply_to: "welcome@yourcompany.com",
    html_content: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Welcome to ${companyName}!</h1>
        <p>Thank you for subscribing to our newsletter. We're excited to have you join our community!</p>
        <p>Here's what you can expect from us:</p>
        <ul>
          <li>Weekly updates on our latest products and services</li>
          <li>Exclusive offers and discounts</li>
          <li>Industry insights and tips</li>
        </ul>
        <p>Best regards,<br>The ${companyName} Team</p>
      </div>
    `,
    text_content: `Welcome to ${companyName}! Thank you for subscribing to our newsletter. We're excited to have you join our community! Best regards, The ${companyName} Team`
  }),

  // Subscriber data with common merge fields
  createSubscriberData: (email, firstName, lastName, additionalData = {}) => ({
    email: email,
    status: "subscribed",
    first_name: firstName,
    last_name: lastName,
    ...additionalData
  }),

  // Common tag sets for different subscriber types
  tagSets: {
    newSubscriber: ["New Subscriber", "Welcome"],
    customer: ["Customer", "Purchased"],
    vip: ["VIP", "High Value"],
    engaged: ["Engaged", "Active"],
    promotional: ["Promotions", "Offers"]
  }
};

// Example usage scenarios
const usageExamples = {
  
  // Scenario 1: Setting up a complete email marketing automation
  setupEmailAutomation: async () => {
    console.log("Setting up email marketing automation...");
    
    // Step 1: Create audience
    const audienceConfig = mailchimpUtils.createStandardAudience(
      "Newsletter Subscribers",
      {
        company: "Your Company Inc.",
        address: "123 Business St",
        city: "Business City",
        state: "BC",
        zip: "12345",
        country: "US",
        email: "newsletter@yourcompany.com"
      }
    );
    
    // Step 2: Create welcome campaign
    const welcomeCampaign = mailchimpUtils.createWelcomeCampaign(
      "{{audience_id}}",
      "Your Company"
    );
    
    // Step 3: Set up triggers for new subscribers
    const automationFlow = {
      trigger: "new_or_updated_subscriber",
      actions: [
        "add_welcome_tags",
        "send_welcome_campaign",
        "schedule_follow_up"
      ]
    };
    
    return {
      audience: audienceConfig,
      campaign: welcomeCampaign,
      automation: automationFlow
    };
  },

  // Scenario 2: E-commerce integration
  setupEcommerceIntegration: async () => {
    console.log("Setting up e-commerce integration...");
    
    const ecommerceFlow = {
      customerTrigger: {
        type: "new_customer",
        actions: [
          "add_to_customer_list",
          "send_welcome_offer",
          "tag_as_customer"
        ]
      },
      orderTrigger: {
        type: "new_order",
        actions: [
          "update_customer_value",
          "check_vip_status",
          "send_thank_you"
        ]
      }
    };
    
    return ecommerceFlow;
  },

  // Scenario 3: Campaign performance optimization
  optimizeCampaignPerformance: async () => {
    console.log("Setting up campaign performance optimization...");
    
    const performanceFlow = {
      openTracking: {
        trigger: "email_opened",
        action: "tag_as_engaged"
      },
      clickTracking: {
        trigger: "link_clicked",
        action: "tag_as_highly_engaged"
      },
      segmentation: {
        trigger: "new_segment_tag_subscriber",
        action: "send_targeted_campaign"
      }
    };
    
    return performanceFlow;
  }
};

// Export for use in Activepieces workflows
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mailchimpWorkflowExamples,
    mailchimpUtils,
    usageExamples
  };
}

console.log("Mailchimp Demo Script loaded successfully!");
console.log("Available workflow examples:", Object.keys(mailchimpWorkflowExamples));
console.log("Available utilities:", Object.keys(mailchimpUtils));
console.log("Available usage examples:", Object.keys(usageExamples));
