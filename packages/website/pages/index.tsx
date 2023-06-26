import { useEffect, useState } from "react";
import Action from "../components/action/action";
import Trigger from "../components/trigger/trigger";
import Image from "next/image";

export type Piece = {
    name: string;
    version: string;
    displayName: string;
    description: string;
    logoUrl: string;
    actions: {
        [key: string]: {
            displayName: string;
            description: string;
            props: {
                [key: string]: {
                    displayName: string;
                    required: boolean;
                    type: string;
                    description: string | undefined;
                }
            }
        }
    };
    triggers: {
        [key: string]: {
            displayName: string;
            description: string;
            props: {
                [key: string]: {
                    displayName: string;
                    required: boolean;
                    type: string;
                    description: string | undefined;
                }
            };
            type: string;
        }
    };
}

export type ActionType = {
    displayName: string;
    description: string;
    props: {
        [key: string]: {
            displayName: string;
            required: boolean;
            description: string | undefined;
            type: string;
        }
    }
}

export type TriggerType = {
    displayName: string;
    description: string;
    props: {
        [key: string]: {
            displayName: string;
            required: boolean;
            type: string;
            description: string | undefined;
        }
    };
    type: string;
}

async function GetVersion() {
    const res = await fetch('https://raw.githubusercontent.com/activepieces/activepieces/main/package.json')

    if (!res.ok) {
        throw new Error('Failed to fetch data')
    }

    return (await res.json()).version
}

async function GetPieces(Version: string) {
    // https://cloud.activepieces.com/api/v1/pieces?release=version
    const res = await fetch(`https://cloud.activepieces.com/api/v1/pieces?release=${Version}`)
    if (!res.ok) {      
        throw new Error('Failed to fetch data')
    }

    const data = await res.json()
    const pieces: {version: string, name: string}[] = []
    data.forEach(async (element) => {
        pieces.push({
            version: element.version,
            name: element.name
        });
    });

    return pieces;
}

export async function GetPiece(Version: string, Name: string): Promise<Piece> {
    // https://cloud.activepieces.com/api/v1/pieces/<Name>?version=<Version>
    const res = await fetch(`https://cloud.activepieces.com/api/v1/pieces/${Name}?version=${Version}`)
    console.log(`https://cloud.activepieces.com/api/v1/pieces/${Name}?version=${Version}`);
    
    if (!res.ok) {
        throw new Error('Failed to fetch data')
    }

    const data = await res.json()
    return {
        name: Name,
        version: Version,
        displayName: data.displayName,
        description: data.description,
        logoUrl: data.logoUrl,
        actions: data.actions,
        triggers: data.triggers
    };
}

export function Index() {
    const [version, setVersion] = useState("0.0.0")
    const [BasePieces, setBasePieces] = useState<{version: string, name: string}[]>([])
    const [pieces, setPieces] = useState<Piece[]>([])
    
    GetVersion().then((version) => {
        setVersion(version);
    });

    useEffect(() => {
        GetPieces(version).then((pieces) => {
            setBasePieces(pieces);
        });
    }, [version])

    useEffect(() => {
        BasePieces.forEach((piece) => {
            GetPiece(piece.version, piece.name).then((piece) => {
                setPieces((pieces) => [...pieces, piece]);
            });
        });
    }, [BasePieces])

    return (
        // grid
        <div className="grid grid-cols-3 gap-3 m-5">
            {
                pieces.map((piece, i) => {
                    return (
                        <div className="bg-gray-700 p-5 rounded-lg text-center cursor-pointer" key={piece.displayName} onClick={() => {window.location.href = `/piece/${piece.name.replace("@activepieces/", "")}/${piece.version}`}}>
                            <Image
                                src={piece.logoUrl}
                                alt={piece.displayName}
                                width={50}
                                height={50}
                                className="m-auto"
                            />
                            <h1 className="text-3xl text-white">{piece.displayName}</h1>
                        </div>
                    )
                })
            }
        </div>
    );
}

export default Index;
