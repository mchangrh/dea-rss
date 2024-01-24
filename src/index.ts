export interface Env {}

import { deArrowData, ytData} from "./types"

const getFeed = (channelID: string) =>
	fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelID}`)
		.then(res => res.text())

const getVideoIDs = (body: string) =>
	[...body.matchAll(/<yt:videoId>([0-9A-Za-z_-]{11})<\/yt:videoId>/g)]
		.map(id => id[1])

const getDeArrowData = (videoID: string): Promise<deArrowData> =>
	fetch(`https://sponsor.ajay.app/api/branding?videoID=${videoID}`)
	.then(res => res.json() as unknown as deArrowData)

const getYtData = (videoID: string):Promise<ytData> =>
	fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoID}&format=json`)
	.then(res => res.json())

async function getDeArrow(videoID: string) {
	const data = await getDeArrowData(videoID)
	const ytData = await getYtData(videoID)
	const timestamp = data.thumbnails?.[0]?.timestamp
	const thumbnail = timestamp
		? `https://dearrow-thumb.ajay.app/api/v1/getThumbnail?videoID=${videoID}&time=${timestamp}`
		: `https://i.ytimg.com/vi/${videoID}/hqdefault.jpg`
	const title = data.titles?.[0]?.title ?? ytData.title
	return {
		title,
		thumbnail,
		ytData
	}
}

async function deArrowFeed(feed: string): Promise<string> {
	const ids = getVideoIDs(feed)
	const replaceChunkMatch = (search: RegExp, chunk: string, replacement: string) => {
		const match = chunk.match(search)?.[1]
		if (match) feed = feed.replace(match, replacement)
		return feed
	}
	for (const id of ids) {
		// get data
		const deData = await getDeArrow(id)
		// find chunk
		const chunkRegex = new RegExp(`(<entry>\\s*<id>yt:video:${id}<\/id>(.|\\n)+?<\/entry>)`)
		const chunkMatch = feed.match(chunkRegex)
		if (!chunkMatch) continue
		const chunk = chunkMatch[1]
		// replace title in entry
		const entryTitleRegex = new RegExp(`<title>(.+?)<\/title>`)
		feed = replaceChunkMatch(entryTitleRegex, chunk, deData.title)
		// replace title in media
		const mediaTitleRegex = new RegExp(`<media:title>(.+?)<\/media:title>`)
		feed = replaceChunkMatch(mediaTitleRegex, chunk, deData.title)
		// replace thumbnail
		const thumbnailRegex = new RegExp(`<media:thumbnail url="(.+?)" width`)
		const correctedThumb = deData.thumbnail.replace("&", "&amp;")
		feed = replaceChunkMatch(thumbnailRegex, chunk, correctedThumb)
	}
	return feed
}

export const worker = {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise < Response > {
		const url = new URL(request.url)
		const channelID = url.pathname.split("/").pop()
		if (!channelID) return new Response('No ChannelID in path', { status: 400 })
		const data = await getFeed(channelID)
			.then(feed => deArrowFeed(feed))
			.catch(err => err)
		if (typeof data !== "string") return new Response(data, { status: 500 })
		return new Response(data, {
			status: 200,
			headers: {
				"Content-Type": "text/xml; charset=UTF-8"
			}
		})
	},
};
export default worker