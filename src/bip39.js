"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bip32_1 = __importDefault(require("bip32"));
const ecc = __importStar(require("tiny-secp256k1"));
const bip39 = __importStar(require("bip39"));
const TESTNET = bitcoin.networks.testnet;
const bip32 = (0, bip32_1.default)(ecc); // pass the eliptic curve into the HD wallet factory
const mnemonic = bip39.generateMnemonic(); // process described in README
const seed = bip39.mnemonicToSeedSync(mnemonic); // process described in README
const root = bip32.fromSeed(seed); // master key and chaincode
const path = 'm/44\'/1\'/0\'/0/0';
const child = root.derivePath(path);
const { address } = bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network: TESTNET,
});
console.log(address);
