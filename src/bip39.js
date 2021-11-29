import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import { ECPair } from 'ecpair';
import axios from 'axios';
import promptSync from 'prompt-sync';
const prompt = promptSync();
const SAT_BTC_MULT = 1e8;
const TESTNET = bitcoin.networks.testnet;
const apiUrl = 'https://blockstream.info/testnet/api';
const validator = (pubkey, msghash, signature) => ECPair.fromPublicKey(pubkey).verify(msghash, signature);
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
console.log(`Testnet address #1: ${payment.address}`);
prompt('Fund the address above using a Bitcoin testnet faucet (i.e. https://bitcoinfaucet.uo1.net). Press \'Enter\' to continue...');
// const outputAddress = prompt('Enter the address you would like to send tBTC to: ');
// const outputValue = (prompt('Enter the value of tBTC you would like to send: ')) * 1e8;
// const transactionFee = (prompt('Enter the value of the transaction fee: ')) * 1e8;
const outputAddress = 'tb1ql7w62elx9ucw4pj5lgw4l028hmuw80sndtntxt';
const outputValue = Number(0.0002 * 1e8);
const transactionFee = Number(8000);
const addressTxs = (await axios.get(`${apiUrl}/address/${payment.address}/txs`)).data;
let inputs = [];
let spentTxids = [];
for (const tx of addressTxs) {
    for (let index = 0; index < tx.vout.length; index++) {
        if (tx.vout[index].scriptpubkey_address == payment.address) {
            const txhex = (await axios.get(`${apiUrl}/tx/${tx.txid}/hex`)).data;
            inputs.push({
                hash: tx.txid,
                index: index,
                nonWitnessUtxo: Buffer.from(txhex, 'hex'),
                value: tx.vout[index].value,
            });
        }
    }
    for (let index = 0; index < tx.vin.length; index++) {
        spentTxids.push(tx.vin[index].txid);
    }
}
spentTxids.forEach(spentTxid => {
    const spent = inputs.some(input => input.hash == spentTxid);
    if (spent) {
        const spentInput = (input) => input.hash == spentTxid;
        const spentInputIndex = inputs.findIndex(spentInput);
        inputs.splice(spentInputIndex, 1);
    }
});
let utxoValueSum = 0;
const psbt = new bitcoin.Psbt({ network: TESTNET });
inputs.forEach((input) => {
    utxoValueSum += input.value;
    console.log({
        hash: input.hash,
        index: input.index,
        nonWitnessUtxo: input.nonWitnessUtxo,
    });
    psbt.addInput({
        hash: input.hash,
        index: input.index,
        nonWitnessUtxo: input.nonWitnessUtxo,
    });
});
// console.log(utxoValueSum);
// console.log(outputValue);
// console.log(transactionFee);
// console.log(psbt.data.inputs);
psbt.addOutput({
    address: outputAddress,
    value: outputValue,
});
psbt.addOutput({
    address: payment.address,
    value: utxoValueSum - outputValue - transactionFee,
}); // change
psbt.signAllInputs(ECPair.fromPrivateKey(child.privateKey));
psbt.validateSignaturesOfAllInputs(validator);
psbt.finalizeAllInputs();
const rawTransaction = psbt.extractTransaction().toHex();
console.log(rawTransaction);
// const newTxId = (await axios.post('https://blockstream.info/testnet/api/tx', { body: rawTransaction })).data;
// console.log(`New transaction: https://blockstream.info/testnet/tx/${newTxId}`);
