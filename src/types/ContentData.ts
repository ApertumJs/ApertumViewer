export default interface ContentData{
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