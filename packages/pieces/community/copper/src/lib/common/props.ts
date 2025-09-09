import { Property } from '@activepieces/pieces-framework';

/**
 * Common property definitions for Copper CRM actions and triggers
 * This file contains reusable property definitions to reduce code duplication
 */

// ============================================================================
// ID Properties
// ============================================================================

export const personId = Property.ShortText({
  displayName: 'Person ID',
  description: 'The ID of the person',
  required: true,
});

export const leadId = Property.ShortText({
  displayName: 'Lead ID',
  description: 'The ID of the lead',
  required: true,
});

export const companyId = Property.ShortText({
  displayName: 'Company ID',
  description: 'The ID of the company',
  required: true,
});

export const opportunityId = Property.ShortText({
  displayName: 'Opportunity ID',
  description: 'The ID of the opportunity',
  required: true,
});

export const projectId = Property.ShortText({
  displayName: 'Project ID',
  description: 'The ID of the project',
  required: true,
});

export const taskId = Property.ShortText({
  displayName: 'Task ID',
  description: 'The ID of the task',
  required: true,
});

export const activityId = Property.ShortText({
  displayName: 'Activity ID',
  description: 'The ID of the activity',
  required: true,
});

// ============================================================================
// Name Properties
// ============================================================================

export const name = Property.ShortText({
  displayName: 'Name',
  description: 'Full name',
  required: true,
});

export const personName = Property.ShortText({
  displayName: 'Name',
  description: 'Full name of the person',
  required: true,
});

export const leadName = Property.ShortText({
  displayName: 'Name',
  description: 'Full name of the lead',
  required: true,
});

export const companyName = Property.ShortText({
  displayName: 'Company Name',
  description: 'Name of the company',
  required: true,
});

export const opportunityName = Property.ShortText({
  displayName: 'Opportunity Name',
  description: 'Name of the opportunity',
  required: true,
});

export const projectName = Property.ShortText({
  displayName: 'Project Name',
  description: 'Name of the project',
  required: false,
});

export const taskName = Property.ShortText({
  displayName: 'Task Name',
  description: 'Name of the task',
  required: true,
});

// ============================================================================
// Contact Information Properties
// ============================================================================

export const email = Property.ShortText({
  displayName: 'Email',
  description: 'Primary email address',
  required: false,
});

export const emailCategory = Property.StaticDropdown({
  displayName: 'Email Category',
  description: 'Category for the email address',
  required: false,
  defaultValue: 'work',
  options: {
    disabled: false,
    options: [
      { label: 'Work', value: 'work' },
      { label: 'Personal', value: 'personal' },
      { label: 'Other', value: 'other' },
    ],
  },
});

export const phoneNumber = Property.ShortText({
  displayName: 'Phone Number',
  description: 'Primary phone number',
  required: false,
});

export const phoneCategory = Property.StaticDropdown({
  displayName: 'Phone Category',
  description: 'Category for the phone number',
  required: false,
  defaultValue: 'mobile',
  options: {
    disabled: false,
    options: [
      { label: 'Mobile', value: 'mobile' },
      { label: 'Work', value: 'work' },
      { label: 'Home', value: 'home' },
      { label: 'Other', value: 'other' },
    ],
  },
});

export const phoneCategoryWork = Property.StaticDropdown({
  displayName: 'Phone Category',
  description: 'Category for the phone number',
  required: false,
  defaultValue: 'work',
  options: {
    disabled: false,
    options: [
      { label: 'Work', value: 'work' },
      { label: 'Mobile', value: 'mobile' },
      { label: 'Home', value: 'home' },
      { label: 'Other', value: 'other' },
    ],
  },
});

// ============================================================================
// Address Properties
// ============================================================================

export const street = Property.ShortText({
  displayName: 'Street Address',
  description: 'Street address',
  required: false,
});

export const city = Property.ShortText({
  displayName: 'City',
  description: 'City',
  required: false,
});

export const state = Property.ShortText({
  displayName: 'State',
  description: 'State or province',
  required: false,
});

export const postalCode = Property.ShortText({
  displayName: 'Postal Code',
  description: 'Postal or ZIP code',
  required: false,
});

export const country = Property.ShortText({
  displayName: 'Country',
  description: 'Country',
  required: false,
});

// ============================================================================
// Business Properties
// ============================================================================

export const title = Property.ShortText({
  displayName: 'Title',
  description: 'Job title or position',
  required: false,
});

export const details = Property.LongText({
  displayName: 'Details',
  description: 'Additional details or description',
  required: false,
});

export const assigneeId = Property.Number({
  displayName: 'Assignee ID',
  description: 'ID of the user assigned to this item',
  required: false,
});

export const monetaryValue = Property.Number({
  displayName: 'Monetary Value',
  description: 'Expected monetary value',
  required: false,
});

// ============================================================================
// Lead-Specific Properties
// ============================================================================

export const customerSourceId = Property.Number({
  displayName: 'Customer Source ID',
  description: 'ID of the customer source for this lead',
  required: false,
});

export const statusId = Property.Number({
  displayName: 'Status ID',
  description: 'ID of the status for this lead',
  required: false,
});

// ============================================================================
// Opportunity-Specific Properties
// ============================================================================

export const primaryContactId = Property.Number({
  displayName: 'Primary Contact ID',
  description: 'ID of the primary contact for this opportunity',
  required: false,
});

export const pipelineId = Property.Number({
  displayName: 'Pipeline ID',
  description: 'ID of the pipeline for this opportunity',
  required: false,
});

export const pipelineStageId = Property.Number({
  displayName: 'Pipeline Stage ID',
  description: 'ID of the pipeline stage for this opportunity',
  required: false,
});

// ============================================================================
// Task-Specific Properties
// ============================================================================

export const relatedResourceId = Property.Number({
  displayName: 'Related Resource ID',
  description: 'ID of the related resource (person, lead, opportunity, or project)',
  required: false,
});

export const relatedResourceType = Property.StaticDropdown({
  displayName: 'Related Resource Type',
  description: 'Type of the related resource',
  required: false,
  defaultValue: 'person',
  options: {
    disabled: false,
    options: [
      { label: 'Person', value: 'person' },
      { label: 'Lead', value: 'lead' },
      { label: 'Opportunity', value: 'opportunity' },
      { label: 'Project', value: 'project' },
    ],
  },
});

export const dueDate = Property.ShortText({
  displayName: 'Due Date',
  description: 'Due date in YYYY-MM-DD format or Unix timestamp',
  required: false,
});

export const reminderDate = Property.ShortText({
  displayName: 'Reminder Date',
  description: 'Reminder date in YYYY-MM-DD format or Unix timestamp',
  required: false,
});

// ============================================================================
// Activity-Specific Properties
// ============================================================================

export const parentId = Property.Number({
  displayName: 'Parent ID',
  description: 'ID of the parent entity (person, lead, opportunity, company, or project)',
  required: true,
});

export const parentType = Property.StaticDropdown({
  displayName: 'Parent Type',
  description: 'Type of the parent entity',
  required: true,
  defaultValue: 'person',
  options: {
    disabled: false,
    options: [
      { label: 'Person', value: 'person' },
      { label: 'Lead', value: 'lead' },
      { label: 'Opportunity', value: 'opportunity' },
      { label: 'Company', value: 'company' },
      { label: 'Project', value: 'project' },
    ],
  },
});

export const activityTypeId = Property.Number({
  displayName: 'Activity Type ID',
  description: 'ID of the activity type (0 for user note, other IDs for specific activity types)',
  required: false,
  defaultValue: 0,
});

export const activityCategory = Property.StaticDropdown({
  displayName: 'Activity Category',
  description: 'Category of the activity',
  required: false,
  defaultValue: 'user',
  options: {
    disabled: false,
    options: [
      { label: 'User', value: 'user' },
      { label: 'Email', value: 'email' },
      { label: 'Call', value: 'call' },
      { label: 'Meeting', value: 'meeting' },
      { label: 'Task', value: 'task' },
    ],
  },
});

export const activityDate = Property.ShortText({
  displayName: 'Activity Date',
  description: 'Date of the activity in YYYY-MM-DD format or Unix timestamp (defaults to current time)',
  required: false,
});

export const oldValue = Property.ShortText({
  displayName: 'Old Value',
  description: 'Previous value (for change tracking activities)',
  required: false,
});

export const newValue = Property.ShortText({
  displayName: 'New Value',
  description: 'New value (for change tracking activities)',
  required: false,
});

// ============================================================================
// Company-Specific Properties
// ============================================================================

export const emailDomain = Property.ShortText({
  displayName: 'Email Domain',
  description: 'Email domain of the company (e.g., company.com)',
  required: false,
});

// ============================================================================
// Project-Specific Properties
// ============================================================================

export const relatedResource = Property.ShortText({
  displayName: 'Related Resource',
  description: 'Related resource for this project',
  required: false,
});

export const startDate = Property.ShortText({
  displayName: 'Start Date',
  description: 'Start date in YYYY-MM-DD format',
  required: false,
});

export const closeDate = Property.ShortText({
  displayName: 'Close Date',
  description: 'Expected close date (YYYY-MM-DD format)',
  required: false,
});

// ============================================================================
// Priority Properties
// ============================================================================

export const priority = Property.StaticDropdown({
  displayName: 'Priority',
  description: 'Priority level',
  required: false,
  defaultValue: 'None',
  options: {
    disabled: false,
    options: [
      { label: 'None', value: 'None' },
      { label: 'Low', value: 'Low' },
      { label: 'Medium', value: 'Medium' },
      { label: 'High', value: 'High' },
    ],
  },
});

// ============================================================================
// Custom Field Properties
// ============================================================================

export const customField1Id = Property.Number({
  displayName: 'Custom Field 1 ID',
  description: 'ID of the first custom field definition',
  required: false,
});

export const customField1Value = Property.ShortText({
  displayName: 'Custom Field 1 Value',
  description: 'Value for the first custom field',
  required: false,
});

export const customField2Id = Property.Number({
  displayName: 'Custom Field 2 ID',
  description: 'ID of the second custom field definition',
  required: false,
});

export const customField2Value = Property.ShortText({
  displayName: 'Custom Field 2 Value',
  description: 'Value for the second custom field',
  required: false,
});

export const customField3Id = Property.Number({
  displayName: 'Custom Field 3 ID',
  description: 'ID of the third custom field definition',
  required: false,
});

export const customField3Value = Property.ShortText({
  displayName: 'Custom Field 3 Value',
  description: 'Value for the third custom field',
  required: false,
});

// ============================================================================
// Search Properties
// ============================================================================

export const pageNumber = Property.Number({
  displayName: 'Page Number',
  description: 'Page number for pagination (starts from 1)',
  required: false,
  defaultValue: 1,
});

export const pageSize = Property.Number({
  displayName: 'Page Size',
  description: 'Number of results per page (max 200)',
  required: false,
  defaultValue: 25,
});

export const sortBy = Property.ShortText({
  displayName: 'Sort By',
  description: 'Field to sort by',
  required: false,
});

// ============================================================================
// Date Range Properties
// ============================================================================

export const dateCreatedStart = Property.ShortText({
  displayName: 'Date Created Start',
  description: 'Start date for created date filter (YYYY-MM-DD format)',
  required: false,
});

export const dateCreatedEnd = Property.ShortText({
  displayName: 'Date Created End',
  description: 'End date for created date filter (YYYY-MM-DD format)',
  required: false,
});

export const dateModifiedStart = Property.ShortText({
  displayName: 'Date Modified Start',
  description: 'Start date for modified date filter (YYYY-MM-DD format)',
  required: false,
});

export const dateModifiedEnd = Property.ShortText({
  displayName: 'Date Modified End',
  description: 'End date for modified date filter (YYYY-MM-DD format)',
  required: false,
});

export const dateLastContactedStart = Property.ShortText({
  displayName: 'Date Last Contacted Start',
  description: 'Start date for last contacted filter (YYYY-MM-DD format)',
  required: false,
});

export const dateLastContactedEnd = Property.ShortText({
  displayName: 'Date Last Contacted End',
  description: 'End date for last contacted filter (YYYY-MM-DD format)',
  required: false,
});

// ============================================================================
// Interaction Properties
// ============================================================================

export const interactionCountMin = Property.Number({
  displayName: 'Interaction Count Min',
  description: 'Minimum number of interactions',
  required: false,
});

export const interactionCountMax = Property.Number({
  displayName: 'Interaction Count Max',
  description: 'Maximum number of interactions',
  required: false,
});

// ============================================================================
// Boolean Properties
// ============================================================================

export const followed = Property.Checkbox({
  displayName: 'Followed',
  description: 'Whether the item is being followed',
  required: false,
});

// ============================================================================
// Tags Properties
// ============================================================================

export const tags = Property.Array({
  displayName: 'Tags',
  description: 'Tags associated with the item',
  required: false,
});

// ============================================================================
// Social Media Properties
// ============================================================================

export const socials = Property.Array({
  displayName: 'Social Media',
  description: 'Social media profiles',
  required: false,
});

// ============================================================================
// Monetary Range Properties
// ============================================================================

export const monetaryValueMin = Property.Number({
  displayName: 'Monetary Value Min',
  description: 'Minimum monetary value',
  required: false,
});

export const monetaryValueMax = Property.Number({
  displayName: 'Monetary Value Max',
  description: 'Maximum monetary value',
  required: false,
});

// ============================================================================
// Custom Field Range Properties
// ============================================================================

export const customField1MinValue = Property.Number({
  displayName: 'Custom Field 1 Min Value',
  description: 'Minimum value for custom field 1',
  required: false,
});

export const customField1MaxValue = Property.Number({
  displayName: 'Custom Field 1 Max Value',
  description: 'Maximum value for custom field 1',
  required: false,
});

export const customField1AllowEmpty = Property.Checkbox({
  displayName: 'Custom Field 1 Allow Empty',
  description: 'Whether to allow empty values for custom field 1',
  required: false,
});

export const customField1Option = Property.ShortText({
  displayName: 'Custom Field 1 Option',
  description: 'Option value for custom field 1',
  required: false,
});

export const customField2MinValue = Property.Number({
  displayName: 'Custom Field 2 Min Value',
  description: 'Minimum value for custom field 2',
  required: false,
});

export const customField2MaxValue = Property.Number({
  displayName: 'Custom Field 2 Max Value',
  description: 'Maximum value for custom field 2',
  required: false,
});

export const customField2AllowEmpty = Property.Checkbox({
  displayName: 'Custom Field 2 Allow Empty',
  description: 'Whether to allow empty values for custom field 2',
  required: false,
});

export const customField2Option = Property.ShortText({
  displayName: 'Custom Field 2 Option',
  description: 'Option value for custom field 2',
  required: false,
});

export const customField3MinValue = Property.Number({
  displayName: 'Custom Field 3 Min Value',
  description: 'Minimum value for custom field 3',
  required: false,
});

export const customField3MaxValue = Property.Number({
  displayName: 'Custom Field 3 Max Value',
  description: 'Maximum value for custom field 3',
  required: false,
});

export const customField3AllowEmpty = Property.Checkbox({
  displayName: 'Custom Field 3 Allow Empty',
  description: 'Whether to allow empty values for custom field 3',
  required: false,
});

export const customField3Option = Property.ShortText({
  displayName: 'Custom Field 3 Option',
  description: 'Option value for custom field 3',
  required: false,
});
