import React from "react";
import { DataSelectorNodeContent } from "./data-selector-utils";
import { CollapsibleTrigger, CollapsibleContent, Collapsible } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestStepNotice } from "./test-step-notice";

type DataSelectorNodeProps = {
  node: DataSelectorNodeContent
}

const DataSelectorNode = (props: DataSelectorNodeProps) => {
  const { node } = props;

  const isExpandable = node.children && node.children.length > 0 || node.isTestStepNode;
  const [expanded, setExpanded] = React.useState(false);
  const marginLeft = `${node.depth * 35}px`;

  return <>
    <Collapsible open={expanded} className="w-full">
      <CollapsibleTrigger asChild={true}>
        <div className={`flex items-start justify-center w-full gap-3 p-2 items-center hover:bg-accent hover:text-accent-foreground h-full`}>
          <div style={{
            marginLeft
          }}>
            {node.label}
          </div>
          <div className="flex flex-grow"></div>
          <Button variant={"basic"} size={"sm"} >
            Insert
          </Button>
          <div className="h-full flex  items-center">
            {expanded && isExpandable && <ChevronDown className="w-4 h-4" onClick={() => setExpanded(false)}></ChevronDown>}
            {!expanded && isExpandable && <ChevronRight className="w-4 h-4" onClick={() => setExpanded(true)}></ChevronRight>}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-0">
        {node.isTestStepNode && <TestStepNotice></TestStepNotice>}
        {node.children && node.children.map((child, index) => {
          return <DataSelectorNode key={index} node={child}></DataSelectorNode>;
        })}
      </CollapsibleContent>
    </Collapsible>
  </>
};

export { DataSelectorNode };