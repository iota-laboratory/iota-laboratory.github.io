"use strict";

let blockPayloadInEditor = {}, blockPayloadEditorDoc = true, iotaInitialized = false, pasteAction = null, cachedOutputs = {}, apiClientNetworkId = "", apiClientProtocolParameters = {};
let iotaAccount = null, iotaAccountNetworkName = null, iotaNetwork = null;
let apiClient = null, apiWallet = null, apiAccount = null, apiSecretManager = null, powTime = "";

let iotaAccounts = {}, iotaNetworks = {
	"IOTA": {name: "IOTA", url: "https://api.stardust-mainnet.iotaledger.net/", coin: iotaSdkWasm.CoinType.IOTA, exp: "https://explorer.iota.org/mainnet/"},
	"Shimmer": {name: "Shimmer", url: "https://api.shimmer.network/", coin: iotaSdkWasm.CoinType.Shimmer, exp: "https://explorer.shimmer.network/shimmer/"},
	"Public IOTA Testnet": {name: "Public IOTA Testnet", url: "https://api.testnet.iotaledger.net/", coin: 1, exp: "https://explorer.iota.org/iota-testnet/"},
	"Public Shimmer Testnet": {name: "Public Shimmer Testnet", url: "https://api.testnet.shimmer.network/", coin: 1, exp: "https://explorer.shimmer.network/testnet/"},
};

function showMessage(message) {
	let snackbar = document.getElementById("snackbar");
	snackbar.innerText = message;
	snackbar.classList.add("show");
	setTimeout(function(){ snackbar.classList.remove("show"); }, 3000);
}

function copyText(text) {
	navigator.clipboard.writeText(text);
}

window.onerror = function(message) {
	showMessage(message);
};

function initIota(wasmURL) {
	iotaSdkWasm.init(wasmURL).then(() => {
		iotaSdkWasmXV.init("https://iota-laboratory.github.io/iota-sdk-wasm-xv/%40iota-laboratory/iota-sdk-wasm-xv/web/wasm/iota_sdk_wasm_bg.wasm");
	}).then(() => {
		iotaInitialized = true;
		networkChanged();
	}).catch(e => {showMessage("Internal error"); console.error(e);});
}

function switchTab(id) {
		document.querySelectorAll("section, ul.nav li").forEach(el => el.classList.remove("sel"));
		document.querySelectorAll("ul.nav li[data-id='"+id+"'], section[data-id='" + id + "']").forEach(el => el.classList.add("sel"));
}

function initNetEdit(network) {
	document.getElementById("netname").value = network == null ? "" : iotaNetwork.name;
	document.getElementById("neturl").value = network == null ? "" : iotaNetwork.url;
	document.getElementById("netcoin").value = network == null ? iotaSdkWasm.CoinType.IOTA : network.coin;
	updateNetCoin();
	document.getElementById("netexp").value = network == null ? "" : network.exp;
	document.getElementById("netstor").selectedIndex=0;
}

function updateNetCoin() {
	document.getElementById("netcoiniota").checked = (document.getElementById("netcoin").value == iotaSdkWasm.CoinType.IOTA);
	document.getElementById("netcoinsmr").checked = (document.getElementById("netcoin").value == iotaSdkWasm.CoinType.Shimmer);
	document.getElementById("netcoinrms").checked = (document.getElementById("netcoin").value == 1);
}

function updateScanCoin() {
	document.getElementById("scancoiniota").checked = (document.getElementById("scancoin").value == iotaSdkWasm.CoinType.IOTA);
	document.getElementById("scancoinsmr").checked = (document.getElementById("scancoin").value == iotaSdkWasm.CoinType.Shimmer);
	document.getElementById("scancoinrms").checked = (document.getElementById("scancoin").value == 1);
}

function networkChanged() {
	let networkName = document.getElementById("networkSelect").selectedOptions[0].value;
	if (iotaNetwork != null && networkName == iotaNetwork.name) return;
	document.body.classList.remove("connected");
	if (apiClient != null) {
		cachedOutputs = {};
		apiClient.destroy();
		apiClient = null;
	}
	iotaNetwork = iotaNetworks[networkName] || null;
	initNetEdit(iotaNetwork);
	if (iotaNetwork != null) {
		apiClient = new iotaSdkWasm.Client({ nodes: [iotaNetwork.url] });
		Promise.all([apiClient.getInfo(), apiClient.getNetworkId(), apiClient.getNetworkInfo()]).then(([info,netid,netinfo]) => {
			apiClientNetworkId = netid;
			apiClientProtocolParameters = info.nodeInfo.protocol;
			info.nodeInfo.protocol.networkId = netid;
			info.networkInfo = netinfo;
			let networkinfo = document.getElementById("networkinfo");
			networkinfo.innerHTML = "";
			showJSON(networkinfo, info);
			document.getElementById("scancoin").value = document.getElementById("netcoin").value;
			updateScanCoin();
			document.getElementById("scanhrp").value = info.nodeInfo.protocol.bech32Hrp;
			document.getElementById("milestoneindex").value = +info.nodeInfo.status.latestMilestone.index;
			document.getElementById("milestoneid").value = info.nodeInfo.status.latestMilestone.milestoneId;
			document.getElementById("clienttipsinterval").value = netinfo.tipsInterval;
			document.getElementById("clientfallbackpow").checked = netinfo.fallbackToLocalPow;
			document.getElementById("clientlocalpow").checked = netinfo.localPow;
		});
		document.body.classList.add("connected");
	}
	accountChanged();
}

function accountChanged() {
	let accountName = document.getElementById("accountSelect").selectedOptions[0].value;
	if (iotaAccount != null && (iotaAccountNetworkName == (iotaNetwork == null ? "" : iotaNetwork.name)) && accountName == iotaAccount.name) return;
	document.body.classList.remove("authenticated");
	if (apiWallet != null) {
		apiWallet.destroy();
		apiWallet = null;
	}
	if (apiSecretManager != null) {
		apiSecretManager = null;
	}
	iotaAccount = iotaAccounts[accountName] || null;
	iotaAccountNetworkName = (iotaNetwork == null ? "" : iotaNetwork.name);
	if (iotaAccount !== null) {
		apiSecretManager = {};
		Object.assign(apiSecretManager, iotaAccount);
		delete apiSecretManager.name;
		delete apiSecretManager.accounts;
		let walletSelect = document.getElementById("walletSelect");
		let scanWalletSelect = document.getElementById("scanWalletSelect");
		let walletOptions = walletSelect.options;
		while (walletOptions.length > 0) {
			walletOptions.remove(0);
		}
		for(let name of iotaAccount.accounts) {
			let option = document.createElement("option");
			option.innerText = name;
			walletOptions.add(option);
		}
		scanWalletSelect.innerHTML = walletSelect.innerHTML;
		walletSelect.selectedIndex = scanWalletSelect.selectedIndex = 0;
		if (iotaNetwork != null) {
			apiWallet = new iotaSdkWasm.Wallet( {
				clientOptions: { nodes: [iotaNetwork.url] },
				coinType: iotaNetwork.coin,
				secretManager: apiSecretManager,
			});
			let chain = Promise.resolve(apiWallet);
			for(let name of iotaAccount.accounts) {
				chain = chain.then(w => w.createAccount({alias: name}).then(a => w));
			}
			chain.then(selectedWalletChanged);
		}
		document.body.classList.add("authenticated");
	}
	if (iotaNetwork === null) {
		switchTab(iotaAccount === null ? "conf" : "sign");
	} else {
		switchTab(iotaAccount === null ? "client" : "wallet");
	}
}

function loadSelect(map, storageName, select, handler) {
	Object.assign(map, JSON.parse(window.localStorage.getItem(storageName) || '{}'));
	Object.assign(map, JSON.parse(window.sessionStorage.getItem(storageName) || '{}'));
	let names = Object.keys(map);
	names.sort();
	for(let name of names) {
		let option = document.createElement("option");
		option.innerText = name;
		option.selected = name.startsWith("*");
		select.options.add(option);
	}
	select.addEventListener("change", function(e) {
		if (iotaInitialized) handler();
	});
}

function saveSelectValue(storage, storageName, name, value) {
	let svalue = JSON.parse(storage.getItem(storageName) || '{}');
	if (value === null) {
		delete svalue[name];
	} else {
		svalue[name] = value;
	}
	storage.setItem(storageName, JSON.stringify(svalue));
}

function explorerLink(type, text) {
	let r = iotaNetwork.exp ? ('<a href="' + iotaNetwork.exp + type + '/' + text + '" target="_blank">' + text + '</a>') : text;
	return r + '<sup><a href="javascript:copyText(\'' + text + '\');">[Copy]</a></sup>';
}

function addAddress(addr, label) {
	document.getElementById("addresslist").value = (document.getElementById("addresslist").value + "\n" + addr + " ("+label+")").trim();
}

function addressToLink(aa) {
	if (aa instanceof iotaSdkWasm.AliasAddress) {
		let aliasAddr = iotaSdkWasm.Utils.aliasIdToBech32(aa.aliasId, document.getElementById("scanhrp").value);
		return "(Alias) "+explorerLink('addr', aliasAddr);
	} else if (aa instanceof iotaSdkWasm.NftAddress) {
		let nftAddr = iotaSdkWasm.Utils.nftIdToBech32(aa.nftId, document.getElementById("scanhrp").value);
		return "(NFT) "+explorerLink('addr', nftAddr);
	} else if (aa instanceof iotaSdkWasm.Ed25519Address) {
		let addr = iotaSdkWasm.Utils.hexToBech32(aa.pubKeyHash, document.getElementById("scanhrp").value);
		return explorerLink('addr', addr);
	} else {
		return aa.toString();
	}
}

function updateTransactionPayload(callback) {
	if (blockPayloadInEditor["(type)"] !== 'TransactionPayload') {
		showMessage("No transaction in block payload editor");
		return;
	}
	let transactionPayload = unmarshalFromJSON(blockPayloadInEditor, 'TransactionPayload');
	if (!(transactionPayload.essence instanceof iotaSdkWasm.RegularTransactionEssence)) {
		showMessage("No (regular) transaction in block payload editor");
		return;
	}
	callback(transactionPayload);
	blockPayloadInEditor = marshalToJSON(transactionPayload, "Payload");
	initBlockPayloadEditor();
}

function addInput(input, unlock, output) {
	updateTransactionPayload(transactionPayload => {
		transactionPayload.essence.inputs.push(input);
		transactionPayload.unlocks.push(unlock);
		if (output != null) {
			transactionPayload.essence.outputs.push(output);
		}
	});
}

function getCachedOutputs(outputIDs) {
	let promises = [];
	for(let outputID of outputIDs) {
		let result = cachedOutputs[outputID];
		if (result !== undefined) {
			promises.push(Promise.resolve(result));
		} else {
			promises.push(apiClient.getOutput(outputID).then(o => {
				cachedOutputs[outputID] = o;
				return o;
			}));
		}
	}
	return Promise.all(promises);
}

function runPoW() {
	let timeout = +document.getElementById("powtimeout").value;
	return iotaPoW(document.getElementById("powblockhash").value, +document.getElementById("powtargetzeros").value,
		BigInt(document.getElementById("powminnonce").value),
		+document.getElementById("powworkercount").value,
		BigInt(document.getElementById("powmaxnonce").value),
		timeout == 0 ? undefined : timeout * 1000);
}

function selectedWalletChanged() {
	let index = document.getElementById("walletSelect").selectedIndex;
	apiWallet.getAccount(index).then(a => (apiAccount = a).sync()).then(info => {
		let accountinfo = document.getElementById("accountinfo");
		accountinfo.innerHTML = "";
		showJSON(accountinfo, info);
		let senditem = document.getElementById("senditem");
		while(senditem.options.length > 1) {
			senditem.options.remove(1);
		}
		senditem.options[0].dataset.max=info.baseCoin.available;
		for(let nt of info.nativeTokens) {
			let option = document.createElement("option");
			option.innerText = "Native Token " + nt.tokenId;
			option.value = "T" + nt.tokenId;
			option.dataset.max = nt.available;
			senditem.options.add(option);
		}
		for(let nft of info.nfts) {
			let option = document.createElement("option");
			option.innerText = "NFT " + nft;
			option.value = "N" + nft;
			option.dataset.max = 1;
			senditem.options.add(option);
		}
		return Promise.all([apiAccount.addresses(), apiAccount.addressesWithUnspentOutputs(), apiAccount.claimableOutputs('All')]);
	}).then(([addr,addrU,claimO]) => {
		let outputIDs = addrU.flatMap(a => a.outputIds);
		return Promise.all([Promise.resolve([addr,addrU,outputIDs,claimO]), getCachedOutputs(outputIDs)]);
	}).then(([[addr, addrU, outputIDs,claimO], outputList]) => {
		let outputs = {};
		for(let i = 0; i<outputIDs.length; i++) {
			outputs[outputIDs[i]] = outputList[i];
		}
		let seen = {};
		let html = '<ul>';
		for(let a of addrU) {
			seen[a.address] = true;
			html +='<li><b><tt>'+explorerLink('addr', a.address)+'</tt></b> ('+ a.keyIndex + (a.internal ? ' internal' :'')+
				', unspent) <a href="javascript:addAddress(\''+a.address+'\',\'' + a.keyIndex + (a.internal ? ' internal' :'') + '\');">[+Address]</a><ul>';
			for(let o of a.outputIds) {
				let oo = outputs[o].output;
				html+='<li>Output: <tt>'+explorerLink('output', o)+'</tt> <i>(' + oo.amount +' BT';
				if (oo instanceof iotaSdkWasm.AliasOutput) {
					html+=" + Alias("+oo.aliasId+")";
				} else if (oo instanceof iotaSdkWasm.BasicOutput) {
					if (oo.nativeTokens) {
						for(let nt of oo.nativeTokens) {
							html += " + " + BigInt(nt.amount) + " T(" + nt.id + ")";
						}
					}
				} else if (oo instanceof iotaSdkWasm.FoundryOutput) {
					html += " + Foundry #" + oo.serialNumber;
				} else if (oo instanceof iotaSdkWasm.NftOutput) {
					html += " + NFT("+oo.nftId+")";
				} else {
					html += "+ ?";
				}
				html+=')</i></li>';
			}
			html +='</ul></li>';
		}
		for(let a of addr) {
			if (seen[a.address]) continue;
			html +='<li><b><tt>'+explorerLink('addr', a.address)+'</tt></b> ('+ a.keyIndex + (a.internal ? ' internal' : '')+(a.used?', used' : '')+
				') <a href="javascript:addAddress(\''+a.address+'\',\'' + a.keyIndex + (a.internal ? ' internal' :'') + '\');">[+Address]</a></li>';
		}
		document.getElementById("accountaddresses").innerHTML = html + '</ul>';
		html = "";
		for(let o of claimO) {
			html+='<li><label><input class="claimme" type="checkbox" name="'+o+'" checked> Output: <tt>'+explorerLink('output', o)+'</tt></label></li>';
		}
		document.getElementById("claimableoutputs").innerHTML = html;
	});
}

function updateLastSubmittedBlock(blockid) {
	document.getElementById("lastPostedBlock").innerHTML=explorerLink("block", blockid)+' <a href="javascript:loadBlock(\'' + blockid+'\');">[Load]</a>';
}

function loadBlockPayload(payload) {
		blockPayloadInEditor = marshalToJSON(payload, "Payload");
		initBlockPayloadEditor();
		let remarshalledPayload = unmarshalFromJSON(blockPayloadInEditor, "Payload");
		switchTab("edit");
		// hash payload to check for data loss
		let b = new iotaSdkWasm.Block();
		b.protocolVersion = 2;
		b.parents = ["0x0000000000000000000000000000000000000000000000000000000000000000"];
		b.nonce = "0";
		b.payload = payload;
		let origHash = iotaSdkWasm.Utils.blockId(b);
		b.payload = remarshalledPayload;
		let newHash = iotaSdkWasm.Utils.blockId(b);
		if (origHash != newHash) showMessage("WARNING: Transaction cannot be rebuilt from editor!");
}

function sendOrEditPreparedTransactionData(preparedTransaction) {
	let editBeforePost = document.getElementById("editbeforepost").checked;
	apiClient.signTransaction(apiSecretManager, preparedTransaction).then( payload => {
		if (editBeforePost) {
			loadBlockPayload(payload);
		} else {
			apiClient.postBlockPayload(payload).then(([blockid,block]) => updateLastSubmittedBlock(blockid));
		}
	}, showMessage);
}

function sendOrEditPreparedTransaction(preparedTransaction) {
	sendOrEditPreparedTransactionData(preparedTransaction.preparedTransactionData());
}

function updateMilestone([milestonePayload, changes]) {
	loadBlockPayload(milestonePayload);
	document.getElementById("milestoneid").value = iotaSdkWasm.Utils.milestoneId(milestonePayload);
	document.getElementById("milestoneindex").value = changes.index;
	delete changes.index;
	let mc = document.getElementById("milestonechanges");
	mc.innerHTML = "";
	showJSON(mc, changes);
	switchTab("milestone");
}

function loadBlock(id) {
	document.getElementById("blockid").value = id;
	document.getElementById("lastLoadedBlock").innerHTML = "(loading)";
	Promise.all([apiClient.getBlock(id), apiClient.getBlockMetadata(id), apiClient.getBlockRaw(id)]).then(([block, metadata, raw]) => {
		document.getElementById("lastLoadedBlock").innerHTML = explorerLink("block", id);
		loadBlockPayload(block.payload);
		delete block.payload;
		metadata.block = block;
		let md = document.getElementById("blockmetadata");
		md.innerHTML = "";
		showJSON(md, metadata);
		switchTab("retrieve");
		document.getElementById("blockraw").value = Array.from(raw, b => b.toString(16).padStart(2, "0")).join(" ");
		document.getElementById("postblocktips").value = block.parents.join("\n");
		document.getElementById("postblocknonce").value = block.nonce;
	});
}

window.onload = function() {
	document.querySelectorAll("ul.nav li").forEach(el => el.addEventListener("click", function(e) {
		if (iotaInitialized) switchTab(e.target.dataset.id);
	}));
	blockPayloadInEditor = initializeTypeAsJSON("Payload");
	initBlockPayloadEditor();
	loadSelect(iotaAccounts, "Accounts", document.getElementById("accountSelect"), accountChanged);
	loadSelect(iotaNetworks, "Networks", document.getElementById("networkSelect"), networkChanged);
	document.getElementById("showeditordoc").addEventListener("click", function(e) {
		blockPayloadEditorDoc = document.getElementById("showeditordoc").checked;
		initBlockPayloadEditor();
	});
	document.getElementById("pasteHelperBox").addEventListener("paste", function(e) {
		e.preventDefault();
		e.stopPropagation();
		document.getElementById("pasteHelper").close();
		pasteAction(e.clipboardData.getData("text"));
	});
	document.getElementById("netcoin").addEventListener("change", updateNetCoin);
	document.getElementById("netcoiniota").addEventListener("click", function() { document.getElementById("netcoin").value = iotaSdkWasm.CoinType.IOTA; });
	document.getElementById("netcoinsmr").addEventListener("click", function() { document.getElementById("netcoin").value = iotaSdkWasm.CoinType.Shimmer; });
	document.getElementById("netcoinrms").addEventListener("click", function() { document.getElementById("netcoin").value = 1; });
	document.getElementById("netsave").addEventListener("click", function(e) {
		let name = document.getElementById("netname").value;
		let value = { name, url: document.getElementById("neturl").value, coin: +document.getElementById("netcoin").value, exp: document.getElementById("netexp").value };
		iotaNetworks[name] = value;
		let storage = +document.getElementById("netstor").value;
		if (storage == 1) {
			saveSelectValue(window.sessionStorage, "Networks", name, value);
		} else if (storage == 2) {
			saveSelectValue(window.sessionStorage, "Networks", name, null);
			saveSelectValue(window.localStorage, "Networks", name, value);
		}
		initNetEdit(null);
		let opts = document.getElementById("networkSelect").options;
		let add = true, pos = opts.length;
		for (let i = 1; i < opts.length; i++) {
			if (opts[i].value == name) {
				pos = -1;
				break;
			} else if (opts[i].value.localeCompare(name) == 1) {
				pos = i;
				break;
			}
		}
		if (pos != -1) {
			let option = document.createElement("option");
			option.innerText = name;
			opts.add(option, pos);
		}
	});
	document.getElementById("netdelete").addEventListener("click", function(e) {
		let name = document.getElementById("netname").value;
		delete iotaNetworks[name];
		saveSelectValue(window.localStorage, "Networks", name, null);
		saveSelectValue(window.sessionStorage, "Networks", name, null);
		let opts = document.getElementById("networkSelect").options;
		for (let i = 1; i <opts.length; i++) {
			if (opts[i].value == name) {
				opts.remove(i);
				i--;
			}
		}
		networkChanged();
	});
	document.getElementById("authtypeseed").addEventListener("click", function(e) {
		document.getElementById("authseedfields").style.display = '';
		document.getElementById("authkeyfields").style.display = 'none';
	});
	document.getElementById("authtypekey").addEventListener("click", function(e) {
		document.getElementById("authseedfields").style.display = 'none';
		document.getElementById("authkeyfields").style.display = '';
	});
	document.getElementById("authgen").addEventListener("click", function(e) {
		const mnemo = iotaSdkWasm.Utils.generateMnemonic();
		document.getElementById("authmnemo").value = mnemo;
		document.getElementById("authseed").value = iotaSdkWasm.Utils.mnemonicToHexSeed(mnemo);
	});
	document.getElementById("authmnemo").addEventListener("change", function(e) {
		const mnemo = document.getElementById("authmnemo").value;
		try {
			iotaSdkWasm.Utils.verifyMnemonic(mnemo);
			document.getElementById("authseed").value = iotaSdkWasm.Utils.mnemonicToHexSeed(mnemo);
		} catch (e) {
			console.error(e);
			try {
				showMessage("Invalid mnemonic [" + e.payload.error+"]");
			} catch (ee) {
				showMessage("Invalid mnemonic");
			}
			document.getElementById("authseed").value = "";
		}
	});
	document.getElementById("authseed").addEventListener("change", function(e) {
		document.getElementById("authmnemo").value = "";
	});
	document.getElementById("authsave").addEventListener("click", function(e) {
		let name = document.getElementById("authname").value, value;
		if (document.getElementById("authtypekey").checked) {
			if (!/^0x[0-9a-f]{64}$/.test(document.getElementById("authkey").value)) {
				showMessage("Invalid private key"); return;
			}
			value = { name, privateKey: document.getElementById("authkey").value, accounts: [document.getElementById("authkeyacct").value] };
		} else {
			if (!/^0x[0-9a-f]{128}$/.test(document.getElementById("authseed").value)) {
				showMessage("Invalid hex seed"); return;
			}
			value = { name, hexSeed: document.getElementById("authseed").value, accounts: document.getElementById("authseedacct").value.split(/[\r\n]+/) };
		}
		iotaAccounts[name] = value;
		let storage = +document.getElementById("authstor").value;
		if (storage == 1) {
			saveSelectValue(window.sessionStorage, "Accounts", name, value);
		} else if (storage == 2) {
			saveSelectValue(window.sessionStorage, "Accounts", name, null);
			saveSelectValue(window.localStorage, "Accounts", name, value);
		}
		document.getElementById("authname").value = "";
		document.getElementById("authtypeseed").checked = true;
		document.getElementById("authseedfields").style.display = '';
		document.getElementById("authkeyfields").style.display = 'none';
		document.getElementById("authmnemo").value = "";
		document.getElementById("authseed").value = "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
		document.getElementById("authseedacct").value = "Wallet 1\nWallet 2\nWallet 3";
		document.getElementById("authkey").value = "0x0000000000000000000000000000000000000000000000000000000000000000";
		document.getElementById("authkeyacct").value = "Wallet 1";
		document.getElementById("authstor").value = "0";
		let opts = document.getElementById("accountSelect").options;
		let add = true, pos = opts.length;
		for (let i = 1; i < opts.length; i++) {
			if (opts[i].value == name) {
				pos = -1;
				break;
			} else if (opts[i].value.localeCompare(name) == 1) {
				pos = i;
				break;
			}
		}
		if (pos != -1) {
			let option = document.createElement("option");
			option.innerText = name;
			opts.add(option, pos);
		}
	});
	document.getElementById("authdelete").addEventListener("click", function(e) {
		let name = document.getElementById("authname").value;
		delete iotaAccounts[name];
		saveSelectValue(window.localStorage, "Accounts", name, null);
		saveSelectValue(window.sessionStorage, "Accounts", name, null);
		document.getElementById("authname").value = "";
		let opts = document.getElementById("accountSelect").options;
		for (let i = 1; i <opts.length; i++) {
			if (opts[i].value == name) {
				opts.remove(i);
				i--;
			}
		}
		accountChanged();
	});
	document.getElementById("clientupdate").addEventListener("click", function(e) {
		apiClient = new iotaSdkWasm.Client({ nodes: [iotaNetwork.url], tipsInterval: +document.getElementById("clienttipsinterval").value,
			localPow: document.getElementById("clientlocalpow").checked, fallbackToLocalPow: document.getElementById("clientfallbackpow").checked});
		apiClient.getNetworkInfo().then(netinfo => {
			document.getElementById("clienttipsinterval").value = netinfo.tipsInterval;
			document.getElementById("clientfallbackpow").checked = netinfo.fallbackToLocalPow;
			document.getElementById("clientlocalpow").checked = netinfo.localPow;
		});
	});

	document.getElementById("convbech32").addEventListener("click", function(e) {
		apiClient[document.getElementById("convtype").value](document.getElementById("convin").value, document.getElementById("scanhrp").value).then( v => document.getElementById("convout").value = v, showMessage);
	});
	document.getElementById("milestoneprev").addEventListener("click", function(e) {
		document.getElementById("milestoneindex").value--;
		document.getElementById("milestoneindexload").click();
	});
	document.getElementById("milestonenext").addEventListener("click", function(e) {
		document.getElementById("milestoneindex").value++;
		document.getElementById("milestoneindexload").click();
	});
	document.getElementById("milestoneindexload").addEventListener("click", function(e) {
		let index = +document.getElementById("milestoneindex").value;
		Promise.all([apiClient.getMilestoneByIndex(index), apiClient.getUtxoChangesByIndex(index)]).then(updateMilestone, showMessage);
	});
	document.getElementById("milestoneidload").addEventListener("click", function(e) {
		let id = document.getElementById("milestoneid").value;
		Promise.all([apiClient.getMilestoneById(id), apiClient.getUtxoChangesById(id)]).then(updateMilestone, showMessage);
	});
	document.getElementById("blockload").addEventListener("click", function(e) {
		let id = document.getElementById("blockid").value;
		loadBlock(id);
	});
	document.getElementById("blockresend").addEventListener("click", function(e) {
		let id = document.getElementById("blockid").value;
		let type = document.getElementById("blockresendtype").value;
		apiClient[type](id).then(([blockid,block]) => updateLastSubmittedBlock(blockid), showMessage);
	});
	document.getElementById("walletSelect").addEventListener("change", selectedWalletChanged);
	document.getElementById("walletrecover").addEventListener("click", function(e) {
		apiWallet.recoverAccounts(0, document.getElementById("walletSelect").options.length, +document.getElementById("walletrecoverlimit").value).then(selectedWalletChanged);
	});
	document.getElementById("walletaddaddress").addEventListener("click", function(e) {
		apiAccount.generateEd25519Addresses(1).then(selectedWalletChanged);
	});
	document.getElementById("walletconsolidate").addEventListener("click", function(e) {
		apiAccount.prepareConsolidateOutputs({force: true}).then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("walletclaim").addEventListener("click", function(e) {
		apiAccount.prepareClaimOutputs(Array.from(document.querySelectorAll(".claimme:checked")).map(c=>c.name)).then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("senditem").addEventListener("change", function(e) {
		document.getElementById("sendamount").value = document.getElementById("senditem").selectedOptions[0].dataset.max;
	});
	document.getElementById("sendsend").addEventListener("click", function(e) {
		let item = document.getElementById("senditem").value;
		let amount = document.getElementById("sendamount").value;
		let addr = document.getElementById("sendaddr").value;
		let expiry = document.getElementById("sendexpir").value;
		expiry = expiry == "" ? undefined : +expiry;
		if (item == 'B') {
			apiAccount.prepareSend([{address: addr, amount: amount, expiration: expiry}],{allowMicroAmount: true}).then(sendOrEditPreparedTransaction, showMessage);
		} else if (item.startsWith('N') && amount == "1") {
			apiAccount.prepareSendNft([{address: addr, nftId: item.substring(1)}]).then(sendOrEditPreparedTransaction, showMessage);
		} else if (item.startsWith('T')) {
			apiAccount.prepareSendNativeTokens([{address: addr, nativeTokens: [[item.substring(1), BigInt(amount)]], expiration: expiry}]).then(sendOrEditPreparedTransaction, showMessage);
		}
	});
	document.getElementById("sendburn").addEventListener("click", function(e) {
		let item = document.getElementById("senditem").value;
		let amount = document.getElementById("sendamount").value;
		if (item == 'B') {
			showMessage("Cannot burn base token");
		} else if (item.startsWith('N') && amount == "1") {
			apiAccount.prepareBurnNft(item.substring(1)).then(sendOrEditPreparedTransaction, showMessage);
		} else if (item.startsWith('T')) {
			apiAccount.prepareBurnNativeToken(item.substring(1), BigInt(amount)).then(sendOrEditPreparedTransaction, showMessage);
		}
	});
	document.getElementById("walletAliasCreate").addEventListener("click", function(e) {
		apiAccount.prepareCreateAliasOutput().then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("walletAliasDestroy").addEventListener("click", function(e) {
		let aliasId = document.getElementById("walletAliasId").value;
		apiAccount.prepareDestroyAlias(aliasId).then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("createtokencreate").addEventListener("click", function(e) {
		let alias = document.getElementById("createtokenalias").value;
		let meta = document.getElementById("createtokenmeta").value;
		let circ = BigInt(document.getElementById("createtokencirc").value);
		let max = BigInt(document.getElementById("createtokenmax").value);
		let metaHex = '0x' + Array.from(new TextEncoder().encode(meta), b => b.toString(16).padStart(2, "0")).join("");
		apiAccount.prepareCreateNativeToken({aliasId: alias, circulatingSupply: circ, maximumSupply: max, foundryMetadata: metaHex}).then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("edittokenmint").addEventListener("click", function(e) {
		let tokenid = document.getElementById("edittokenid").value;
		let amount = +document.getElementById("edittokenamount").value;
		apiAccount.prepareMintNativeToken(tokenid, amount).then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("edittokenmelt").addEventListener("click", function(e) {
		let tokenid = document.getElementById("edittokenid").value;
		let amount = +document.getElementById("edittokenamount").value;
		apiAccount.prepareMeltNativeToken(tokenid, amount).then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("destroytoken").addEventListener("click", function(e) {
		let tokenid = document.getElementById("destroytokenid").value;
		apiAccount.prepareDestroyFoundry(tokenid).then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("createnft").addEventListener("click", function(e) {
		let meta = document.getElementById("nftmeta").value;
		let metaHex = '0x' + Array.from(new TextEncoder().encode(meta), b => b.toString(16).padStart(2, "0")).join("");
		apiAccount.prepareMintNfts([{immutableMetadata: metaHex}]).then(sendOrEditPreparedTransaction, showMessage);
	});
	document.getElementById("scanaddresses").addEventListener("click", function(e) {
		let ul = document.getElementById("addresses");
		ul.innerHTML = '';
		for(let addrline of document.getElementById("addresslist").value.split("\n")) {
			if (addrline == '') continue;
			let addr = addrline, desc = '', idx = addr.indexOf(" ");
			if (idx != -1) {
				desc = addr.substring(idx);
				addr = addr.substring(0, idx);
			}
			let li = document.createElement("li");
			ul.appendChild(li);
			li.innerText = desc.trim();
			if (!iotaSdkWasm.Utils.isAddressValid(addr)) {
				li.innerHTML = '<b><tt>'+addr+'</tt></b> [<i>Address invalid</i>] (' + li.innerHTML + ')';
				continue;
			}
			li.innerHTML = '<b><tt>'+explorerLink('addr', addr)+'</tt></b> [<i>??</i>] (' + li.innerHTML + ')';
			let typeinfo = li.firstChild.nextElementSibling;
			let aa = iotaSdkWasm.Utils.parseBech32Address(addr);
			let unlock = new iotaSdkWasm.ReferenceUnlock(99);
			if (aa instanceof iotaSdkWasm.AliasAddress) {
				typeinfo.innerHTML = 'AliasId='+aa.aliasId+'<sup><a href="javascript:copyText(\'' + aa.aliasId + '\')">[Copy]</a></sup>';
				unlock = new iotaSdkWasm.AliasUnlock(99);
			} else if (aa instanceof iotaSdkWasm.Ed25519Address) {
				typeinfo.innerHTML = 'PubKeyHash='+aa.pubKeyHash+'<sup><a href="javascript:copyText(\'' + aa.pubKeyHash + '\')">[Copy]</a></sup>';
				unlock = new iotaSdkWasm.SignatureUnlock(new iotaSdkWasm.Ed25519Signature("0xdec0de", aa.pubKeyHash));
			} else if (aa instanceof iotaSdkWasm.NftAddress) {
				typeinfo.innerHTML = 'NFTId='+aa.nftId+'<sup><a href="javascript:copyText(\'' + aa.nftId + '\')">[Copy]</a></sup>';
				unlock = new iotaSdkWasm.NftUnlock(99);
			}
			let oul = document.createElement("ul");
			li.appendChild(oul);
			apiClient.outputIds([{unlockableByAddress: addr}]).then(oids => {
				for(let o of oids.items) {
					let oli = document.createElement("li");
					oul.appendChild(oli);
					oli.innerHTML = 'Output: <tt>'+explorerLink('output', o)+'</tt> <a href="#">[+Input]</a> <a href="#">[+Input+Output]</a>';
					let oiul = document.createElement("ul");
					oli.appendChild(oiul);
					getCachedOutputs([o]).then(([result]) => {
						let oo = result.output;
						let input = new iotaSdkWasm.UTXOInput(result.metadata.transactionId, result.metadata.outputIndex);
						oli.firstChild.nextElementSibling.nextElementSibling.addEventListener("click", function(e) {
							e.preventDefault();
							addInput(input, unlock, null);
						});
						oli.firstChild.nextElementSibling.nextElementSibling.nextElementSibling.addEventListener("click", function(e) {
							e.preventDefault();
							addInput(input, unlock, oo);
						});
						let oili = document.createElement("li");
						oiul.appendChild(oili);
						oili.innerHTML = "<b>Base Token:</b> "+oo.amount;
						if (oo instanceof iotaSdkWasm.AliasOutput) {
							let aliasAddr = iotaSdkWasm.Utils.aliasIdToBech32(oo.aliasId, document.getElementById("scanhrp").value);
							oili = document.createElement("li");
							oiul.appendChild(oili);
							oili.innerHTML = "<b>Alias:</b> "+oo.aliasId+', Address = '+explorerLink('addr', aliasAddr) +
								' <a href="javascript:addAddress(\''+aliasAddr+'\', \'Alias '+oo.aliasId+'\');">[+Address]</a>';
						} else if (oo instanceof iotaSdkWasm.BasicOutput) {
							if (oo.nativeTokens) {
								for(let nt of oo.nativeTokens) {
									oili = document.createElement("li");
									oiul.appendChild(oili);
									oili.innerHTML = '<b>Token ' + nt.id + ':</b> '+BigInt(nt.amount);
								}
							}
						} else if (oo instanceof iotaSdkWasm.FoundryOutput) {
							oili = document.createElement("li");
							oiul.appendChild(oili);
							oili.innerHTML = "<b>Foundry:</b> #"+oo.serialNumber;
						} else if (oo instanceof iotaSdkWasm.NftOutput) {
							let nftAddr = iotaSdkWasm.Utils.nftIdToBech32(oo.nftId, document.getElementById("scanhrp").value);
							oili = document.createElement("li");
							oiul.appendChild(oili);
							oili.innerHTML = "<b>NFT:</b> "+oo.nftId+', Address = '+explorerLink('addr', nftAddr) +
								' <a href="javascript:addAddress(\''+nftAddr+'\', \'NFT '+oo.nftId+'\');">[+Address]</a>';
						} else {
							oili = document.createElement("li");
							oiul.appendChild(oili);
							oili.innerHTML = "?";
						}
						for (let uc of oo.unlockConditions) {
							oili = document.createElement("li");
							oiul.appendChild(oili);
							let time = "";
							if (uc instanceof iotaSdkWasm.ExpirationUnlockCondition || uc instanceof iotaSdkWasm.TimelockUnlockCondition) {
								time = "Unix Time "+uc.unixTime+ " (" +new Date(uc.unixTime * 1000).toISOString() + ")";
							}
							if (uc instanceof iotaSdkWasm.AddressUnlockCondition) {
								oili.innerHTML = "<b>Unlock Condition:</b> Address " + addressToLink(uc.address);
							} else if (uc instanceof iotaSdkWasm.ExpirationUnlockCondition) {
								oili.innerHTML = "<b>Unlock Condition:</b> Expiration at " + time + ", after that use Address "+addressToLink(uc.returnAddress);
							} else if (uc instanceof iotaSdkWasm.GovernorAddressUnlockCondition) {
								oili.innerHTML = "<b>Unlock Condition:</b> Governance transitions by Address " + addressToLink(uc.address);
							} else if (uc instanceof iotaSdkWasm.ImmutableAliasAddressUnlockCondition) {
								oili.innerHTML = "<b>Unlock Condition:</b> Alias Address " + addressToLink(uc.address);
							} else if (uc instanceof iotaSdkWasm.StateControllerAddressUnlockCondition) {
								oili.innerHTML = "<b>Unlock Condition:</b> State controller transitions by Address " + addressToLink(uc.address);
							} else if (uc instanceof iotaSdkWasm.StorageDepositReturnUnlockCondition) {
								oili.innerHTML = "<b>Unlock Condition:</b> Return " + uc.amount+" to Address " + addressToLink(uc.returnAddress);
							} else if (uc instanceof iotaSdkWasm.TimelockUnlockCondition) {
								oili.innerHTML = "<b>Unlock Condition:</b> Locked until " + time;
							} else {
								oili.innerHTML = "<b>Unlock Condition:</b> ?";
							}
						}
					}, showMessage);
				}
			}, showMessage);
		}
	});
	document.getElementById("validateTimeNow").addEventListener("click", function() {
		document.getElementById("validateTime").value = Date.now() / 1000 | 0;
	});
	document.getElementById("validatePayload").addEventListener("click", function() {
		let payload = unmarshalFromJSON(blockPayloadInEditor, 'Payload');
		apiClient.getTips().then(tips => {
			let block = new iotaSdkWasm.Block();
			block.protocolVersion = 2;
			block.parents = tips;
			block.payload = payload;
			block.nonce = "0";
			let bytes = iotaSdkWasm.Utils.blockBytes(block);
			document.getElementById("validationrawcontent").innerHTML='<h4>Tips used as parents</h4><ul id="validaterawtips"></ul><h4>Resulting Block</h4><p><textarea id="validaterawblock" readonly></textarea></p>';
			for (let tip of tips) {
				let li = document.createElement("li");
				li.innerText = tip;
				document.getElementById("validaterawtips").appendChild(li);
			}
			document.getElementById("validaterawblock").value = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(" ").replace(/00 00 00 00 00 00 00 00$/, "[Nonce]");
		});
		let timestamp = +document.getElementById("validateTime").value;
		if (timestamp == 0) {
			timestamp = Date.now() / 1000 | 0;
		}
		if (blockPayloadInEditor["(type)"] !== 'TransactionPayload') {
			document.getElementById("validationsummary").innerHTML = "No transaction in block payload editor";
			return;
		}
		validatePayload(payload, timestamp);
	});
	document.getElementById("scancoin").addEventListener("change", updateScanCoin);
	document.getElementById("scancoiniota").addEventListener("click", function() { document.getElementById("scancoin").value = iotaSdkWasm.CoinType.IOTA; });
	document.getElementById("scancoinsmr").addEventListener("click", function() { document.getElementById("scancoin").value = iotaSdkWasm.CoinType.Shimmer; });
	document.getElementById("scancoinrms").addEventListener("click", function() { document.getElementById("scancoin").value = 1; });
	document.getElementById("scan").addEventListener("click", function(e) {
		let walletName = document.getElementById("scanWalletSelect").value;
		let walletIndex = document.getElementById("scanWalletSelect").selectedIndex;
		let coin = +document.getElementById("scancoin").value;
		let hrp = document.getElementById("scanhrp").value;
		let min = +document.getElementById("scanmin").value;
		let max = +document.getElementById("scanmax").value;

		let transactionEssenceHash = null, transactionPayload = null;
		if (blockPayloadInEditor["(type)"] === 'TransactionPayload') {
			transactionPayload = unmarshalFromJSON(blockPayloadInEditor, 'TransactionPayload');
			try {
				transactionEssenceHash = iotaSdkWasm.Utils.hashTransactionEssence(transactionPayload.essence);
			} catch (e) {
				transactionEssenceHash = null;
			}
		}
		let secretManager = new iotaSdkWasm.SecretManager(apiSecretManager);
		let params = {
			coinType: coin,
			accountIndex: walletIndex,
			range: { start: min, end: max + 1},
			bech32Hrp: hrp
		};
		Promise.all([secretManager.generateEd25519Addresses({...params, options: { internal: false } }),
			secretManager.generateEd25519Addresses({...params, options: { internal: true } })])
		.then(([a, ai]) => {
			let unlocksP = [];
			let result = document.getElementById("scanresult");
			result.value = "";
			let sign = document.getElementById("scansign");
			if (transactionEssenceHash == null) {
				sign.innerHTML = "<p>Unable to compute transaction essence hash from transaction in editor.</p>";
			} else {
				sign.innerHTML = "<p>Transaction essence hash: <tt>"+transactionEssenceHash+'</tt></p>';
			}

			for(let i = 0; i < a.length; i++) {
				if (transactionEssenceHash != null) {
					for(let change=0; change <2; change++) {
						unlocksP.push(secretManager.signatureUnlock(transactionEssenceHash, {coinType: coin, account: walletIndex, change: change, addressIndex: min+i}));
					}
				}
				result.value += a[i] + " (" + walletName+", "+(min+i)+")\n" + ai[i] + " (" + walletName+", "+(min+i)+" internal)\n";
			}
			Promise.all(unlocksP).then(unlocks => {
				if (unlocks.length == 0 || transactionPayload.unlocks.length == 0) return;
				let unlockPubkeyMap = {}, unlockHashMap = {}
				for(let u of unlocks) {
					unlockPubkeyMap[u.signature.publicKey] = u;
					unlockHashMap[iotaSdkWasm.Utils.parseBech32Address(iotaSdkWasm.Utils.hexPublicKeyToBech32Address(u.signature.publicKey, hrp)).pubKeyHash] = u;
				}
				let ul = document.createElement("ul");
				sign.appendChild(ul);
				for(let i = 0; i < transactionPayload.unlocks.length; i++) {
					let tunlock = transactionPayload.unlocks[i];
					let li = document.createElement("li");
					ul.appendChild(li);
					li.innerHTML = '<b>Unlock '+i+':</b> ';
					if (tunlock instanceof iotaSdkWasm.SignatureUnlock) {
						if (tunlock.signature.publicKey.length == 66 && tunlock.signature.signature.length == 130 && iotaSdkWasm.Utils.verifyEd25519Signature(tunlock.signature, transactionEssenceHash)) {
							li.innerHTML += "Signature valid";
						} else {
							let u = tunlock.signature.publicKey === "0xdec0de" ? unlockHashMap[tunlock.signature.signature] : unlockPubkeyMap[tunlock.signature.publicKey];
							if (u === undefined) {
								li.innerHTML += "Signature invalid and no key available";
							} else {
								li.innerHTML += 'Signature invalid, key available. <a href="#">[Sign]</a>';
								li.lastElementChild.addEventListener("click", function(e) {
									e.preventDefault();
									updateTransactionPayload(transactionPayload => {
										transactionPayload.unlocks[i] = new iotaSdkWasm.SignatureUnlock(new iotaSdkWasm.Ed25519Signature(u.signature.publicKey, u.signature.signature));
									});
									document.getElementById("scan").click();
								});
							}
						}
					} else {
						li.innerHTML += "Not a signature unlock";
					}
				}
			});
		});
	});
	document.getElementById("postBlockPayload").addEventListener("click", function(e) {
		document.getElementById("timinginfo").innerText = "postBlockPayload running...";
		let startTime = Date.now();
		let payload = unmarshalFromJSON(blockPayloadInEditor, "Payload");
		apiClient.postBlockPayload(payload).then(([blockid,block]) => {
			updateLastSubmittedBlock(blockid);
			blockPayloadInEditor = initializeTypeAsJSON("Payload");
			initBlockPayloadEditor();
			document.getElementById("timinginfo").innerText = "postBlockPayload took "+(Date.now()-startTime)+" ms";
		}, showMessage);
	});
	document.getElementById("postfreshtips").addEventListener("click", function(e) {
		apiClient.getTips().then(tips => {
			document.getElementById("postblocktips").value = tips.join("\n");
		}, showMessage);
	});
	document.getElementById("postBlock").addEventListener("click", function(e) {
		document.getElementById("timinginfo").innerText = powTime + "postBlock running...";
		let startTime = Date.now();
		let payload = unmarshalFromJSON(blockPayloadInEditor, "Payload");
		let block = new iotaSdkWasm.Block();
		block.protocolVersion = 2;
		block.parents = document.getElementById("postblocktips").value.split(/[\r\n]+/);
		block.payload = payload;
		block.nonce = document.getElementById("postblocknonce").value;
		apiClient.postBlock(block).then(blockid => {
			updateLastSubmittedBlock(blockid);
			blockPayloadInEditor = initializeTypeAsJSON("Payload");
			initBlockPayloadEditor();
			document.getElementById("timinginfo").innerText = powTime + "postBlock took "+(Date.now()-startTime)+" ms";
			powTime = "";
		}, showMessage);
	});
	document.getElementById("powupdatehash").addEventListener("click", function(e) {
		let payload = unmarshalFromJSON(blockPayloadInEditor, "Payload");
		let block = new iotaSdkWasm.Block();
		block.protocolVersion = 2;
		block.parents = document.getElementById("postblocktips").value.split(/[\r\n]+/);
		block.payload = payload;
		block.nonce = "0";
		document.getElementById("powblockhash").value = iotaSdkWasm.Utils.blockHashWithoutNonce(block);
		let targetZeros = 1;
		const blocksize = iotaSdkWasm.Utils.blockBytes(block).length;
		while(3**targetZeros / blocksize < apiClientProtocolParameters.minPowScore) {
			targetZeros++;
		}
		document.getElementById("powtargetzeros").value = targetZeros;
	});
	document.getElementById("powwasmfile").addEventListener("change", function(e) {
		let file = document.getElementById("powwasmfile").value;
		iotaPoW.initWasm(file == '' ? null : document.getElementById("powscript").src.replace(/\/[^/]+$/, file));
	});
	document.getElementById("powrun").addEventListener("click", function(e) {
		document.getElementById("timinginfo").innerText = "PoW running...";
		let startTime = Date.now();
		runPoW().then(nonce => {
			if (nonce == null) {
				document.getElementById("timinginfo").innerText = "PoW timed out after "+(Date.now()-startTime)+" ms";
			} else {
				document.getElementById("postblocknonce").value = ""+nonce;
				document.getElementById("timinginfo").innerText = "PoW took "+(Date.now()-startTime)+" ms";
			}
		});
	});
	document.getElementById("powrepeat").addEventListener("click", async function(e) {
		let startTime = Date.now();
		let count = +document.getElementById("powrepetittions").value;
		for (let i = 1; i <= count; i++) {
			document.getElementById("timinginfo").innerText = "PoW attempt " + i + " of " + count;
			let tips = await apiClient.getTips();
			document.getElementById("postblocktips").value = tips.join("\n");
			document.getElementById("powupdatehash").click();
			let nonce = await runPoW();
			if (nonce != null) {
				document.getElementById("postblocknonce").value = ""+nonce;
				powTime = "PoW took "+(Date.now()-startTime)+" ms, ";
				document.getElementById("postBlock").click();
				return;
			}
		};
		document.getElementById("timinginfo").innerText = count + " PoW attempts failed";
	});
	fetch(document.getElementById("powscript").src).then(r => r.text()).then(text => {
		iotaPoW.initWorker(URL.createObjectURL(new Blob([text], { type: 'text/javascript' })));
	});
	let wasmURL = "https://cdn.jsdelivr.net/npm/@iota/sdk-wasm@1.1.3/web/wasm/iota_sdk_wasm_bg.wasm";
		initIota(wasmURL);
		if (location.host == 'iota-laboratory.github.io') {
			document.querySelector(location.pathname.startsWith("/xv/") ? "#versionswitcher a:last-child" : "#versionswitcher a:first-child").removeAttribute("href");
			document.getElementById("versionswitcher").style.display="block";
		}
};

function initBlockPayloadEditor() {
	let editor = document.getElementById("editorcontent");
	editor.innerHTML = "";
	fillBlockPayloadEditor(editor, blockPayloadInEditor, "Payload", null, '');
}

function fillBlockPayloadEditor(parent, elem, type, propObject, propKey) {
	if (type.endsWith("[]") && typeof(elem) === 'object' && elem instanceof Array) {
		let elemType = type.substring(0, type.length - 2);
		let dl = document.createElement("dl");
		dl.classList.add("array");
		for(let i = 0; i < elem.length; i++) {
			let dt = document.createElement("dt");
			dt.innerHTML = '<sup><a href="#">[Add]</a></sup> '+i+'<sup><a href="#">[Delete]</a></sup>';
			dl.appendChild(dt);
			dt.firstChild.firstChild.addEventListener("click", function(e) {
				e.preventDefault();
				elem.splice(i, 0, initializeTypeAsJSON(elemType));
				parent.innerHTML = '';
				fillBlockPayloadEditor(parent, elem, type, propObject, propKey);
			});
			dt.firstChild.nextElementSibling.firstChild.addEventListener("click", function(e) {
				e.preventDefault();
				elem.splice(i, 1);
				parent.innerHTML = '';
				fillBlockPayloadEditor(parent, elem, type, propObject, propKey);
			});
			let dd = document.createElement("dd");
			fillBlockPayloadEditor(dd, elem[i], elemType, elem, i);
			dl.appendChild(dd);
		}
		let dt = document.createElement("dt");
		dt.innerHTML = '<sup><a href="#">[Add]</a></sup>';
		dl.appendChild(dt);
		dt.firstChild.firstChild.addEventListener("click", function(e) {
			e.preventDefault();
			elem.push(initializeTypeAsJSON(elemType));
			parent.innerHTML = '';
			fillBlockPayloadEditor(parent, elem, type, propObject, propKey);
		});
		let dd = document.createElement("dd");
		dd.innerText = "\u00A0";
		dl.appendChild(dd);
		parent.appendChild(dl);
	} else if (type.endsWith("?")) {
		let elemType = type.substring(0, type.length - 1);
		let empty = typeof(elem) === 'object' && elem["(type)"] === "(undefined)";
		let dl = document.createElement("dl");
		dl.classList.add("optional");
		parent.appendChild(dl);
		let dt = document.createElement("dt");
		dt.innerHTML='<input type="checkbox"' + (empty ? '': ' checked')+'>';
		dl.appendChild(dt);
		let dd = document.createElement("dd");
		dl.appendChild(dd);
		let update = function() {
			let currElem = propObject[propKey];
			dd.innerHTML = "&nbsp;";
			if (typeof(currElem) === 'object' && currElem["(type)"] === "(undefined)") {
				return;
			}
			fillBlockPayloadEditor(dd, currElem, elemType, propObject, propKey);
		};
		dt.firstChild.addEventListener("click", function(e) {
			propObject[propKey] = initializeTypeAsJSON(dt.firstChild.checked ? elemType : type);
			update();
		});
		update();
	} else if (typeof(elem) === 'object' && /^[A-Za-z0-9]+$/.test(type) && blockPayloadTypes[type].a && blockPayloadTypes[type].s.includes(elem["(type)"])) {
		let dl = document.createElement("dl");
		parent.appendChild(dl);
		let dt = document.createElement("dt");
		dt.innerText = "Type:";
		dl.appendChild(dt);
		let ddd = document.createElement("dd");
		if (blockPayloadEditorDoc) {
			ddd.classList.add("doc");
			ddd.innerText = "(" + blockPayloadTypes[elem["(type)"]].d + ")";
			dl.appendChild(ddd);
		}
		let dd = document.createElement("dd");
		dd.innerHTML = '<select></select><sup><a href="#">[Copy]</a> <a href="#">[Paste]</a></sup>';
		dl.appendChild(dd);
		let len = dl.childNodes.length;
		let selectBox = dd.firstChild;
		for(let subtype of blockPayloadTypes[type].s) {
			let option = document.createElement("option");
			option.innerText = subtype;
			option.selected = subtype == elem["(type)"];
			selectBox.options.add(option);
		}
		selectBox.addEventListener("change", function(e) {
			replaceObject(elem, initializeTypeAsJSON(selectBox.selectedOptions[0].value));
			ddd.innerText = "(" + blockPayloadTypes[elem["(type)"]].d + ")";
			while(dl.childNodes.length > len) dl.removeChild(dl.childNodes[len]);
			fillBlockPayloadEditorProps(dl, elem, elem["(type)"]);
		});
		let copyLink = dd.firstChild.nextElementSibling.firstChild;
		let pasteLink = copyLink.nextElementSibling;
		copyPasteBlockPayloadEditorElement(parent, elem, type, copyLink, pasteLink);
		fillBlockPayloadEditorProps(dl, elem, elem["(type)"]);
	} else if (typeof(elem) === 'object' && elem["(type)"] === type) {
		let dl = document.createElement("dl");
		parent.appendChild(dl);
		let dt = document.createElement("dt");
		dt.innerText = "Type:";
		dl.appendChild(dt);
		let ddd = document.createElement("dd");
		if (blockPayloadEditorDoc) {
			ddd.classList.add("doc");
			ddd.innerText = "(" + blockPayloadTypes[type].d + ")";
			dl.appendChild(ddd);
		}
		let dd = document.createElement("dd");
		dd.innerText = type;
		dd.innerHTML += '<sup><a href="#">[Copy]</a> <a href="#">[Paste]</a></sup>';
		dl.appendChild(dd);
		let copyLink = dd.firstChild.nextElementSibling.firstChild;
		let pasteLink = copyLink.nextElementSibling;
		copyPasteBlockPayloadEditorElement(parent, elem, type, copyLink, pasteLink);
		fillBlockPayloadEditorProps(dl, elem, type);
	} else if (typeof(elem) === 'string' || typeof(elem) === 'boolean' || typeof(elem) === 'number') {
		let convertValue = s => s;
		if (typeof(elem) === 'boolean') convertValue = s => s == "true";
		if (typeof(elem) === 'number') convertValue = s => +s;
		parent.innerHTML = '<input type="text">';
		parent.firstChild.value = elem.toString();
		parent.firstChild.addEventListener("change", function(e) {
			if (!isValidString(parent.firstChild.value, type)) {
				showMessage("Invalid value");
				parent.firstChild.value = propObject[propKey].toString();
			} else {
				propObject[propKey] = convertValue(parent.firstChild.value);
			}
		});
	} else {
		throw "No editor available for " + elem + " as " + type;
	}
}

function fillBlockPayloadEditorProps(dl, elem, type) {
	for (let field of blockPayloadTypes[type].f) {
		let dt = document.createElement("dt");
		dt.innerText = field.n+":";
		dl.appendChild(dt);
		let ddd = document.createElement("dd");
		if (blockPayloadEditorDoc) {
			ddd.classList.add("doc");
			ddd.innerText="("+field.d+")";
			dl.appendChild(ddd);
		}
		let dd = document.createElement("dd");
		fillBlockPayloadEditor(dd, elem[field.n], field.t, elem, field.n);
		dl.appendChild(dd);
	}
}

function copyPasteBlockPayloadEditorElement(parent, elem, type, copyLink, pasteLink) {
	copyLink.addEventListener("click", function(e) {
		e.preventDefault();
		copyText(JSON.stringify(elem));
	});
	pasteLink.addEventListener("click", function(e) {
		e.preventDefault();
		pasteAction = function(text) {
			if (text == "") return;
			try {
				let o = unmarshalFromJSON(JSON.parse(text), type);
				replaceObject(elem, marshalToJSON(o, type));
				parent.innerHTML = "";
				fillBlockPayloadEditor(parent, elem, type, null, '');
			} catch (e) {
				showMessage(e.toString());
			}
		};
		let deniedAction = function() {
			document.getElementById("pasteHelper").showModal();
		};
		if (navigator.clipboard.readText) {
			navigator.clipboard.readText().then(pasteAction, deniedAction);
		} else {
			deniedAction();
		}
	});
}

function validatePayload(payload, timestamp) {
	let errors = "";
	if (payload.essence.networkId !== apiClientNetworkId) {
		errors += "Network ID invalid: " + payload.essence.networkId + " != " + apiClientNetworkId + ' <input type="button" id="updatenetwork" value="Update Network ID"><br>';
	}
	let inputOutputIDs = [];
	for(const input of payload.essence.inputs) {
		if (input instanceof iotaSdkWasm.UTXOInput) {
			inputOutputIDs.push(iotaSdkWasm.Utils.computeOutputId(input.transactionId, input.transactionOutputIndex));
		}
	}
	for(const i in payload.essence.outputs) {
		const output = payload.essence.outputs[i]
		const deposit = iotaSdkWasm.Utils.computeStorageDeposit(output, apiClientProtocolParameters.rentStructure);
		if (BigInt(output.amount) < deposit) {
			errors += "Amount of output #"+i+" ("+output.amount+") does not cover storage deposit (" + deposit+")<br>";
		}
	}
	try {
		console.log(iotaSdkWasm.Utils.verifyTransactionSyntax(payload, apiClientProtocolParameters));
	} catch (e) {
		errors += "Syntactic verification failed: " + JSON.stringify(e) + "<br>";
	}
	return new Promise((resolved, rejected) => {
		getCachedOutputs(inputOutputIDs).then(inputOutputs => {
			let commitment = iotaSdkWasm.Utils.computeInputsCommitment(inputOutputs.map(o => o.output));
			if (payload.essence.inputsCommitment !== commitment) {
				errors += "Inputs commitment invalid: " + payload.essence.inputsCommitment + " != " + commitment + ' <input type="button" id="updateinput" value="Update Inputs Commitment"><br>';
			}
			let utxoInputsData = inputOutputs.map(o => ({output: o.output, outputMetadata: o.metadata}));
			let validationResult = "";
			try {
				validationResult = iotaSdkWasmXV.verifySemanticWithoutUnlocks(utxoInputsData, payload.essence, timestamp);
			} catch (e) {
				validationResult = "ERROR: " + JSON.stringify(e);
			}
			if (validationResult != "None") {
				errors += "Semantic verification (without unlocks) failed: " + validationResult + "<br>";
			}
			try {
				validationResult = iotaSdkWasm.Utils.verifyTransactionSemantic(utxoInputsData, payload, timestamp);
			} catch (e) {
				validationResult = "ERROR: " + JSON.stringify(e);
			}
			if (validationResult != "None") {
				errors += "Semantic verification failed: " + validationResult + "<br>";
			}
			if (errors == "") {
				document.getElementById("validationsummary").innerHTML = "Validation ok";
				resolved(true);
			} else {
				document.getElementById("validationsummary").innerHTML = errors;
				if (document.getElementById("updatenetwork") !== null) {
					document.getElementById("updatenetwork").addEventListener("click", function(e) {
						updateTransactionPayload(transactionPayload => {
							transactionPayload.essence.networkId = apiClientNetworkId;
						});
					});
				}
				if (document.getElementById("updateinput") !== null) {
					document.getElementById("updateinput").addEventListener("click", function(e) {
						let inputOutputIDs = [];
						updateTransactionPayload(transactionPayload => {
							for(let input of transactionPayload.essence.inputs) {
								if (input instanceof iotaSdkWasm.UTXOInput) {
									inputOutputIDs.push(iotaSdkWasm.Utils.computeOutputId(input.transactionId, input.transactionOutputIndex));
								}
							}
						});
						getCachedOutputs(inputOutputIDs).then(responses => {
							let inputOutputs = responses.map(r => r.output);
							updateTransactionPayload(transactionPayload => {
								transactionPayload.essence.inputsCommitment = iotaSdkWasm.Utils.computeInputsCommitment(inputOutputs);
							});
						});
					});
				}
				resolved(false);
			}
		});
	});
}

function replaceObject(obj, replacement) {
	for(let p in obj) {
		delete obj[p];
	}
	Object.assign(obj, replacement);
}

function isValidString(value, type) {
	if (["(NumericString)","(bigint)",'(number)'].includes(type)) {
		return /^[0-9]+$/.test(value);
	} else if (type == '(boolean)') {
		return value === "true" || value === "false";
	} else if (type == "(string)") {
		return true;
	} else if (["(HexEncodedString)","(HexEncodedAmount)"].includes(type)) {
		return /^0x([0-9a-f][0-9a-f])+$/.test(value);
	} else {
		throw "Invalid type " + type + " for " + value;
	}
}

function showJSON(parent, elem) {
	if (typeof(elem) === 'object' && elem instanceof Array) {
		let dl = document.createElement("dl");
		for(let i = 0; i<elem.length; i++) {
			let dt = document.createElement("dt");
			dt.innerText = i+":";
			let dd = document.createElement("dd");
			showJSON(dd, elem[i]);
			dl.appendChild(dt);
			dl.appendChild(dd);
		}
		parent.appendChild(dl);
	} else if (typeof(elem) === 'object') {
		let dl = document.createElement("dl");
		for(let key in elem) {
			let dt = document.createElement("dt");
			dt.innerText = key+":";
			let dd = document.createElement("dd");
			showJSON(dd, elem[key]);
			dl.appendChild(dt);
			dl.appendChild(dd);
		}
		parent.appendChild(dl);
	} else if (/^0x([0-9a-f][0-9a-f])+$/.test(elem.toString())) {
		parent.innerHTML = '<tt>'+elem.toString()+'</tt><sup><a href="javascript:copyText(\'' + elem.toString() + '\');">[Copy]</a></sup>';
	} else {
		parent.innerText = elem.toString()+"\u00A0";
	}
}

async function testValidation(blockid, payload, validationCache) {
	let blockmeta = await apiClient.getBlockMetadata(blockid);
	if (blockmeta.ledgerInclusionState !== 'included')
		return;
	let timestamp = validationCache["mt-" + blockmeta.referencedByMilestoneIndex];
	if (timestamp === undefined) {
		let milestone = await apiClient.getMilestoneByIndex(blockmeta.referencedByMilestoneIndex);
		timestamp = milestone.timestamp;
		validationCache["mt-" + milestone.index] = timestamp;
	}
	if (!await validatePayload(payload, timestamp)) {
		throw "Validation of " + blockid + " failed";
	}
}

async function testBlockPayloadEditor(validate) {
	if (window.testRunning) {
		window.testRunning = false;
		return;
	}
	window.testRunning = true;
	let blockidqueue = [];
	let seenBlocks = {};
	let validationCache = {};
	let info = await apiClient.getInfo();
	let milestone = await apiClient.getMilestoneByIndex(info.nodeInfo.status.latestMilestone.index);
	blockidqueue.push(...milestone.parents);
	while(blockidqueue.length > 0 && window.testRunning) {
		let blockid = blockidqueue.shift();
		if (seenBlocks[blockid]) continue;
		seenBlocks[blockid] = true;
		console.log(blockid);
		let block = await apiClient.getBlock(blockid);
		blockidqueue.push(...block.parents);
		block.payload = unmarshalFromJSON(marshalToJSON(block.payload, 'Payload'), 'Payload');
		if (iotaSdkWasm.Utils.blockId(block) != blockid) throw "Mismatch in block "+blockid;
		loadBlockPayload(block.payload);
		if (validate && block.payload instanceof iotaSdkWasm.TransactionPayload) {
			await testValidation(blockid, block.payload, validationCache);
		}
	}
}
