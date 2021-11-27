require('dotenv').config()
import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1'
import * as bip39 from 'bip39';
import { ECPair } from 'ecpair';
const prompt = require('prompt-sync')();

const TESTNET = bitcoin.networks.testnet;

const validator = (
    pubkey: Buffer,
    msghash: Buffer,
    signature: Buffer,
): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

const bip32 = BIP32Factory(ecc);

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
console.log(`Use the above address to send tBTC from a faucet. Then use the address to lookup the resulting transaction (https://live.blockcypher.com/btc-testnet/address/${payment.address}).\n`);

prompt('Press \'Enter\' if the current balance is greater than zero.')

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

psbt.signInput(0, ECPair.fromPrivateKey(child.privateKey));
psbt.validateSignaturesOfInput(0, validator);
psbt.finalizeAllInputs();
console.log(psbt.extractTransaction().toHex());

// https://blockstream.info/testnet/api/address/mnJjVxhz8fXeeQji5w1YrLxdbwDzW5Gk5d/txs