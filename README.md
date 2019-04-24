# jsonld-dweb-loader

JSON-LD document loader for IPFS and IPLD

```json
{
	"@context": "dweb:/ipfs/QmUFeUYXqyKa1mXLyfiCkm1MDbwYPTFBpyKvW7Nhy98Ks1",
	"@type": "Digest",
	"digestAlgorithm": "http://www.w3.org/2000/09/xmldsig#sha1",
	"digestValue": "981ec496092bf6ee18d6255d96069b528633268b"
}
```

<<< [Golang implementation](https://gist.github.com/joeltg/0cdbe1e058197b0058e9f8ea8dbbd7e9) >>>

## Motivation

Suppose you have some JSON-LD, like this example taken from the [W3C Security Vocabulary](https://web-payments.org/vocabs/security#Digest):

```json
{
	"@context": "https://w3id.org/security/v1",
	"@type": "Digest",
	"digestAlgorithm": "http://www.w3.org/2000/09/xmldsig#sha1",
	"digestValue": "981ec496092bf6ee18d6255d96069b528633268b"
}
```

Making _any_ sense of this document requires fetching the context from `https://w3id.org/security/v1` to resolve the properties and types. For example, the context is what tells us that `digestValue` is an abbrviation of `https://web-payments.org/vocabs/security#digestValue`.

Contexts are wonderful and elegant and an huge feature of JSON-LD, but just to be practical in the real world, contexts need to be cached so that we don't have to hit the network every time we see someone using something from the W3C security vocabulary (and the JSON-LD folks will be the [first to tell you this](http://manu.sporny.org/2016/json-ld-context-caching/)).

This is all well and good, but what if I'm not the W3C and want to publish a context that I expect to re-use (or other people to re-use)? I don't want to commit to hosting something on a permanent URL until the end of time. And I probably don't have as good security practices as they do, so if someone gets into my server they can rename `digestValue` to `http://white.house/NuclearLaunchCodes` or something nefarious without anyone noticing (you never really know if the context that you get served was the same context that the author of the document intended). _I want to cache my contexts, but I'm not in a position to host it at a URL._

_enter the decentralized web_

## Puttting Contexts on IPFS

IPFS is a decentralized filesystem that names files by their hash and lets you ask for them from the network at large, from no particular location, just whoever happens to have them, similar to BitTorrent. You can pin files you really care about to guarantee their availability, but any node that has the file will help you retrieve it.

Even better, IPFS can caches files automatically: once you fetch a file from the network, you become your own closest peer, and subsequent requests for that file return without touching the network at all. The beauty of content-addressing is that we know the contents haven't changed!

So what if I was worried the W3C was going to get hacked, or if I just wanted a built-in way of caching my contexts, I could use IPFS like this:

First, I get the file from its current URL and add it to IPFS

```
joel$ curl -L https://w3id.org/security/v1 | ipfs add
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   310  100   310    0     0   2259      0 --:--:-- --:--:-- --:--:--  2246
100  2019  100  2019    0     0   5790      0 --:--:-- --:--:-- --:--:--  5790
added QmUFeUYXqyKa1mXLyfiCkm1MDbwYPTFBpyKvW7Nhy98Ks1 QmUFeUYXqyKa1mXLyfiCkm1MDbwYPTFBpyKvW7Nhy98Ks1
joel$
joel$ ipfs cat QmUFeUYXqyKa1mXLyfiCkm1MDbwYPTFBpyKvW7Nhy98Ks1
{
  "@context": {
    "id": "@id",
    "type": "@type",

    "dc": "http://purl.org/dc/terms/",
    "sec": "https://w3id.org/security#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",

    "EcdsaKoblitzSignature2016": "sec:EcdsaKoblitzSignature2016",
...
```

Then I rename my JSON-LD document to reference the IPFS URI:

```json
{
	"@context": "dweb:/ipfs/QmUFeUYXqyKa1mXLyfiCkm1MDbwYPTFBpyKvW7Nhy98Ks1",
	"@type": "Digest",
	"digestAlgorithm": "http://www.w3.org/2000/09/xmldsig#sha1",
	"digestValue": "981ec496092bf6ee18d6255d96069b528633268b"
}
```

Let's even add _that_ document to IPFS, just for fun:

```
joel$ ipfs add sample.jsonld
added QmXjY3nz81qG99vbMF4Tb2NeSFmUdWBUG7ecYVtvnGxrXt sample.jsonld
joel$ ipfs cat QmXjY3nz81qG99vbMF4Tb2NeSFmUdWBUG7ecYVtvnGxrXt
{
  "@context": "dweb:/ipfs/QmUFeUYXqyKa1mXLyfiCkm1MDbwYPTFBpyKvW7Nhy98Ks1",
  "@type": "Digest",
  "digestAlgorithm": "http://www.w3.org/2000/09/xmldsig#sha1",
  "digestValue": "981ec496092bf6ee18d6255d96069b528633268b"
}
```

Then unleash the magic!

```javascript
const createDocumentLoader = require("jsonld-dweb-loader")
const IPFS = require("ipfs")
const jsonld = require("jsonld")

const ipfs = new IPFS({})
ipfs.on("ready", () => {
	const doc = "dweb:/ipfs/QmXjY3nz81qG99vbMF4Tb2NeSFmUdWBUG7ecYVtvnGxrXt"
	const documentLoader = createDocumentLoader(ipfs)
	jsonld.expand(doc, { documentLoader }, (err, expanded) => {
		console.log(err, JSON.stringify(expanded))
		process.exit()
	})
})
```

```
joel$ node test.js
context: dweb:/ipld/zdpuB2s6SPPu2TPv6RBUY7FhJkghnYfc7dDvz5Luyw4wosde1
document: ipfs://QmPm5sCx6HLSmdJHFrozmsVNxC6mrE3VMHH7XuTQmtqUuA
{
  "@context": "dweb:/ipld/zdpuB2s6SPPu2TPv6RBUY7FhJkghnYfc7dDvz5Luyw4wosde1",
  "@graph": [
    {
      "@type": "schema:Person",
      "schema:knows": {
        "@type": "schema:Person",
        "schema:name": "Bob"
      },
      "schema:name": "Alice"
    }
  ],
  "prov:wasAttributedTo": {
    "@type": "schema:Person",
    "schema:name": "Eve"
  }
}
```

## Support

This loader supports JSON-encoded contexts and documents on IPFS under the `dweb:/ipfs/` and `ipfs://` URI schemes (the loader will atempt to parse those files into JSON and will throw an error if that fails), as well as the `dag-cbor`, `dag-json`, `dab-pb`, and `raw` IPLD formats.

`dag-cbor` and `dag-json` both deserialize directly to JSON objects, which are used directly. This loader will attempt to parse `dab-pb` and `raw` blocks as JSON and will throw an error if unsuccessful.
