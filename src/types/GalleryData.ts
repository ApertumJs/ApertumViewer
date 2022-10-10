export default interface GalleryData {
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