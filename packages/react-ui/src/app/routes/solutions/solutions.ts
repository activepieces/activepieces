import { Solution } from '@activepieces/shared';

export const solutions: Solution[] = [
  {
    thumbnail:
      'https://content.activepieces.com/uploads/placeholder_blog_de8c9fa735.png',
    name: 'Automate Blog Writing',
    description: `
Transform your content creation process with this comprehensive blog writing automation solution. This powerful workflow streamlines every aspect of blog production, from initial research to final publication.

## Key Features

### 🔍 **Intelligent Research & Topic Generation**
- Automatically discover trending topics in your niche
- Gather relevant data from multiple sources
- Generate content ideas based on audience interests
- Analyze competitor content for inspiration

### ✍️ **AI-Powered Content Creation**
- Generate high-quality blog posts with consistent tone and style
- Create engaging headlines and meta descriptions
- Optimize content for SEO with keyword integration
- Maintain brand voice across all publications

### 📊 **Content Management & Scheduling**
- Organize content in a centralized editorial calendar
- Schedule posts across multiple platforms
- Track content performance and engagement metrics
- Manage content revisions and approval workflows

### 🚀 **Multi-Platform Publishing**
- Automatically publish to WordPress, Medium, LinkedIn, and more
- Format content appropriately for each platform
- Cross-post with platform-specific optimizations
- Maintain consistent branding across channels

## Benefits

- **Save 80% of time** spent on manual content creation
- **Increase publishing frequency** with automated workflows
- **Improve SEO rankings** with optimized content
- **Maintain consistency** across all your content channels
- **Scale your content marketing** without additional resources

## Perfect For

- Content marketers and agencies
- Bloggers and influencers
- Small businesses and startups
- Marketing teams looking to scale
- Anyone who needs consistent, quality content

Get started today and transform your content creation process from hours of manual work to minutes of automated excellence!`,
    state: {
      flows: [
        {
          id: 'j3EQL8OwBEhliYq2ekcu3',
          created: '2025-08-12T12:23:16.988Z',
          updated: '2025-08-12T12:30:25.047Z',
          projectId: 'BdtoyXT9TIfMDcG5vECz4',
          folderId: null,
          status: 'DISABLED',
          externalId: 'LjGB5M7Tj1tMXVWermXmv',
          publishedVersionId: null,
          metadata: null,
          version: {
            id: 'sGHFPuc19bYm2qj4IsbVb',
            created: '2025-08-12T12:23:17.002Z',
            updated: '2025-08-12T12:30:25.077Z',
            flowId: 'j3EQL8OwBEhliYq2ekcu3',
            displayName: 'Chat With Agent',
            schemaVersion: '5',
            trigger: {
              name: 'trigger',
              type: 'PIECE_TRIGGER',
              valid: true,
              settings: {
                input: {
                  botName: 'AI Bot',
                },
                pieceName: '@activepieces/piece-forms',
                inputUiInfo: {
                  customizedInputs: {},
                },
                triggerName: 'chat_submission',
                pieceVersion: '~0.4.3',
              },
              nextAction: {
                name: 'step_2',
                type: 'PIECE',
                valid: true,
                settings: {
                  input: {
                    prompt: "{{trigger['message']}}",
                    agentId: 'brwJTww5Gr1P0B99jUhhy',
                  },
                  pieceName: '@activepieces/piece-agent',
                  pieceType: 'OFFICIAL',
                  actionName: 'run_agent',
                  inputUiInfo: {
                    customizedInputs: {},
                  },
                  packageType: 'REGISTRY',
                  pieceVersion: '~0.2.4',
                  errorHandlingOptions: {
                    retryOnFailure: {
                      value: false,
                    },
                    continueOnFailure: {
                      value: false,
                    },
                  },
                },
                nextAction: {
                  name: 'step_3',
                  skip: false,
                  type: 'PIECE',
                  valid: true,
                  settings: {
                    input: {
                      auth: "{{connections['MMb8MeVPMjwzuQKJKZgN6']}}",
                      text: 'Hello',
                      userId: 'USLACKBOT',
                    },
                    pieceName: '@activepieces/piece-slack',
                    actionName: 'send_direct_message',
                    inputUiInfo: {
                      customizedInputs: {},
                    },
                    pieceVersion: '~0.10.1',
                    errorHandlingOptions: {
                      retryOnFailure: {
                        value: false,
                      },
                      continueOnFailure: {
                        value: false,
                      },
                    },
                  },
                  nextAction: {
                    name: 'step_1',
                    skip: false,
                    type: 'PIECE',
                    valid: true,
                    settings: {
                      input: {
                        markdown: "{{step_2['message']}}",
                      },
                      pieceName: '@activepieces/piece-forms',
                      pieceType: 'OFFICIAL',
                      actionName: 'return_response',
                      inputUiInfo: {
                        customizedInputs: {},
                      },
                      packageType: 'REGISTRY',
                      pieceVersion: '~0.4.3',
                      errorHandlingOptions: {
                        retryOnFailure: {
                          value: false,
                        },
                        continueOnFailure: {
                          value: false,
                        },
                      },
                    },
                    displayName: 'Respond on UI',
                  },
                  displayName: 'Send Message To A User',
                },
                displayName: 'Fresh Agent',
              },
              displayName: 'Chat UI',
            },
            connectionIds: ['MMb8MeVPMjwzuQKJKZgN6'],
            agentIds: ['brwJTww5Gr1P0B99jUhhy'],
            updatedBy: 'MSKcInmyX3JRm3e6SaqOO',
            valid: true,
            state: 'DRAFT',
          },
        },
      ],
      connections: [
        {
          externalId: 'MMb8MeVPMjwzuQKJKZgN6',
          pieceName: '@activepieces/piece-slack',
          displayName: 'Slack',
        },
      ],
      tables: [
        {
          id: '5tzUNoQpkTPsZ7i5lPzf6',
          created: '2025-08-12T01:11:35.976Z',
          updated: '2025-08-12T01:11:36.599Z',
          name: 'New Table',
          externalId: 'ZKqDcGjxvKUgiAftOVB3w',
          agentId: 'VGvSFGvvfLs38hgi90cGv',
          trigger: null,
          status: null,
          projectId: 'BdtoyXT9TIfMDcG5vECz4',
          fields: [
            {
              id: 'ApAOumGy2fiSevRlXVqD4',
              created: '2025-08-12T01:11:36.141Z',
              updated: '2025-08-12T01:11:36.141Z',
              name: 'Name',
              type: 'TEXT',
              tableId: '5tzUNoQpkTPsZ7i5lPzf6',
              projectId: 'BdtoyXT9TIfMDcG5vECz4',
              externalId: 'djjJ8NwkQJ3VeLEFHqymk',
              data: null,
            },
          ],
        },
      ],
      agents: [
        {
          id: '8ZHza9NVHIN60DJ86D34c',
          created: '2025-08-12T12:23:04.783Z',
          updated: '2025-08-12T12:23:04.783Z',
          profilePictureUrl:
            'https://cdn.activepieces.com/quicknew/agents/robots/robot_8111.png',
          displayName: 'Blog Writer Agent',
          description: 'Creates engaging and informative blog posts.',
          maxSteps: 10,
          mcpId: '8ik9lRwXpqs9Hw7Dc1Moc',
          systemPrompt:
            '# Blog Writer Agent\n\n## Goal\nThe primary goal of the Blog Writer Agent is to create engaging, informative, and well-structured blog posts tailored to the target audience.\n\n## Instructions\n1. Identify the topic and target audience for the blog post.\n2. Conduct thorough research to gather relevant information and insights.\n3. Draft the blog post, ensuring it has a clear introduction, body, and conclusion.\n4. Use headings and subheadings to enhance readability.\n5. Incorporate SEO best practices, including keywords and meta descriptions.\n6. Edit and proofread the content for grammar, style, and coherence.\n\n## Constraints or Style Guidelines\n- Maintain a professional tone while being approachable.\n- Aim for a word count of 800-1500 words.\n- Use bullet points and lists where appropriate to improve clarity.\n- Ensure all sources are credible and properly cited.',
          projectId: 'BdtoyXT9TIfMDcG5vECz4',
          platformId: 'bYjh7ANyhuBmXWdLPDT9T',
          outputType: 'no_output',
          externalId: 'brwJTww5Gr1P0B99jUhhy',
          outputFields: [],
          runCompleted: 0,
          mcp: {
            id: '8ik9lRwXpqs9Hw7Dc1Moc',
            created: '2025-08-12T12:23:00.024Z',
            updated: '2025-08-12T12:23:04.797Z',
            name: 'Fresh Agent',
            agentId: '8ZHza9NVHIN60DJ86D34c',
            projectId: 'BdtoyXT9TIfMDcG5vECz4',
            token: 'RaxKmjZ7pf0zWJ8ql9Hl2',
            externalId: 'ZRFNjX76iX8SNIG3RfPtH',
            tools: [],
          },
        },
      ],
    },
  } as any,
  {
    thumbnail:
      'https://content.activepieces.com/uploads/img_h_P7f_Otacq_Xy_Cw_Jjlw2gl_Jryh_min_925f98d38b.png',
    name: 'Customer Support Automation',
    description: `
Revolutionize your customer service with intelligent automation that provides 24/7 support while reducing response times and improving customer satisfaction.

## Key Features

### 🤖 **AI-Powered Ticket Routing**
- Automatically categorize and prioritize incoming tickets
- Route requests to the most qualified team members
- Escalate urgent issues based on predefined criteria
- Maintain SLA compliance with automated tracking

### 💬 **Intelligent Chatbot Integration**
- Deploy smart chatbots for instant first-line support
- Handle common queries with natural language processing
- Seamlessly transfer complex issues to human agents
- Learn from interactions to improve responses over time

### 📧 **Automated Response Management**
- Send personalized acknowledgment emails instantly
- Provide status updates throughout the resolution process
- Generate follow-up surveys for feedback collection
- Create knowledge base articles from resolved tickets

### 📊 **Performance Analytics & Reporting**
- Track response times and resolution rates
- Monitor customer satisfaction scores
- Identify trending issues and bottlenecks
- Generate comprehensive performance reports

## Benefits

- **Reduce response time by 90%** with instant automated replies
- **Increase customer satisfaction** with consistent, quality support
- **Lower operational costs** by automating routine tasks
- **Scale support operations** without proportional staff increases
- **Improve agent productivity** by handling repetitive queries

## Perfect For

- E-commerce businesses
- SaaS companies
- Service-based organizations
- Growing startups
- Any business with high support volume

Transform your customer support from reactive to proactive with intelligent automation!`,
    state: {
      connections: [],
      tables: [],
      agents: [],
      flows: [],
    },
  },
  {
    thumbnail:
      'https://content.activepieces.com/uploads/How_To_Build_AI_Agents_on_Activepieces_1_cd55a5b17d.jpg',
    name: 'Lead Generation & Nurturing',
    description: `
Supercharge your sales pipeline with automated lead generation, qualification, and nurturing workflows that convert prospects into customers.

## Key Features

### 🎯 **Multi-Channel Lead Capture**
- Capture leads from websites, social media, and events
- Create dynamic landing pages with conversion optimization
- Integrate with CRM systems for seamless data flow
- Track lead sources and attribution automatically

### 🔍 **Intelligent Lead Scoring**
- Score leads based on behavior, demographics, and engagement
- Automatically qualify prospects using predefined criteria
- Prioritize hot leads for immediate sales follow-up
- Update scores in real-time based on new interactions

### 📧 **Personalized Email Campaigns**
- Create targeted drip campaigns based on lead segments
- Send personalized content based on interests and behavior
- A/B test subject lines and content for optimization
- Track opens, clicks, and conversions automatically

### 🤝 **Sales Team Integration**
- Automatically assign qualified leads to sales reps
- Send real-time notifications for high-priority prospects
- Sync lead data with CRM and sales tools
- Generate sales-ready lead summaries and insights

## Benefits

- **Increase lead conversion by 300%** with targeted nurturing
- **Reduce sales cycle time** with qualified, warm leads
- **Improve ROI on marketing spend** with better targeting
- **Scale lead generation** without additional manual effort
- **Align marketing and sales** with shared lead intelligence

## Perfect For

- B2B companies and agencies
- Real estate professionals
- Professional services firms
- Technology companies
- Any business focused on lead generation

Turn your marketing efforts into a predictable revenue engine with automated lead generation!`,
    state: {
      connections: [],
      tables: [],
      agents: [],
      flows: [],
    },
  },
  {
    thumbnail:
      'https://content.activepieces.com/uploads/placeholder_blog_de8c9fa735.png',
    name: 'Social Media Management',
    description: `
Streamline your social media presence with comprehensive automation that handles content creation, scheduling, engagement, and analytics across all platforms.

## Key Features

### 📱 **Multi-Platform Publishing**
- Schedule posts across Facebook, Twitter, Instagram, LinkedIn, and more
- Optimize content format for each platform automatically
- Maintain consistent brand voice across all channels
- Cross-promote content with platform-specific adaptations

### 🎨 **Automated Content Creation**
- Generate engaging posts using AI-powered content tools
- Create visual content with automated design templates
- Curate relevant industry content from trusted sources
- Repurpose long-form content into social media snippets

### 💬 **Engagement Automation**
- Automatically respond to comments and mentions
- Monitor brand mentions across social platforms
- Engage with followers using personalized responses
- Escalate important conversations to human moderators

### 📈 **Analytics & Performance Tracking**
- Track engagement metrics across all platforms
- Generate comprehensive social media reports
- Identify best-performing content types and times
- Monitor competitor activity and industry trends

## Benefits

- **Save 15+ hours per week** on social media management
- **Increase engagement rates by 250%** with consistent posting
- **Grow follower base** with strategic content and timing
- **Improve brand awareness** through consistent presence
- **Make data-driven decisions** with comprehensive analytics

## Perfect For

- Small businesses and entrepreneurs
- Marketing agencies and consultants
- Influencers and content creators
- E-commerce brands
- Any business building an online presence

Transform your social media from time-consuming task to automated growth engine!`,
    state: {
      connections: [],
      tables: [],
      agents: [],
      flows: [],
    },
  },
];
