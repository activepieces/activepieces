import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Zap } from 'lucide-react';
import { McpToolsSection } from '@/app/routes/mcp-servers/id/mcp-config/mcp-tools-section';


const AutomateData = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [agentRunType, setAgentRunType] = useState('on-demand');
  const [agentDescription, setAgentDescription] = useState('');

  const handleSave = () => {
    console.log('Automate Data Agent Saved:', {
      agentRunType,
      agentDescription,
    });
    setDialogOpen(false);
  };

  return (
    <>
      <Button variant="default" onClick={() => setDialogOpen(true)}>
        Automate Data
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data Agent</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" />
              <span className="font-medium">Agent Run Trigger</span>
            </div>
            <div className="text-muted-foreground text-sm mb-2">
              When do you want the agent to run?
            </div>
            <Select value={agentRunType} onValueChange={setAgentRunType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select run type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on-demand">On Demand</SelectItem>
                <SelectItem value="on-row-updated">On Row Updated</SelectItem>
                <SelectItem value="on-new-row">On New Row</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="border-t border-border my-4" />
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4" />
              <span className="font-medium">Agent Behavior</span>
            </div>
            <Textarea
              value={agentDescription}
              onChange={e => setAgentDescription(e.target.value)}
              placeholder="When there is new row, do the following then once you are done, update the row with the result"
              minRows={4}
            />
          </div>
          <McpToolsSection mcpId="odpIIAbUDhVXLq2A6u1AO" showEmptyState={false} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { AutomateData };