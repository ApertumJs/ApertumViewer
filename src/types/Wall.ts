import WallContent from './WallContent'
export default interface Wall {
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