import { getHulyClient } from './hulyWebSocket';
import {
  Person,
  Project,
  Issue,
  Document,
  Milestone,
  CommunicationChannel
} from '../types';

// Mock data for demo purposes
const mockPeople: Person[] = [
  {
    id: "person-1",
    name: "John Doe",
    channels: [
      { type: "email", value: "john@example.com" }
    ]
  },
  {
    id: "person-2",
    name: "Jane Smith",
    channels: [
      { type: "email", value: "jane@example.com" },
      { type: "phone", value: "+1234567890" }
    ]
  },
  {
    id: "person-3",
    name: "Alice Johnson",
    channels: [
      { type: "email", value: "alice@example.com" },
      { type: "linkedin", value: "linkedin.com/in/alice-johnson" }
    ]
  }
];

const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "Website Redesign",
    description: "Redesign company website with new branding"
  },
  {
    id: "project-2",
    name: "Mobile App Development",
    description: "Create new mobile app for customers"
  },
  {
    id: "project-3",
    name: "Database Migration",
    description: "Migrate old database to new system"
  }
];

const mockIssues: Issue[] = [
  {
    id: "issue-1",
    projectId: "project-1",
    title: "Fix header responsiveness",
    description: "Header doesn't display correctly on mobile devices",
    priority: "high",
    status: "in-progress",
    lastModified: "2025-04-26T14:30:00Z"
  },
  {
    id: "issue-2",
    projectId: "project-1",
    title: "Update footer links",
    description: "Add new social media links to footer",
    priority: "low",
    status: "open",
    lastModified: "2025-04-25T10:15:00Z"
  },
  {
    id: "issue-3",
    projectId: "project-2",
    title: "Implement login functionality",
    description: "Create user authentication system",
    priority: "medium",
    status: "open",
    lastModified: "2025-04-27T09:45:00Z"
  }
];

const mockDocuments: Document[] = [
  {
    id: "doc-1",
    teamspaceId: "team-1",
    name: "Project Requirements",
    content: "# Requirements\n\n- Feature 1\n- Feature 2\n- Feature 3",
    projectIds: ["project-1"]
  },
  {
    id: "doc-2",
    teamspaceId: "team-1",
    name: "Meeting Notes",
    content: "# Meeting Notes\n\nDiscussed project timeline and milestones",
    projectIds: ["project-1", "project-2"]
  },
  {
    id: "doc-3",
    teamspaceId: "team-2",
    name: "API Documentation",
    content: "# API Docs\n\n## Endpoints\n\n- GET /users\n- POST /users",
    projectIds: ["project-3"]
  }
];

const mockMilestones: Milestone[] = [
  {
    id: "milestone-1",
    projectId: "project-1",
    name: "Alpha Release",
    dueDate: "2025-05-15",
    issues: ["issue-1"]
  },
  {
    id: "milestone-2",
    projectId: "project-1",
    name: "Beta Release",
    dueDate: "2025-06-30",
    issues: ["issue-2"]
  },
  {
    id: "milestone-3",
    projectId: "project-2",
    name: "Initial Release",
    dueDate: "2025-05-30",
    issues: ["issue-3"]
  }
];

// Connection settings from environment variables
const HULY_WS_URL = process.env.HULY_WS_URL || 'wss://api.huly.io';

// Get the WebSocket client
const hulyClient = getHulyClient(HULY_WS_URL);

/**
 * Search APIs
 */

export async function findPerson(query?: string): Promise<Person[]> {
  console.log(`Mock: Finding person with query: ${query}`);
  
  if (!query) {
    return mockPeople;
  }
  
  const queryLower = query.toLowerCase();
  return mockPeople.filter(person => 
    person.name.toLowerCase().includes(queryLower) || 
    person.channels?.some(channel => 
      channel.type === 'email' && channel.value.toLowerCase().includes(queryLower)
    )
  );
}

export async function findProject(id?: string, name?: string): Promise<Project[]> {
  console.log(`Mock: Finding project with id: ${id}, name: ${name}`);
  
  if (id) {
    const project = mockProjects.find(p => p.id === id);
    return project ? [project] : [];
  }
  
  if (name) {
    const nameLower = name.toLowerCase();
    return mockProjects.filter(p => p.name.toLowerCase().includes(nameLower));
  }
  
  return mockProjects;
}

export async function findIssue(projectId: string): Promise<Issue[]> {
  console.log(`Mock: Finding issues for project: ${projectId}`);
  
  // Filter issues by project ID and sort by last modified date (newest first)
  const filteredIssues = mockIssues
    .filter(issue => issue.projectId === projectId)
    .sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    
  return filteredIssues;
}

export async function findDocument(teamspaceId: string, name?: string): Promise<Document[]> {
  console.log(`Mock: Finding documents in teamspace: ${teamspaceId}, name: ${name}`);
  
  let filtered = mockDocuments.filter(doc => doc.teamspaceId === teamspaceId);
  
  if (name) {
    const nameLower = name.toLowerCase();
    filtered = filtered.filter(doc => doc.name.toLowerCase().includes(nameLower));
  }
  
  return filtered;
}

/**
 * Creation APIs
 */

export async function createPerson(name: string, email: string): Promise<Person> {
  console.log(`Mock: Creating person with name: ${name}, email: ${email}`);
  
  // Generate a new ID (in a real system, this would be done by the backend)
  const id = `person-${Date.now()}`;
  
  // Create the new person object
  const newPerson: Person = {
    id,
    name,
    channels: [{ type: 'email', value: email }]
  };
  
  // In a real system, this would be saved to a database
  // For mock purposes, we can add it to our mock data
  mockPeople.push(newPerson);
  
  return newPerson;
}

export async function createIssue(
  projectId: string,
  title: string,
  description?: string,
  priority?: 'low' | 'medium' | 'high',
  dueDate?: string
): Promise<Issue> {
  console.log(`Mock: Creating issue in project: ${projectId}, title: ${title}`);
  
  // Check if project exists
  const project = mockProjects.find(p => p.id === projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }
  
  // Generate a new ID
  const id = `issue-${Date.now()}`;
  
  // Create the new issue
  const newIssue: Issue = {
    id,
    projectId,
    title,
    description,
    priority: priority || 'medium',
    status: 'open',
    lastModified: new Date().toISOString()
  };
  
  if (dueDate) {
    newIssue.dueDate = dueDate;
  }
  
  // Add to mock data
  mockIssues.push(newIssue);
  
  return newIssue;
}

export async function createMilestone(
  projectId: string,
  name: string,
  dueDate?: string,
  issueIds?: string[]
): Promise<Milestone> {
  console.log(`Mock: Creating milestone in project: ${projectId}, name: ${name}`);
  
  // Check if project exists
  const project = mockProjects.find(p => p.id === projectId);
  if (!project) {
    throw new Error(`Project with ID ${projectId} not found`);
  }
  
  // If issue IDs are provided, verify they exist
  if (issueIds && issueIds.length > 0) {
    for (const issueId of issueIds) {
      const issue = mockIssues.find(i => i.id === issueId);
      if (!issue) {
        throw new Error(`Issue with ID ${issueId} not found`);
      }
    }
  }
  
  // Generate a new ID
  const id = `milestone-${Date.now()}`;
  
  // Create the new milestone
  const newMilestone: Milestone = {
    id,
    projectId,
    name,
    issues: issueIds || []
  };
  
  if (dueDate) {
    newMilestone.dueDate = dueDate;
  }
  
  // Add to mock data
  mockMilestones.push(newMilestone);
  
  return newMilestone;
}

export async function createDocument(
  teamspaceId: string,
  name: string,
  content: string,
  projectIds?: string[]
): Promise<Document> {
  console.log(`Mock: Creating document in teamspace: ${teamspaceId}, name: ${name}`);
  
  // Generate a new ID
  const id = `doc-${Date.now()}`;
  
  // Create the new document
  const newDocument: Document = {
    id,
    teamspaceId,
    name,
    content,
    projectIds: projectIds || []
  };
  
  // Add to mock data
  mockDocuments.push(newDocument);
  
  return newDocument;
}