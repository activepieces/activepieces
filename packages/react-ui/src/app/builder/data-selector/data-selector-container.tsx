import { Expand, Fullscreen } from "lucide-react";
import { DataSelectorNode } from "./data-selector-node";
import { DataSelectorNodeContent } from "./data-selector-utils";



const steps: DataSelectorNodeContent[] = [
  {
    jsonPath: 'Step',
    label: 'Step',
    depth: 0,
    children: [
      {
        jsonPath: 'a',
        label: 'c',
        depth: 1,
        children: [
          {
            depth: 2,
            jsonPath: 'd',
            label: <div>e</div>,
          },
          {
            depth: 2,
            jsonPath: 'g',
            label: <div>h</div>,
          },
        ],
      },
    ],
  },
  {
    jsonPath: 'Step',
    label: 'Step',
    depth: 0,
    isTestStepNode: true,
  }
]
const DataSelectorContainer = () => {
  return <div className="fixed right-[100px] bottom-[100px] bg-background w-[400px] h-[400px] z-50 border-2">
    <div className="flex items-center justyf-center p-2">
      <div>
        B3arfa Data Selector
      </div>
      <div className="flex flex-grow"></div>
      <div className="flex items-center gap-2">
          <Expand className="w-4 h-4"></Expand>
          <Fullscreen className="w-4 h-4"></Fullscreen>
      </div>
    </div>
    {steps.map((node, index) => {
      return <DataSelectorNode key={index} node={node}></DataSelectorNode>;
    })}
  </div>;
};

export { DataSelectorContainer };