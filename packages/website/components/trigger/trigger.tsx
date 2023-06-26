import Image from "next/image";
import CollapsibleProperties from "../collapsible-properties/collapsible-properties";

/* eslint-disable-next-line */
export interface TriggerProps {
    Title: string;
    Description: string;
    ImageUrl: string;
    ImageAlt: string;
    TriggerType: "Instant" | "Scheduled";
    Properties: {
        Name: string;
        Description: string;
        Required: boolean;
        Type: string;
    }[];
}

export function Trigger(props: TriggerProps) {
    return (
        <div className="block max-w-md p-6 bg-gray-800 rounded-lg grow relative">
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
            <p className="font-normal text-gray-400 mt-2 min-h-[50px]">{props.Description}</p>

            <CollapsibleProperties Properties={props.Properties}/>

            <div className="text-gray-400 text-sm bg-gray-700 p-1 rounded-lg inline-flex items-center gap-1 absolute top-8 right-5">
                {
                    props.TriggerType == "Scheduled" ?
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 inline">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    :
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 inline">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                }

                {props.TriggerType == "Instant" ? "Instant" : "Scheduled"}
            </div>
        </div>
    );
}

export default Trigger;
