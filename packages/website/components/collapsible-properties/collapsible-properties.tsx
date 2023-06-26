/* eslint-disable-next-line */
export interface CollapsiblePropertiesProps {
    Properties: {
        Name: string;
        Description: string;
        Required: boolean;
        Type: string; 
    }[];
}

export function CollapsibleProperties(props: CollapsiblePropertiesProps) {
    return (
        <div className="relative w-full overflow-hidden">
            <input type="checkbox" className="peer absolute top-0 inset-x-0 w-full h-12 opacity-0 z-10 cursor-pointer"/>
            <div className="h-12 w-full pl-8 flex items-center">
                <h1 className="font-normal text-gray-400">
                    Options
                </h1>
            </div>

            <div className="absolute top-[15px] left-0 text-gray-400 transition-transform duration-500 rotate-0 peer-checked:rotate-180">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </div>

            <div className="text-white overflow-hidden transition-transform duration-500 max-h-0 peer-checked:max-h-fit">
                <div className="border-l-[1px] px-1 mx-[0.6rem] border-gray-700">
                    {
                        props.Properties.map((property) => (
                            <div className="border-b-[1px] px-3 border-gray-700 py-3 relative" key={property.Name}>
                                <span className="text-base block rounded-md font-semibold w-1/2"><span className="text-[#696eed]">{property.Name}</span> <span className="font-normal text-gray-400 opacity-75">{property.Required ? "required" : ""}</span></span>
                                <span className="font-normal text-gray-400 absolute top-3 right-3">{property.Type.charAt(0).toUpperCase() + property.Type.slice(1).toLowerCase()}</span>
                                <span className="font-normal text-gray-400 block pl-2">{property.Description}</span>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

export default CollapsibleProperties;
