import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1'
import * as bip39 from 'bip39';
import { ECPair } from 'ecpair';
import axios from 'axios';
import promptSync from 'prompt-sync';
const prompt = promptSync();

const SAT_BTC_MULT = 1e8;
const TESTNET = bitcoin.networks.testnet;
const apiUrl = 'https://blockstream.info/testnet/api';

const validator = (
    pubkey: Buffer,
    msghash: Buffer,
    signature: Buffer,
): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

const bip32 = BIP32Factory(ecc);

// const mnemonic  = bip39.generateMnemonic();
const mnemonic = 'design differ hub arm among worth final cycle pioneer smooth artwork run';
const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = bip32.fromSeed(seed); // master key and master chain code

const path = 'm/44\'/1\'/0\'/0/0';
const child = root.derivePath(path);

const payment = bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network: TESTNET,
});

console.log(payment);~

console.log(`Testnet address #1: ${payment.address}`);
prompt('Fund the address above using a Bitcoin testnet faucet (i.e. https://bitcoinfaucet.uo1.net). Press \'Enter\' to continue...');

const outputAddress = prompt('Enter the address you would like to send tBTC to: ');
const outputValue = Math.floor(Number((prompt('Enter the value of tBTC you would like to send: ')) * SAT_BTC_MULT));
// const outputValue = Math.floor(Number(0.00002 * SAT_BTC_MULT));
// const transactionFee = (prompt('Enter the value of the transaction fee: ')) * SAT_BTC_MULT;
// const outputAddress = 'tb1ql7w62elx9ucw4pj5lgw4l028hmuw80sndtntxt';
const transactionFee = Math.floor(Number(250));
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
    if (utxoValueSum >= outputValue + transactionFee) { return; }
    utxoValueSum += input.value;
    psbt.addInput({
       hash: input.hash,
       index: input.index,
       nonWitnessUtxo: input.nonWitnessUtxo, 
    });
});
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
console.log('\n' + rawTransaction + '\n');
const newTxId = (await axios.post('https://blockstream.info/testnet/api/tx', rawTransaction)).data;
console.log(`New transaction: https://blockstream.info/testnet/tx/${newTxId}`);