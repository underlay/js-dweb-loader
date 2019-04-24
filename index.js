const CID = require("cids")

function parseJSON(bytes, callback) {
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

const ipldLoaders = {
	raw(value, callback) {
		parseJSON(value, callback)
	},
	"dag-pb"(value, callback) {
		parseJSON(value.data, callback)
	},
	"dag-cbor"(value, callback) {
		callback(null, { document: value })
	},
	"dag-json"(value, callback) {
		callback(null, { document: value })
	},
}

function ipldLoader(ipfs, path, callback) {
	let cid
	try {
		cid = new CID(path)
	} catch (e) {
		callback(e)
	}
	if (ipldLoaders.hasOwnProperty(cid.codec)) {
		ipfs.dag.get(path, (err, { value }) => {
			if (err) {
				callback(err)
			} else {
				ipldLoaders[cid.codec](value, callback)
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
			parseJSON(bytes, callback)
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
