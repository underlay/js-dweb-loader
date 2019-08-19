const jsonld = require("jsonld")
const IPFS = require("ipfs-http-client")
const { Buffer } = IPFS

const createDocumentLoader = require("./index.js")

const ipfs = IPFS()
const documentLoader = createDocumentLoader(ipfs)

jsonld.documentLoader = documentLoader

const context = {
	schema: "http://schema.org/",
	prov: "http://www.w3.org/ns/prov#",
}

ipfs.dag.put(context).then(cid => {
	const contextUri = `dweb:/ipld/${cid.toBaseEncodedString()}`
	console.log("context:", contextUri)
	const doc = {
		"@context": contextUri,
		"prov:wasAttributedTo": {
			"@type": "schema:Person",
			"schema:name": "Eve",
		},
		"@graph": {
			"@type": "schema:Person",
			"schema:name": "Alice",
			"schema:knows": {
				"@type": "schema:Person",
				"schema:name": "Bob",
			},
		},
	}

	const bytes = Buffer.from(JSON.stringify(doc))
	ipfs.add(bytes).then(([{ hash }]) => {
		const docUri = `ipfs://${hash}`
		console.log("document:", docUri)
		jsonld
			.expand(docUri)
			.then(expanded => jsonld.compact(expanded, contextUri))
			.then(result => {
				console.log(JSON.stringify(result, null, "  "))
				process.exit()
			})
	})
})
