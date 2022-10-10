export default interface WallContent {
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