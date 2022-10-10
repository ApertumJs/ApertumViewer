import Wall from "./Wall";
import Frame from "./Frame";

export default interface Room {
    walls: Wall[],
    colors: {
        ceiling: string,
        floor: string
    },
    background?: {
        ceiling: string,
        floor: string
    },
    patterns?: {
        ceiling: string,
        floor: string
    },
    generalAudio?: string,
    frames?: Frame[],
    hasWallsPreview?: boolean,
    options: {
        resolutionQuality:number,
        initialZoom: number,
        disableHumanRef: boolean,
        hideLogo: boolean
    };
}