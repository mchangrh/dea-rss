export interface deArrowBase {
  original: boolean,
  votes: number,
  locked: boolean,
  uuid: string
}
export interface deArrowTitle extends deArrowBase {
  title: string,
}
export interface deArrowThumb extends deArrowBase {
  timestamp: number | null,
}
export interface deArrowData {
  titles: deArrowTitle[],
  thumbnails: deArrowThumb[],
  randomTime: number,
  videoDuration: number,
}
export interface ytData {
  title: string,
  author_name: string,
  author_url: string,
  type: string,
  height: number,
  width: number,
  version: string,
  provider_name: string,
  provider_url: string,
  thumbnail_height: number,
  thumbnail_width: number,
  thumbnail_url: string,
  html: string,
}