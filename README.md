# iota-laboratory.github.io
Build and send IOTA transactions/blocks manually in your browser

<a href="https://iota-laboratory.github.io/">Use online</a>

## Offline usage

While IOTA Laboratory is primarly intended for online use, it has rudimentary
support for signing transactions offline.

To to so, download this repository (via `git` or as `.zip` file, then open
`embed-wasm.html` while you are still online. This will download the IOTA SDK's
WASM blob from the CDN and embed it into `embed_iota_sdk_wasm.min.js` which will
be placed in your Downloads folder. Copy it into the same folder as the rest of
the downloaded files, and you will be able to use the IOTA Laboratory (only
the Configuration, Block Payload Editor, and Signer tabs) without an Internet
connection.

You would first use the Signer tab to get a list of addresses that correspond
to your seed/mnemonic, and copy it to an online machine, where you can use it
to find unspent outputs and build an "unsigned" transaction payload in the
Block Payload Editor (without needing the seed/mnemonic). This payload will
contain dummy Signature Unlocks. Copy the payload to your offline machine,
and use the Signer to replace the dummy Signature Unlocks by valid ones. The
resulting payload can then be copied back to the online machine, where it can
be sent, and reattached/promoted if required.

## Tab overview

- **Configuration**: Here you can configure your network settings and
  mnemonics/seeds. Settings can be stored either in the current browser window
  or in local storage / session storage. Note that the protection of seed/mnemonic
  is weaker than in a standalone wallet, so don't use this for seeds with lots of
  funds unless you absolutely have to.
- **Client** *(online)*: Shows information about your online connection and contains
  functions for converting various IDs into Bech32 addresses. All other Client
  functions have been moved to other tabs.
- **Milestone** *(online)*: Retrieve milestones and their metadata. Milestone payloads
  can be viewed in Block Payload Editor.
- **Block Retriever** *(online)*: Retrieve blocks that already exist on the network.
  Metadata for the block is shown here, the payload is shown in the Block Payload Editor.
  Also enables you to reattach or promote arbitrary blocks.
- **Wallet** *(online+authenticated)*: This tab contains convenience functions you may
  know from wallet applications (e.g. send or burn tokens or NFTs, or manage NFTs, tokens,
  aliases and foundries. All functions available here can also be performed manually using
  the other tabs, if you know how the resulting transaction needs to look like. You can
  choose whether transactions should be sent immediately or shown in the Block Payload Editor
  to edit before sending. Addresses found in the Wallet can be copied to the next tab.
- **Addresses** *(online)*: Here you can scan addresses for unspent outputs, or other
  possesions (e.g. aliases or NFTs). Their addresses can be added to the list as well.
  Every found unspent output can be added as input, or both as input and output to the
  Block Payload Editor. The Network ID and inputs commitment of the current block can also
  be updated based on the added inputs.
- **Block Payload Editor**: Here you can do *everything* - edit every field of your
  payload, change types, copy & paste parts around, etc.
- **Signer** *(authenticated)*: Here you can generated address lists offline, or check the
  currently edited payload for missing/invalid signatures that you can add with your
  mnemonic/seed.
- **Block Submitter** *(online)*: When you are done editing, you can send your finished
  block to the network.
