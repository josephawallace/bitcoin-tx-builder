import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import { ECPair } from 'ecpair';
import axios from 'axios';
import promptSync from 'prompt-sync';
const prompt = promptSync();
const TESTNET = bitcoin.networks.testnet;
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
console.log(`Testnet address #1: ${payment.address}\n`);
console.log(`Use the above address to send tBTC from a faucet. The transaction hex that will be built will send back half of the tBTC to the faucet it was received from.\n`);
prompt('Press \'Enter\' once the transaction to receive tBTC from the faucet has a confirmation.\n');
// construct the input data as the last utxo associated with the address
const getTxInput = async () => {
    const apiUrl = 'https://blockstream.info/testnet/api';
    const addressTxs = (await axios.get(`${apiUrl}/address/${payment.address}/txs`)).data;
    for (const tx of addressTxs) {
        for (let index = 0; index < tx.vout.length; index++) {
            if (tx.vout[index].scriptpubkey_address == payment.address) {
                const txhex = (await axios.get(`${apiUrl}/tx/${tx.txid}/hex`)).data;
                const inputData = {
                    hash: tx.txid,
                    index: index,
                    nonWitnessUtxo: Buffer.from(txhex, 'hex')
                };
                return inputData;
            }
        }
    }
};
const inputData = await getTxInput();
const outputAddress = prompt('Enter the address you would like to send tBTC to: '); // tb1ql7w62elx9ucw4pj5lgw4l028hmuw80sndtntxt
const outputValue = prompt('Enter the value of tBTC you would like to send: '); // 0.0001
const psbt = new bitcoin.Psbt({ network: TESTNET })
    .addInput(inputData)
    .addOutput({
    address: outputAddress,
    value: outputValue * 1e8,
});
psbt.signInput(0, ECPair.fromPrivateKey(child.privateKey));
psbt.validateSignaturesOfInput(0, validator);
psbt.finalizeAllInputs();
console.log('\n');
console.log(psbt.extractTransaction().toHex());
