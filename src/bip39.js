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
require('dotenv').config();
const bitcoin = __importStar(require("bitcoinjs-lib"));
const bip32_1 = __importDefault(require("bip32"));
const ecc = __importStar(require("tiny-secp256k1"));
const bip39 = __importStar(require("bip39"));
const ecpair_1 = require("ecpair");
const prompt = require('prompt-sync')();
const TESTNET = bitcoin.networks.testnet;
const validator = (pubkey, msghash, signature) => ecpair_1.ECPair.fromPublicKey(pubkey).verify(msghash, signature);
const bip32 = (0, bip32_1.default)(ecc);
// const mnemonic  = bip39.generateMnemonic();
const mnemonic = 'design differ hub arm among worth final cycle pioneer smooth artwork run';
const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = bip32.fromSeed(seed);
const path = 'm/44\'/1\'/0\'/0/0';
const child = root.derivePath(path);
const payment = bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network: TESTNET,
});
console.log(`Testnet address: ${payment.address}`);
console.log(`Use the above address to send tBTC from a faucet if the current balance is zero. Then use the address to lookup the resulting transaction (https://live.blockcypher.com/btc-testnet/address/${payment.address}).\n`);
prompt('Press \'Enter\' if the current balance is greater than zero.');
console.log('Using the most recent UTXO associated with the address to send tBTC back to the faucet...');
const txid = '9e73274fc8cab354aab97c40aa5d07fa9a3293a7984e363c24cf167f4a6c33b1';
const index = 0;
const txhex = '0200000000010111a49ce15c76b99b2f4f6e6f38e1759ff7e5be4f8dd5769a0229d6fcb8642bc00000000017160014193be7ef20ea4958e7c8841923dc7e29b42cad31feffffff02ca430100000000001976a9144a79355df98184e5fdea6cd27f701caaa45f178c88acfc71bd0f0000000017a914f46a6ccd24b4729a3ac66b507ac1c43b65f6f29a870247304402205736d37ca512b7d25cc940e05728de10a4c3b39bc05041ab555941c80a3ad98402206140df25c17f9a568b968d6231c2d8a2fc61a65d8569955b014778f3a5f4df8801210262407c86f6e88e4465f4edbe4d87b41abe01d1d76b0f335da736e89bf66ed41a69202000';
const nonWitnessUtxo = Buffer.from(txhex, 'hex'); // is the txid in hex
const inputData = {
    hash: txid,
    index: index,
    nonWitnessUtxo: nonWitnessUtxo,
};
const psbt = new bitcoin.Psbt({ network: TESTNET })
    .addInput(inputData)
    .addOutput({
    address: 'mkHS9ne12qx9pS9VojpwU5xtRd4T7X7ZUt',
    value: 1e4,
});
psbt.signInput(0, ecpair_1.ECPair.fromPrivateKey(child.privateKey));
psbt.validateSignaturesOfInput(0, validator);
psbt.finalizeAllInputs();
console.log(psbt.extractTransaction().toHex());
