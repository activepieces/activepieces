import Image from "next/image";
import CollapsibleProperties from "../collapsible-properties/collapsible-properties";

/* eslint-disable-next-line */
export interface ActionProps {
    Title: string;
    Description: string;
    ImageUrl: string;
    ImageAlt: string;
    Properties: {
        Name: string;
        Description: string;
        Required: boolean;
        Type: string;
    }[];
}

export function Action(props: ActionProps) {
  return (
    <div className="block max-w-md min-w-min p-6 bg-gray-800 rounded-lg grow">

        <div className="flex items-center">
            <Image
                src={props.ImageUrl}
                alt={props.ImageAlt}
                width={50}
                height={50}
                className="inline-block"
            />
            <h5 className="inline-block ml-2 text-xl font-semibold tracking-tight text-white w-1/2">{props.Title}</h5>
        </div>
        <p className="font-normal text-gray-400">{props.Description}</p>

        <CollapsibleProperties Properties={props.Properties}/>
    </div>
  );
}

export default Action;
