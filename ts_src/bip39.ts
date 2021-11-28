import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1'
import * as bip39 from 'bip39';
import { ECPair } from 'ecpair';
import axios from 'axios';
import promptSync from 'prompt-sync';
const prompt = promptSync();

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

console.log(`Testnet address #1: ${payment.address}\n`);
console.log(`Fund the address above using a Bitcoin testnet faucet (i.e. https://bitcoinfaucet.uo1.net).`);

prompt('Press \'Enter\' to continue...');
const outputAddress = prompt('Enter the address you would like to send tBTC to: '); // tb1ql7w62elx9ucw4pj5lgw4l028hmuw80sndtntxt
const outputValue = prompt('Enter the value of tBTC you would like to send: '); // 0.00075

const getTxInput = async () => {
    const apiUrl = 'https://blockstream.info/testnet/api';
    const addressTxs = (await axios.get(`${apiUrl}/address/${payment.address}/txs`)).data;

    let utxoValueSum = 0;
    let inputData = [];
    for (const tx of addressTxs) {
        for (let index = 0; index < tx.vout.length; index++) {
            if (tx.vout[index].scriptpubkey_address == payment.address && outputValue * 1e8 > utxoValueSum) {
                const txhex = (await axios.get(`${apiUrl}/tx/${tx.txid}/hex`)).data;
                inputData.push({
                    hash: tx.txid,
                    index: index,
                    nonWitnessUtxo: Buffer.from(txhex, 'hex')
                });
                utxoValueSum += tx.vout[index].value;
            }
        }
    }
    if (utxoValueSum >= outputValue * 1e8) { return inputData; }
    else { throw new Error('Insufficient funds.'); }
};

const inputData = await getTxInput();
console.log(inputData);

const psbt = new bitcoin.Psbt({ network: TESTNET });
inputData.forEach((input) => {
    psbt.addInput(input);
});
psbt.addOutput({
    address: outputAddress,
    value: outputValue * 1e8,
});

for (let i = 0; i < inputData.length; i++) {
    psbt.signInput(i, ECPair.fromPrivateKey(child.privateKey));
    psbt.validateSignaturesOfInput(i, validator);
}
psbt.finalizeAllInputs();
const rawTransaction = psbt.extractTransaction().toHex();
console.log(rawTransaction);