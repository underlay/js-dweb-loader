const CID = require("cids")

function parseJSON(bytes, callback) {
	const string = bytes.toString("utf8")
	let res = null,
		error = null
	try {
		res = { document: JSON.parse(string) }
	} catch (e) {
		error = e
	} finally {
		callback(error, res)
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
}

const documentLoaders = {
	"ipfs://"(ipfs, path, callback) {
		ipfs.files.cat(path, (err, bytes) => {
			if (err) {
				callback(err)
			} else {
				parseJSON(bytes, callback)
			}
		})
	},
	"dweb:/ipfs/"(ipfs, path, callback) {
		let cid
		try {
			cid = new CID(path)
		} catch (e) {
			callback(e)
		}
		if (ipldLoaders.hasOwnProperty(cid.codec)) {
			ipfs.dag.get(path, (err, { value }) => {
				if (err) callback(err)
				else ipldLoaders[cid.codec](value, callback)
			})
		} else {
			callback(new Error("Unrecognized IPLD format"))
		}
	},
}

const keys = Object.keys(documentLoaders)

const getDocumentLoader = ipfs => (url, callback) => {
	const key = keys.find(key => url.indexOf(key) === 0)
	if (key) documentLoaders[key](ipfs, url.slice(key.length), callback)
	else callback(new Error("Could not load document", url))
}

module.exports = getDocumentLoader
