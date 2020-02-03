const jsonld = require("jsonld")
const IPFS = require("ipfs-http-client")
const { Buffer } = IPFS

const ipfs = IPFS()
const documentLoader = require("./index.js")(ipfs)

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
			.expand(docUri, { documentLoader })
			.then(expanded => {
				console.log("expanded", expanded)
				jsonld.compact(expanded, contextUri, {documentLoader})
			})
			.then(result => {
				console.log(JSON.stringify(result, null, "  "))
				process.exit()
			})
	})
})
