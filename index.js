const CID = require("cids")

function ipldLoader(ipfs, path, callback) {
	let cid
	try {
		cid = new CID(path)
	} catch (e) {
		callback(e)
	}
	if (cid.codec === "dag-cbor" || cid.codec === "dag-json") {
		ipfs.dag.get(path, (err, { value }) => {
			if (err) {
				callback(err)
			} else {
				callback(null, { document: value })
			}
		})
	} else {
		callback(new Error("Unsupported IPLD codecc"))
	}
}

function ipfsLoader(ipfs, path, callback) {
	ipfs.cat(path, (err, bytes) => {
		if (err) {
			callback(err)
		} else {
			const string = bytes.toString("utf8")
			let value = null,
				error = null
			try {
				value = { document: JSON.parse(string) }
			} catch (e) {
				error = e
			} finally {
				callback(error, value)
			}
		}
	})
}

const documentLoaders = {
	"ipld://": ipldLoader,
	"dweb:/ipld/": ipldLoader,
	"ipfs://": ipfsLoader,
	"dweb:/ipfs/": ipfsLoader,
}

const prefixes = Object.keys(documentLoaders)
const getDocumentLoader = ipfs => (url, callback) => {
	const prefix = prefixes.find(prefix => url.indexOf(prefix) === 0)
	if (prefix) {
		documentLoaders[prefix](ipfs, url.slice(prefix.length), callback)
	} else {
		callback(new Error("Could not load document", url))
	}
}

module.exports = getDocumentLoader
