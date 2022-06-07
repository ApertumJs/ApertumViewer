interface GalleryData {
    uid: string,
    alias: string,
    name: string,
    synopsis: string,
    description: string,
    dateCreated: string,
    dateUpdated: string,
    galleryTags: string[],
    localStorage: boolean
}
interface WallContent {
    contentId: string,
    type: string,
    width: number,
    height: number,
    top: number,
    left: number,
    frameIndex: number,
    shadow: {
        color: string,
        spread: number,
        hShadow: number,
        vShadow: number,
        blur: number
    },
    disable:boolean
}

interface Wall {
    id: number,
    height: number,
    width: number,
    angle: number,
    color: string | null,
    backgroundImage: string | null,
    backgroundPattern: string | null,
    audio: string | null,
    contents: WallContent[]
}
interface Frame{
    id?: string,
    name?: string,
    frameWidth: number,
    frameImageUrl: string,
    frameColor: string,
    matWidth: number,
    matColor: string,
    isGlassed: boolean
}
interface Room {
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
interface ContentData{
    id: string
    type: string,
    group: number,
    name: string,
    info?: string,
    realDimensions?:{
        height: number,
        width: number,
        show:boolean
    },
    file?:{
        name: string,
        size: number,
        url: string,
    },
    video?: {
        source: string,
        id: string,
        loop?: boolean,
        autoplay?: boolean
    }
}
interface Navigation {
    positionX:number,
    positionZ:number,
    angleDeg:number,
    transitionDuration?:number
}
type Point = [number, number];
