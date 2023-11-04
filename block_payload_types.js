"use strict";

// expose constructor for TreasuryTransactionPayload
let treasuryTransactionPayloadConstructor = iotaSdkWasm.parsePayload({type:4}).constructor;

let blockPayloadTypes = {
	Address: {a: true, s:[]},
	Feature: {a: true, s:[]},
	Input: {a: true, s:[]},
	MilestoneOption: { a: true, s:[]},
	Output: {a: true, s:[]},
	Payload: {a: true, s:[]},
	Signature: {a: true, s:[]},
	TokenScheme: {a: true, s:[]},
	TransactionEssence: {a: true, s:[]},
	Unlock: {a: true, s:[]},
	UnlockCondition: {a: true, s:[]},
	AddressUnlockCondition: {e: "UnlockCondition", d: "An address unlock condition.", f: [
		{n: "address", t: "Address", d: "The address that needs to be unlocked with a private key."},
	]},
	AliasAddress: {e: "Address", d: "An Alias address.", f: [
		{n: "aliasId", t: "(HexEncodedString)", d: "An Alias address as Alias ID."},
	]},
	AliasOutput: {e: "Output", d: "An Alias output.", cf: 5, f: [
		{n: "unlockConditions", t: "UnlockCondition[]", d: "The unlock conditions of the output."},
		{n: "amount", t: "(bigint)", d: "The amount of the output."},
		{n: "aliasId", t: "(HexEncodedString)", d: "The Alias ID as hex-encoded string."},
		{n: "stateIndex", t: "(number)", d: "A counter that must increase by 1 every time the alias is state transitioned."},
		{n: "foundryCounter", t: "(number)", d: "A counter that denotes the number of foundries created by this alias account."},
		{n: "nativeTokens", t: "NativeToken[]?", d: "Native tokens held by the output."},
		{n: "features", t:"Feature[]?", d:"The features contained by the output."},
		{n: "immutableFeatures", t: "Feature[]?", d: "Immutable features contained by the output."},
		{n: "stateMetadata", t: "(HexEncodedString)?", d: "Metadata that can only be changed by the state controller."},
	]},
	AliasUnlock: {e: "Unlock", d: "An unlock which must reference a previous unlock which unlocks the alias that the input is locked to.", g: false, f: [
		{n: "reference", t: "(number)", d: "An index referencing a previous unlock."},
	]},
	BasicOutput: {e: "Output", d: "A Basic output.", cf: 2, f: [
		{n: "amount", t: "(bigint)", d: "The amount of the output."},
		{n: "unlockConditions", t: "UnlockCondition[]", d: "The unlock conditions for the output."},
		{n: "nativeTokens", t: "NativeToken[]?", d: "Native tokens held by the output."},
		{n: "features", t:"Feature[]?", d:"The features contained by the output."},
	]},
	Ed25519Address: {e: "Address", d: "An Ed25519 Address.", f: [
		{n: "pubKeyHash", t: "(HexEncodedString)", d: "An Ed25519 address as hex-encoded string."},
	]},
	Ed25519Signature: {e: "Signature", d: "An Ed25519 signature.", g: false, f: [
		{n: "publicKey", t: "(HexEncodedString)", d: "A Ed25519 public key as hex-encoded string."},
		{n: "signature", t: "(HexEncodedString)", d: "A Ed25519 signature as hex-encoded string."},
	]},
	ExpirationUnlockCondition: {e: "UnlockCondition", d: "An Expiration Unlock Condition.", f: [
		{n: "returnAddress", t: "Address", d: "The address that can unlock the expired output."},
		{n: "unixTime", t: "(number)", d: "The Unix timestamp marking the end of the claim period."},
	]},
	FoundryOutput: {e: "Output", d: "A Foundry output.", cf: 4, f: [
		{n: "amount", t: "(bigint)", d: "The amount of the output."},
		{n: "serialNumber", t: "(number)", d: "The serial number of the Foundry with respect to the controlling alias."},
		{n: "unlockConditions", t: "UnlockCondition[]", d: "The unlock conditions of the output."},
		{n: "tokenScheme", t: "TokenScheme", d: "The token scheme for the Foundry."},
		{n: "nativeTokens", t: "NativeToken[]?", d: "Native tokens held by the output."},
		{n: "features", t:"Feature[]?", d:"The features contained by the output."},
		{n: "immutableFeatures", t: "Feature[]?", d: "Immutable features contained by the output."},
	]},
	GovernorAddressUnlockCondition: {e: "UnlockCondition", d: "A Governor Address Unlock Condition.", f: [
		{n: "address", t: "Address", d: "The governor address that is allowed to do governance transitions."},
	]},
	ImmutableAliasAddressUnlockCondition: {e: "UnlockCondition", d: "An Immutable Alias Address Unlock Condition.", f: [
		{n: "address", t: "AliasAddress", d: "The Immutable Alias address that owns the output."},
	]},
	IssuerFeature: {e: "Feature", d: "An Issuer feature.", g: false, f: [
		{n: "address", t: "Address", d: "The Issuer address stored with the feature."},
	]},
	MetadataFeature: {e: "Feature", d: "A Metadata feature.", f: [
		{n: "data", t: "(string)", d: "The metadata stored with the feature."},
	]},
	MigratedFunds: {d: " The migrated funds for receipts.", g: false, cc: Object, cf: 0, f: [
		{n: "tailTransactionHash", t: "(HexEncodedString)", d: "The tail transaction hash of the migration bundle."},
		{n: "address", t: "Address", d: "The target address of the migrated funds."},
		{n: "deposit", t: "(string)", d: "The amount of the deposit."},
	]},
	MilestonePayload: {e: "Payload", d: "A milestone payload.", cf: 0, g: false, f: [
		{n: "index", t: "(number)", d: "The index name."},
		{n: "timestamp", t: "(number)", d: "The timestamp of the milestone."},
		{n: "protocolVersion", t: "(number)", d: "The protocol version."},
		{n: "previousMilestoneId", t: "(HexEncodedString)", d: "The id of the previous milestone."},
		{n: "parents", t: "(HexEncodedString)[]", d: "The parents where this milestone attaches to."},
		{n: "inclusionMerkleRoot", t: "(HexEncodedString)", d: "The Merkle tree hash of all blocks confirmed by this milestone."},
		{n: "appliedMerkleRoot", t: "(HexEncodedString)", d: "The Merkle tree hash of all blocks applied by this milestone."},
		{n: "metadata", t: "(HexEncodedString)?", d: "The metadata."},
		{n: "options", t: "MilestoneOption[]?", d: "The milestone options."},
		{n: "signatures", t: "Ed25519Signature[]", d: "The signatures."},
	]},
	NativeToken: {d: "Native token.", g: false, cc: Object, cf: 0, f: [
		{n: "id", t: "(HexEncodedString)", d: "Identifier of the native token."},
		{n: "amount", t: "(bigint)", d: "Amount of native tokens of the given Token ID."},
	]},
	NftAddress: {e: "Address", d: "An NFT address.", f: [
		{n: "nftId", t: "(HexEncodedString)", d: "An NFT address as NFT ID."},
	]},
	NftOutput: {e: "Output", d: "An NFT output.", cf: 3, f: [
		{n: "amount", t: "(bigint)", d: "The amount of the output."},
		{n: "nftId", t: "(HexEncodedString)", d: "The NFT ID as hex-encoded string."},
		{n: "unlockConditions", t: "UnlockCondition[]", d: "The unlock conditions of the output."},
		{n: "nativeTokens", t: "NativeToken[]?", d: "Native tokens held by the output."},
		{n: "features", t:"Feature[]?", d:"The features contained by the output."},
		{n: "immutableFeatures", t: "Feature[]?", d: "Immutable features contained by the output."},
	]},
	NftUnlock: {e: "Unlock", d: "An unlock which must reference a previous unlock which unlocks the NFT that the input is locked to.", g: false, f: [
		{n: "reference", t: "(number)", d: "An index referencing a previous unlock."},
	]},
	ProtocolParamsMilestoneOption: {e: "MilestoneOption", d: "A Protocol Parameters Milestone Option.", g: false, f: [
		{n: "targetMilestoneIndex", t: "(number)", d: "The milestone index at which these protocol parameters become active."},
		{n: "protocolVersion", t: "(number)", d: "The to be applied protocol version."},
		{n: "params", t: "(HexEncodedString)", d: "The protocol parameters in binary form. Hex-encoded with 0x prefix."},
	]},
	ReceiptMilestoneOption: {e: "MilestoneOption", d: "A Receipt milestone option.", g: false, f: [
		{n: "migratedAt", t: "(number)", d: "The milestone index at which the funds were migrated in the legacy network."},
		{n: "final", t: "(boolean)", d: "Whether this Receipt is the final one for a given migrated at index."},
		{n: "funds", t: "MigratedFunds[]", d: "The funds which were migrated."},
		{n: "transaction", t: "TreasuryTransactionPayload", d: "The Treasury Transaction used to provide the funds."},
	]},
	ReferenceUnlock: {e: "Unlock", d: "An unlock which must reference a previous unlock which unlocks also the input at the same index as this Reference Unlock.", g: false, f: [
		{n: "reference", t: "(number)", d: "An index referencing a previous unlock."},
	]},
	RegularTransactionEssence: {e: "TransactionEssence", d: "RegularTransactionEssence transaction essence.", g: false, f: [
		{n: "networkId", t: "(string)", d: "The ID of the network the transaction was issued to."},
		{n: "inputsCommitment", t: "(HexEncodedString)", d: "The hash of all inputs."},
		{n: "inputs", t: "Input[]", d: "The inputs of the transaction."},
		{n: "outputs", t: "Output[]", d: "The outputs of the transaction."},
		{n: "payload", t: "TaggedDataPayload?", d: "An optional Tagged Data payload."},
	]},
	SenderFeature: {e: "Feature", d: "A Sender feature.", g: false, f: [
		{n: "address", t: "Address", d: "The Sender address stored with the feature."},
	]},
	SignatureUnlock: {e: "Unlock", d: "An unlock holding one or more signatures unlocking one or more inputs..", g: false, f: [
		{n: "signature", t: "Signature", d: "An Ed25519 signature."},
	]},
	SimpleTokenScheme: {e: "TokenScheme", d: "A simple token scheme.", f: [
		{n: "mintedTokens", t: "(bigint)", d: "The number of tokens that were minted."},
		{n: "meltedTokens", t: "(bigint)", d: "The number of tokens that were melted."},
		{n: "maximumSupply", t: "(bigint)", d: "The maximum supply of the token."},
	]},
	StateControllerAddressUnlockCondition: {e: "UnlockCondition", d: "A State Controller Address Unlock Condition.", f: [
		{n: "address", t: "Address", d: "The State Controller address that is allowed to do state transitions."},
	]},
	StorageDepositReturnUnlockCondition: {e: "UnlockCondition", d: "A Storage Deposit Return Unlock Condition.", f: [
		{n: "returnAddress", t: "Address", d: "The address to return the amount to."},
		{n: "amount", t: "(bigint)", d: "The amount the consuming transaction must deposit to `returnAddress`."},
	]},
	TagFeature: {e: "Feature", d: "A Tag feature.", f: [
		{n: "tag", t: "(string)", d: "The tag stored with the feature."},
	]},
	TaggedDataPayload: {e: "Payload", d: "A Tagged Data payload.", g: false, f: [
		{n: "tag", t: "(HexEncodedString)", d: "A tag as hex-encoded string."},
		{n: "data", t: "(HexEncodedString)", d: "Index data as hex-encoded string."},
	]},
	TimelockUnlockCondition: {e: "UnlockCondition", d: "A Timelock Unlock Condition.", f: [
		{n: "unixTime", t: "(number)", d: "The Unix timestamp marking the end of the timelock."},
	]},
	TransactionPayload: {e: "Payload", d: "Transaction payload.", g: false, f: [
		{n: "essence", t: "TransactionEssence", d: "The transaction essence."},
		{n: "unlocks", t: "Unlock[]", d: "The unlocks of the transaction."},
	]},
	TreasuryInput: {e: "Input", d: "A Treasury input.", g: false, f: [
		{n: "milestoneId", t: "(HexEncodedString)", d: "The milestone id of the input."},
	]},
	TreasuryOutput: {e: "Output", d: "A Treasury output.", f: [
		{n: "amount", t: "(bigint)", d: "The amount of the output."},
	]},
	TreasuryTransactionPayload: {e: "Payload", d: "A treasury transaction payload.", cc: treasuryTransactionPayloadConstructor, g: false, f: [
		{n: "input", t: "TreasuryInput", d: "A Treasury input."},
		{n: "output", t: "TreasuryOutput", d: "A Treasury output."},
	]},
	UTXOInput: {e: "Input", d: "A UTXO transaction input.", g: false, f: [
		{n: "transactionId", t: "(HexEncodedString)", d: "The ID of the transaction it is an input of."},
		{n: "transactionOutputIndex", t: "(number)", d: "The index of the input within the transaction."},
	]},
};

for (let t in blockPayloadTypes) {
	if (blockPayloadTypes[t].a === true)
		continue;
	if (blockPayloadTypes[t].cc === undefined) {
		blockPayloadTypes[t].cc = iotaSdkWasm[t];
	}
	if (blockPayloadTypes[t].c === undefined) {
		blockPayloadTypes[t].c = function(...args) {
			let cargs = blockPayloadTypes[t].cf === undefined ? args : args.slice(0, blockPayloadTypes[t].cf);
			let result = new blockPayloadTypes[t].cc(...cargs);
			if (blockPayloadTypes[t].cf !== undefined) {
				for (let i = blockPayloadTypes[t].cf; i < blockPayloadTypes[t].f.length; i++) {
					result[blockPayloadTypes[t].f[i].n] = args[i];
				}
			}
			return result;
		};
	}
	if (blockPayloadTypes[t].e !== undefined) {
		blockPayloadTypes[blockPayloadTypes[t].e].s.push(t);
	}
}

for (let t in blockPayloadTypes) {
	if (blockPayloadTypes[t].a) blockPayloadTypes[t].s.sort();
}

function moveToFront(array, value) {
	array.unshift(array.splice(array.indexOf(value), 1)[0]);
}

moveToFront(blockPayloadTypes.Payload.s, "TransactionPayload");
moveToFront(blockPayloadTypes.Address.s, "Ed25519Address");
moveToFront(blockPayloadTypes.Input.s, "UTXOInput");
moveToFront(blockPayloadTypes.Output.s, "BasicOutput");
moveToFront(blockPayloadTypes.Unlock.s, "SignatureUnlock");

function checkBlockPayloadTypes() {
	for (let t in blockPayloadTypes) {
		blockPayloadTypes[t].used = false;
		if (blockPayloadTypes[t].a) {
			continue;
		}
		let args = [], cargs = [];
		for(let f of blockPayloadTypes[t].f) {
			let tt = f.t;
			args.push(tt == "(bigint)" ? BigInt(Math.floor(Math.random()*10000000000)) : Math.random());
			if (/\?$/.test(tt)) tt = tt.substring(0, tt.length - 1);
			if (/\[\]$/.test(tt)) tt = tt.substring(0, tt.length - 2);
			if (["(HexEncodedString)","(HexEncodedAmount)","(NumericString)","(bigint)","(number)", "(boolean)", "(string)"].includes(tt)) continue;
			if (blockPayloadTypes[tt] == undefined) throw "Unsupported type "+tt;
		}
		let v = blockPayloadTypes[t].c(...args);
		if (!v instanceof blockPayloadTypes[t].cc) { throw("Type of instantiated "+t+" is incorrect"); }
		for (let i=0; i<args.length; i++) {
			const fn = blockPayloadTypes[t].f[i].n;
			if (args[i] != v[fn]) {
				throw "Field "+fn +" of type "+t+" has incorrect value";
			}
			if (blockPayloadTypes[t].g !== false) {
			const getter = "get"+fn.charAt(0).toUpperCase() + fn.substring(1);
				if (v[getter] === undefined || args[i] != v[getter]()) {
					throw "No getter " + getter + " for field " + fn + " of type " + t;
				}
			}
		}
	}
	let tocheck = ["Payload"];
	while (tocheck.length > 0) {
		let t = tocheck.shift();
		if (!blockPayloadTypes[t].used) {
			blockPayloadTypes[t].used = true;
			if (blockPayloadTypes[t].a) {
				tocheck.push(...blockPayloadTypes[t].s);
			} else {
				for(let f of blockPayloadTypes[t].f) {
					let t = f.t;
					if (/\?$/.test(t)) t = t.substring(0, t.length - 1);
					if (/\[\]$/.test(t)) t = t.substring(0, t.length - 2);
					if (["(HexEncodedString)","(HexEncodedAmount)","(NumericString)","(bigint)","(boolean)","(number)", "(string)"].includes(t)) continue;
					tocheck.push(t);
				}
			}
		}
	}
}

function unmarshalFromJSON(json, expectedType) {
	if (expectedType.endsWith("[]") && typeof(json) === 'object' && json instanceof Array) {
		let elemType = expectedType.substring(0, expectedType.length - 2);
		let result = [];
		for(let i = 0; i < json.length; i++) {
			result.push(unmarshalFromJSON(json[i], elemType));
		}
		return result;
	} else if (expectedType.endsWith("?")) {
		let elemType = expectedType.substring(0, expectedType.length - 1);
		if (typeof(json) === 'object' && json["(type)"] === "(undefined)") {
			return undefined;
		} else {
			return unmarshalFromJSON(json, elemType);
		}
	} else if (expectedType == '(bigint)' && typeof(json) === 'string') {
		return BigInt(json)
	} else if ((expectedType == '(boolean)' && typeof(json) === 'boolean') || (expectedType == '(number)' && typeof(json) === 'number')) {
		return json;
	} else if (["(HexEncodedString)","(HexEncodedAmount)","(NumericString)","(string)"].includes(expectedType) && typeof(json) === 'string') {
		return json;
	} else if (typeof(json) === 'object' && /^[A-Za-z0-9]+$/.test(expectedType) && blockPayloadTypes[expectedType].a && blockPayloadTypes[expectedType].s.includes(json["(type)"])) {
		return unmarshalFromJSON(json, json["(type)"]);
	} else if (typeof(json) === 'object' && json["(type)"] === expectedType) {
		let args = [];
		for (let field of blockPayloadTypes[expectedType].f) {
			args.push(unmarshalFromJSON(json[field.n], field.t));
		}
		return blockPayloadTypes[expectedType].c(...args);
	} else {
		throw "Cannot unmarshal "+json + " from JSON as " + expectedType;
	}
}

function marshalToJSON(obj, actualType) {
	if (actualType.endsWith("[]") && typeof(obj) === 'object' && obj instanceof Array) {
		let elemType = actualType.substring(0, actualType.length - 2);
		let result = [];
		for(let i=0; i < obj.length; i++) {
			result.push(marshalToJSON(obj[i], elemType));
		}
		return result;
	} else if (actualType.endsWith("?")) {
		let elemType = actualType.substring(0, actualType.length - 1);
		if (obj === undefined) {
			return ({"(type)":"(undefined)"});
		} else {
			return marshalToJSON(obj, elemType);
		}
	} else if (actualType == '(bigint)' && typeof(obj) === 'bigint') {
		return obj.toString();
	} else if (actualType == '(bigint)' && typeof(obj) === 'string') {
		return BigInt(obj).toString();
	} else if ((actualType == '(boolean)' && typeof(obj) === 'boolean') || (actualType == '(number)' && typeof(obj) === 'number')) {
		return obj;
	} else if (["(HexEncodedString)","(HexEncodedAmount)","(NumericString)","(string)"].includes(actualType) && typeof(obj) === 'string') {
		return obj;
	} else if (typeof(obj) === 'object' && /^[A-Za-z0-9]+$/.test(actualType) && blockPayloadTypes[actualType].a) {
		for (let subtype of  blockPayloadTypes[actualType].s) {
			if (obj instanceof blockPayloadTypes[subtype].cc) {
				return marshalToJSON(obj, subtype);
			}
		}
		throw "Cannot marshal " + obj + " to JSON as " + actualType + " - no matching subtype found";
	} else if (typeof(obj) === 'object' && /^[A-Za-z0-9]+$/.test(actualType) && obj instanceof blockPayloadTypes[actualType].cc) {
		let result = {};
		result["(type)"] = actualType;
		for (let field of blockPayloadTypes[actualType].f) {
			result[field.n] = marshalToJSON(obj[field.n], field.t);
		}
		return result;
	} else {
		throw "Cannot marshal "+obj + " to JSON as " + actualType;
	}
}

function initializeTypeAsJSON(type) {
	if (type.endsWith("[]")) {
		return [];
	} else if (type.endsWith("?")) {
		return ({"(type)":"(undefined)"});
	} else if (type == '(bigint)' || type == "(NumericString)") {
		return "0";
	} else if (type == '(boolean)') {
		return false;
	} else if (type == '(number)') {
		return 0;
	} else if (type == "(HexEncodedString)" || type == "(HexEncodedAmount)") {
		return "0x00";
	} else if (type == "(string)") {
		return "";
	} else if (/^[A-Za-z0-9]+$/.test(type) && blockPayloadTypes[type].a) {
		return initializeTypeAsJSON(blockPayloadTypes[type].s[0]);
	} else if (/^[A-Za-z0-9]+$/.test(type) && blockPayloadTypes[type].f !== undefined) {
		let result = {};
		result["(type)"] = type;
		for (let field of blockPayloadTypes[type].f) {
			result[field.n] = initializeTypeAsJSON(field.t);
		}
		return result;
	} else {
		throw "Cannot initialize type " + type;
	}
}
