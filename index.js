const CID = require("cids")

async function ipldLoader(ipfs, path) {
	const cid = new CID(path)
	if (cid.codec === "dag-cbor") {
		return ipfs.dag.get(path).then(({ value }) => ({ document: value }))
	} else {
		throw new Error("Unsupported IPLD codec")
	}
}

function ipfsLoader(ipfs, path) {
	return ipfs.cat(path).then(bytes => ({ document: JSON.parse(bytes) }))
}

const documentLoaders = {
	"ipld://": ipldLoader,
	"dweb:/ipld/": ipldLoader,
	"ipfs://": ipfsLoader,
	"dweb:/ipfs/": ipfsLoader,
}

const prefixes = Object.keys(documentLoaders)

module.exports = ipfs => async (url, options) => {
	const prefix = prefixes.find(prefix => url.indexOf(prefix) === 0)
	if (prefix) {
		return documentLoaders[prefix](ipfs, url.slice(prefix.length))
	} else {
		throw new Error("Could not load document", url)
	}
}
