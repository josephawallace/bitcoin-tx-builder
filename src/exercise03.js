import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import { ECPair } from 'ecpair';
import axios from 'axios';
import promptSync from 'prompt-sync';
import path from 'path';
import fs from 'fs';
const prompt = promptSync();
const SAT_BTC_MULT = 1e8;
const TESTNET = bitcoin.networks.testnet;
const TXO_FILE_PATH = path.join(path.resolve(), 'extras', 'wallet', 'txo.json');
const apiUrl = 'https://blockstream.info/testnet/api';
const validator = (pubkey, msghash, signature) => ECPair.fromPublicKey(pubkey).verify(msghash, signature);
const bip32 = BIP32Factory(ecc);
// const mnemonic = bip39.generateMnemonic();
const mnemonic = 'height dad moral vacant clump service category unhappy dumb remain soda dash';
const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = bip32.fromSeed(seed); // master key and master chain code
let children = [], index = 0, unusedCount = 0;
while (unusedCount < 20) {
    // create HD wallet child
    const derivationPath = `m/44\'/1\'/0\'/0/${index}`;
    const child = root.derivePath(derivationPath);
    const payment = bitcoin.payments.p2pkh({
        pubkey: child.publicKey,
        network: TESTNET,
    });
    // check if address is used
    let used = false;
    const addressTxs = (await axios.get(`${apiUrl}/address/${payment.address}/txs`)).data;
    if (addressTxs.length > 0) {
        used = true;
        unusedCount = 0;
    }
    else {
        unusedCount++;
    }
    // push child and move to the next
    children.push({ address: payment.address, derivationPath: derivationPath, privateKey: child.privateKey, used: used });
    index++;
}
const getAddressTxRecords = async (child) => {
    // gather all transaction outputs and txids that have been used as input (i.e. spent)
    let txRecords = [];
    let spentTxids = [];
    const addressTxs = (await axios.get(`${apiUrl}/address/${child.address}/txs`)).data;
    for (const tx of addressTxs) {
        for (let index = 0; index < tx.vout.length; index++) {
            if (tx.vout[index].scriptpubkey_address == child.address) {
                const txhex = (await axios.get(`${apiUrl}/tx/${tx.txid}/hex`)).data;
                txRecords.push({
                    address: child.address,
                    derivationPath: child.derivationPath,
                    hash: tx.txid,
                    index: index,
                    nonWitnessUtxo: txhex,
                    value: tx.vout[index].value,
                    spent: false,
                });
            }
        }
        for (let index = 0; index < tx.vin.length; index++) {
            spentTxids.push(tx.vin[index].txid);
        }
    }
    // indicate spent transaction outputs
    spentTxids.forEach(spentTxid => {
        const spent = txRecords.some(txRecord => txRecord.hash == spentTxid);
        if (spent) {
            const spentOutput = (txRecord) => txRecord.hash == spentTxid;
            const spentOutputIndex = txRecords.findIndex(spentOutput);
            txRecords[spentOutputIndex].spent = true;
        }
    });
    return txRecords;
};
const getAllTxos = async () => {
    // get all transaction outputs across addresses
    let allTxos = [];
    for (const child of children) {
        if (!child.used) {
            continue;
        }
        const txos = await getAddressTxRecords(child);
        allTxos = allTxos.concat(txos);
    }
    return allTxos;
};
const createTxoJsonRecord = async (allTxos) => {
    if (!fs.existsSync(TXO_FILE_PATH)) {
        const allTxos = await getAllTxos();
        fs.writeFileSync(TXO_FILE_PATH, JSON.stringify(allTxos), { flag: 'w+' });
    }
};
const txos = await getAllTxos();
const getBalance = () => {
    let balance = 0;
    for (const tx of txos) {
        if (!tx.spent) {
            balance += tx.value;
        }
    }
    return balance;
};
const getReceiveAddress = () => {
    for (let i = 0; i < children.length; i++) {
        if (!children[i].used) {
            return children[i].address;
        }
    }
};
const createTransaction = (address, outputValue, transactionFee) => {
    let utxoValueSum = 0, signers = [];
    const psbt = new bitcoin.Psbt({ network: TESTNET });
    txos.forEach((txo) => {
        if (txo.spent || utxoValueSum >= outputValue + transactionFee) {
            return;
        }
        utxoValueSum += txo.value;
        psbt.addInput({
            hash: txo.hash,
            index: txo.index,
            nonWitnessUtxo: Buffer.from(txo.nonWitnessUtxo, 'hex'),
        });
        const signer = children.find(child => {
            return child.derivationPath == txo.derivationPath;
        });
        signers.push(signer);
    });
    psbt.addOutput({
        address: address,
        value: outputValue,
    });
    const receiveAddress = getReceiveAddress();
    psbt.addOutput({
        address: receiveAddress,
        value: utxoValueSum - outputValue - transactionFee,
    }); // change
    signers.forEach(signer => {
        psbt.signAllInputs(ECPair.fromPrivateKey(signer.privateKey));
    });
    psbt.validateSignaturesOfAllInputs(validator);
    psbt.finalizeAllInputs();
    const rawTransaction = psbt.extractTransaction().toHex();
    console.log('\n' + rawTransaction + '\n');
    return rawTransaction;
};
const start = () => {
    const receiveAddress = getReceiveAddress();
    console.log(`Receive address: ${receiveAddress}`);
    const balance = getBalance();
    console.log(`Balance: ${balance / SAT_BTC_MULT} BTC\n`);
    let i = 0;
    txos.forEach(txo => {
        if (!txo.spent) {
            console.log(`UTXO ${i}: ${txo.value / SAT_BTC_MULT} BTC`);
            i++;
        }
    });
    console.log('');
    const outputAddress = prompt('Enter the address you would like to send tBTC to: ');
    const outputValue = Math.floor(Number((prompt('Enter the value of tBTC you would like to send: ')) * SAT_BTC_MULT));
    const transactionFee = (prompt('Enter the value of the transaction fee: ')) * SAT_BTC_MULT;
    createTransaction(outputAddress, outputValue, transactionFee);
};
start();
