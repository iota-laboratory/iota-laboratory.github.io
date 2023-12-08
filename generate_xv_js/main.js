import init from "@iota-laboratory/iota-sdk-wasm-xv/web";
import { Utils } from "@iota-laboratory/iota-sdk-wasm-xv/web";

window.iotaSdkWasmXV = { init, verifySemanticWithoutUnlocks: Utils.verifySemanticWithoutUnlocks };
