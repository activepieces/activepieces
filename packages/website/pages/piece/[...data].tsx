import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { ActionType, GetPiece, Piece, TriggerType } from '..';
import Action from "../../components/action/action";
import Trigger from "../../components/trigger/trigger";
import Image from 'next/image';

export default function Page() {
    const router = useRouter()
    const [piece, setPiece] = useState<Piece>()
    const [Actions, setActions] = useState<ActionType[]>([])
    const [Triggers, setTriggers] = useState<TriggerType[]>([])
    
    useEffect(() => {
        
        const d = router.query.data as string[];
        if(d == undefined) return;
        
        if (!Array.isArray(d)) {
            // router.push("/");
            console.log("not array");
            
            return;
        }
        
        const n = d[0];
        const v = d[1];
        if(n == undefined || v == undefined) {
            // router.push("/");
            console.log("undefined");
            
            return;
        }
        // chcek if version is valid
        if(!/^\d+\.\d+\.\d+$/.test(v)) {
            // router.push("/");
            console.log("invalid version");
            return;
        }

        GetPiece(v, `@activepieces/${n}`).then((piece) => {
            setPiece(piece);
        });

    }, [router])

    useEffect(() => {
        if(piece == undefined) return;
        const ActionList: ActionType[] = [];
        const TriggerList: TriggerType[] = [];
        Object.keys(piece.actions).forEach((action) => {
            ActionList.push({
                displayName: piece.actions[action].displayName,
                description: piece.actions[action].description,
                props: piece.actions[action].props
            });
        });

        Object.keys(piece.triggers).forEach((trigger) => {
            TriggerList.push({
                displayName: piece.triggers[trigger].displayName,
                description: piece.triggers[trigger].description,
                props: piece.triggers[trigger].props,
                type: piece.triggers[trigger].type
            });
        });

        setActions(ActionList);
        setTriggers(TriggerList);
    }, [piece])

    return (
        <div className='bg-gray-900 text-white w-full min-h-[100vh]'>

            <div className='flex justify-center items-center flex-col py-8'>
                <Image
                    src={piece?.logoUrl}
                    alt={piece?.displayName}
                    width={100}
                    height={100}
                    className='block'
                />

                <h1 className='my-5 text-3xl font-semibold block'>Automate your work with <span className='inline-block text-2xl sm:text-3xl font-bold text-gray-200'>{piece?.displayName}</span></h1>
                <span>
                    {piece?.description}
                </span>
            </div>

            {
                Triggers.length > 0 && (
                    <div className='flex justify-center items-center flex-col py-3'>
                        <h2 className='text-3xl font-semibold'>Triggers</h2>

                        <div className='flex flex-wrap justify-center items-start mt-10 gap-4'>
                            {
                                Triggers.map((trigger) => {
                                    return (
                                        <Trigger
                                            ImageUrl={piece.logoUrl}
                                            ImageAlt={piece.displayName}
                                            Title={trigger.displayName}
                                            Description={trigger.description}
                                            key={trigger.displayName}
                                            Properties={Object.keys(trigger.props).map((prop) => {
                                                return {
                                                    Name: trigger.props[prop].displayName,
                                                    Description: trigger.props[prop].description ?? "",
                                                    Required: trigger.props[prop].required,
                                                    Type: trigger.props[prop].type 
                                                }
                                            })}
                                            TriggerType={trigger.type == "POLLING" ? "Scheduled" : "Instant"}
                                        />
                                    )
                                })
                            }
                        </div>
                    </div>
                )
            }
            
            {
                Actions.length > 0 && (                
                    <div className='flex justify-center items-center flex-col py-3'>
                        <h2 className='text-3xl font-semibold'>Actions</h2>

                        <div className='flex flex-wrap justify-center items-start mt-10 gap-4'>
                            {
                                Actions.map((action) => {
                                    return (
                                        <Action
                                            ImageUrl={piece.logoUrl}
                                            ImageAlt={piece.displayName}
                                            Title={action.displayName}
                                            Description={action.description}
                                            key={action.displayName}
                                            Properties={Object.keys(action.props).map((prop) => {
                                                return {
                                                    Name: action.props[prop].displayName,
                                                    Description: action.props[prop].description ?? "",
                                                    Required: action.props[prop].required,
                                                    Type: action.props[prop].type
                                                }
                                            })}
                                        />
                                    )
                                })
                            }
                        </div>
                    </div>
                )
            }

            {/* {
                piece == undefined ? <div>Loading...</div> :
                <div>
                    <h1>{piece.displayName}</h1>
                    <p>{piece.description}</p>
                    <h2>Actions</h2>
                    {
                        Actions.map((action) => {
                            return (
                                <Action
                                    ImageUrl={piece.logoUrl}
                                    ImageAlt={piece.displayName}
                                    Title={action.displayName}
                                    Description={action.description}
                                    key={action.displayName}
                                    Properties={Object.keys(action.props).map((prop) => {
                                        return {
                                            Name: prop,
                                            Description: action.props[prop].description ?? "",
                                            Required: action.props[prop].required
                                        }
                                    })}
                                />
                            )
                        })
                    }
                    <h2>Triggers</h2>
                    {
                        Triggers.map((trigger) => {
                            return (
                                <Trigger
                                    ImageUrl={piece.logoUrl}
                                    ImageAlt={piece.displayName}
                                    Title={trigger.displayName}
                                    Description={trigger.description}
                                    key={trigger.displayName}
                                    Properties={Object.keys(trigger.props).map((prop) => {
                                        return {
                                            Name: prop,
                                            Description: trigger.props[prop].description ?? "",
                                            Required: trigger.props[prop].required
                                        }
                                    })}
                                    TriggerType={trigger.type == "POLLING" ? "Scheduled" : "Instant"}
                                />
                            )
                        })
                    }
                </div>
            } */}
        </div>
    )
}