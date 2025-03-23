import {
  AlertTriangle,
  Check,
  Info,
  Sparkles,
  Calendar,
  ArrowUpRight,
  Workflow,
  GitBranch,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Dummy data representing issues
const dummyIssues = [
  {
    id: '1',
    flowName: 'User Registration Flow',
    flowStep: 'Authentication',
    message: 'Failed to fetch user data from authentication provider',
    serviceResponse:
      'HTTP 500 Internal Server Error: The authentication service returned an error response. The service logs indicate a timeout while connecting to the OAuth provider. This may be due to network latency or incorrect API credentials configured in the authentication service. The error occurred at "fetchUserProfileFromProvider" method in the AuthenticationService class.',
    count: 12,
    firstSeen: '2025-03-15T14:30:00Z',
    lastSeen: '2025-03-22T08:20:00Z',
    suggestedFix:
      'Check API credentials for the authentication service or verify network connectivity.',
    resolved: false,
    samples: [
      {
        id: 's1',
        timestamp: '2025-03-22T08:20:00Z',
        runId: 'run-123456',
        runTime: '2.1s',
        input: '{"userId": "user123", "provider": "oauth2"}',
      },
      {
        id: 's2',
        timestamp: '2025-03-21T14:15:00Z',
        runId: 'run-123457',
        runTime: '2.3s',
        input: '{"userId": "user456", "provider": "oauth2"}',
      },
      {
        id: 's3',
        timestamp: '2025-03-20T09:30:00Z',
        runId: 'run-123458',
        runTime: '2.8s',
        input: '{"userId": "user789", "provider": "oauth2"}',
      },
    ],
  },
  {
    id: '2',
    flowName: 'Payment Processing Flow',
    flowStep: 'Payment Authorization',
    message: 'Payment gateway timeout during transaction authorization',
    serviceResponse:
      'HTTP 504 Gateway Timeout: The payment processor gateway did not respond within the allocated time. The transaction was attempted but could not be completed due to connectivity issues with the payment service. Our logs show that the request was properly formatted and sent, but the payment gateway did not acknowledge receipt within the standard 30-second timeout window.',
    count: 5,
    firstSeen: '2025-03-18T09:15:00Z',
    lastSeen: '2025-03-21T16:45:00Z',
    suggestedFix:
      'Increase timeout threshold and implement retry mechanism for payment operations.',
    resolved: false,
    samples: [
      {
        id: 's1',
        timestamp: '2025-03-21T16:45:00Z',
        runId: 'run-234567',
        runTime: '5.2s',
        input: '{"orderId": "ord123", "amount": 299.99}',
      },
      {
        id: 's2',
        timestamp: '2025-03-20T12:30:00Z',
        runId: 'run-234568',
        runTime: '4.7s',
        input: '{"orderId": "ord456", "amount": 149.50}',
      },
    ],
  },
  {
    id: '3',
    flowName: 'Data Export Flow',
    flowStep: 'Data Query',
    message: 'Export operation timed out due to large dataset',
    serviceResponse:
      'HTTP 504 Request Timeout: The database query for data export exceeded the maximum query execution time of 120 seconds. The query was attempting to retrieve all customer records with their associated transaction history for the requested date range. Database analysis shows that the query was attempting to join multiple large tables without proper indexing, resulting in a full table scan operation that could not complete in the allowed time.',
    count: 3,
    firstSeen: '2025-03-19T10:30:00Z',
    lastSeen: '2025-03-21T14:15:00Z',
    suggestedFix:
      'Implement pagination for large data exports and optimize query performance.',
    resolved: false,
    samples: [
      {
        id: 's1',
        timestamp: '2025-03-21T14:15:00Z',
        runId: 'run-345678',
        runTime: '3.5s',
        input: '{"reportType": "full", "dateRange": "2025-01-01/2025-03-21"}',
      },
      {
        id: 's2',
        timestamp: '2025-03-20T11:45:00Z',
        runId: 'run-345679',
        runTime: '3.5s',
        input: '{"reportType": "full", "dateRange": "2025-01-01/2025-03-20"}',
      },
    ],
  },
];

// Types for our issue data
type Sample = {
  id: string;
  timestamp: string;
  runId: string;
  runTime: string;
  input: string;
};

type Issue = {
  id: string;
  flowName: string;
  flowStep: string;
  message: string;
  serviceResponse: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  suggestedFix: string;
  resolved: boolean;
  samples: Sample[];
};

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Left panel components
function IssueSummaryCard({ issue }: { issue: Issue }) {
  return (
    <Card className="mb-4">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="size-4 text-foreground" />
            Summary
          </h3>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Error Message</h4>
            <p className="text-muted-foreground">{issue.message}</p>
          </div>

          {/* AI Suggested Fix section */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <div className="flex items-center mb-2">
              <Sparkles className="h-4 w-4 text-primary mr-2" />
              <h4 className="text-sm font-semibold text-primary">
                AI Suggested Fix
              </h4>
            </div>
            <p className="text-primary">{issue.suggestedFix}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SampleRunsCard({
  issue,
  selectedRows,
  setSelectedRows,
  visitRun,
}: {
  issue: Issue;
  selectedRows: string[];
  setSelectedRows: (rows: string[]) => void;
  visitRun: (runId: string) => void;
}) {
  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(issue.samples.map((sample) => sample.id));
    } else {
      setSelectedRows([]);
    }
  };

  const resolveSelectedIssues = () => {
    console.log(`Resolving samples: ${selectedRows.join(', ')}`);
    // call an API here to mark these samples as resolved
    setSelectedRows([]);
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Sample Runs</h3>
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <Button size="sm" className="gap-2" onClick={resolveSelectedIssues}>
              <Check className="size-3.5" />
              Mark Resolved ({selectedRows.length})
            </Button>
          )}
          <Button variant="link" size="sm" className="gap-1">
            <ArrowUpRight className="h-3.5 w-3.5 text-foreground" />
            View All
          </Button>
        </div>
      </CardHeader>
      <div className="px-4 py-2 border-b bg-muted/30 w-full">
        <div className="flex items-center">
          <Checkbox
            checked={
              selectedRows.length === issue.samples.length &&
              issue.samples.length > 0
            }
            onCheckedChange={(checked) => toggleSelectAll(!!checked)}
            className="mr-4"
          />
          <div className="flex-1 font-medium">Input</div>
          <div className="w-36 font-medium">Start Time</div>
          <div className="w-24 font-medium">Duration</div>
        </div>
      </div>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[60vh]">
          {issue.samples.map((sample) => (
            <div
              key={sample.id}
              className="px-4 py-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer"
              onClick={() => visitRun(sample.runId)}
            >
              <div className="flex items-center">
                <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedRows.includes(sample.id)}
                    onCheckedChange={() => toggleSelectRow(sample.id)}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium font-mono text-xs truncate">
                    {sample.input}
                  </div>
                </div>
                <div className="w-36 text-muted-foreground text-sm">
                  {formatDate(sample.timestamp).split(', ')[1]}
                </div>
                <div className="w-24 text-muted-foreground text-sm">
                  {sample.runTime}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Right panel component
function FlowDetailsCard({
  issue,
  visitFlow,
}: {
  issue: Issue;
  visitFlow: (flowName: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="size-4 text-foreground" />
            Flow Details
          </h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        <div>
          <div className="flex items-center justify-between">
            <Button
              variant="link"
              className="p-0 h-auto text-lg font-bold flex items-center gap-2"
              onClick={() => visitFlow(issue.flowName)}
            >
              <Workflow className="size-4 text-foreground" />
              {issue.flowName}
            </Button>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1 text-sm">
              <GitBranch className="size-4 text-foreground" />
              <span className="font-semibold">Flow Step:</span>
              <span className="text-foreground">{issue.flowStep}</span>
            </div>
          </div>
        </div>
        <Separator />

        <div>
          <h4 className="text-sm font-semibold mb-2">Summary</h4>

          <div className="space-y-4">
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4 text-foreground" />
              <span className="font-semibold text-foreground">
                First Issue Seen:
              </span>
              <span className="text-muted-foreground">
                {formatDate(issue.firstSeen)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4 text-foreground" />
              <span className="font-semibold text-foreground">
                Last Issue Seen:
              </span>
              <span className="text-muted-foreground">
                {formatDate(issue.lastSeen)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <AlertTriangle className="h-4 w-4 text-foreground" />
              <span className="font-semibold">Total Occurrences:</span>
              <span className="text-muted-foreground font-bold">
                {issue.count} times
              </span>
            </div>
          </div>
        </div>

        <Separator />
      </CardContent>
    </Card>
  );
}

// Main component
export default function IssuesSummary() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedIssue, setSelectedIssue] = useState(dummyIssues[0].id);
  const [isSummaryExpanded, setSummaryExpanded] = useState(true);

  const selectedIssueData =
    dummyIssues.find((i) => i.id === selectedIssue) || dummyIssues[0];

  const visitRun = (runId: string) => {
    console.log(`Navigating to run: ${runId}`);
  };

  const visitFlow = (flowName: string) => {
    console.log(`Navigating to flow: ${flowName}`);
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header - Above both panels */}
      <div className="px-4 pt-4 mb-4">
        <h2 className="text-2xl font-bold">
          Issue: {selectedIssueData.message}
        </h2>
      </div>

      {/* Content area with both panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content - Left */}
        <div className="flex-1 p-4 overflow-auto">
          <IssueSummaryCard issue={selectedIssueData} />
          <SampleRunsCard
            issue={selectedIssueData}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            visitRun={visitRun}
          />
        </div>

        {/* Right Panel - Flow Details */}
        <div className="w-96 p-4 bg-muted/10">
          <FlowDetailsCard issue={selectedIssueData} visitFlow={visitFlow} />
        </div>
      </div>
    </div>
  );
}
