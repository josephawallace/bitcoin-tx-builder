import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import { ECPair } from 'ecpair';
import axios from 'axios';
import promptSync from 'prompt-sync';
import path from 'path';
import ora from 'ora';
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
const getWalletData = async () => {
    const spinner = ora('Getting wallet data...').start();
    let unspentTransactions = [];
    let unusedAddresses = [];
    let balance = 0;
    // loop through addresses, stop at 20 consecutive unused addresses
    let index = 0, changeAddress = false, unusedCount = 0;
    while (unusedCount < 20) {
        const derivationPath = `m/44\'/1\'/0\'/${changeAddress ? 1 : 0}/${index}`;
        const child = root.derivePath(derivationPath);
        const payment = bitcoin.payments.p2pkh({
            pubkey: child.publicKey,
            network: TESTNET,
        });
        // get all transactions associated with address
        const transactions = (await axios.get(`${apiUrl}/address/${payment.address}/txs`)).data;
        // track addresses with no associated transactions as unused (excluding change address)
        if (transactions.length > 0 && !changeAddress) {
            unusedCount = 0;
        }
        else if (transactions.length == 0 && !changeAddress) {
            unusedAddresses.push(payment.address);
            unusedCount++;
        }
        // get all unspent transactions associated with address and data needed to construct send transaction
        const utxos = (await axios.get(`${apiUrl}/address/${payment.address}/utxo`)).data;
        await utxos.forEach(async (utxo) => {
            const txHex = (await axios.get(`${apiUrl}/tx/${utxo.txid}/hex`)).data;
            unspentTransactions.push({
                child: child,
                hash: utxo.txid,
                index: utxo.vout,
                nonWitnessUtxo: Buffer.from(txHex, 'hex'),
                value: utxo.value,
            });
        });
        // let spentTxids = [];
        // for (const tx of transactions) {
        //     for (let index = 0; index < tx.vout.length; index++) { 
        //         if (tx.vout[index].scriptpubkey_address == payment.address) {
        //             const txHex = (await axios.get(`${apiUrl}/tx/${tx.txid}/hex`)).data;
        //             unspentTransactions.push({ // instead of address, derivationPath, there should be a child object assoc with each tx
        //                 child: child,
        //                 hash: tx.txid,
        //                 index: index,
        //                 nonWitnessUtxo: Buffer.from(txHex, 'hex'),
        //                 value: tx.vout[index].value,
        //             });
        //         }
        //     }
        //     for (let index = 0; index < tx.vin.length; index++) { 
        //         spentTxids.push(tx.vin[index].txid);
        //     }
        // }
        // spentTxids.forEach(spentTxid => { // pluck spent transactions from unspentTransactions array
        //     const spent = unspentTransactions.some(tx => tx.hash == spentTxid);
        //     if (spent) {
        //         const spentOutput = (tx) => tx.hash == spentTxid;
        //         const spentOutputIndex = unspentTransactions.findIndex(spentOutput);
        //         unspentTransactions.splice(spentOutputIndex, 1);
        //     }
        // });
        if (changeAddress) {
            index++;
        }
        changeAddress = !changeAddress;
    }
    // collect the balance for the entire hierarchy
    for (const utxo of unspentTransactions) {
        balance += utxo.value;
    }
    spinner.stop();
    return { utxos: unspentTransactions, unusedAddresses: unusedAddresses, balance: balance };
};
const createTransaction = async () => {
    const walletData = await getWalletData();
    const psbt = new bitcoin.Psbt({ network: TESTNET });
    // UTXO info for debugging
    console.log('');
    let utxoIndex = 1;
    walletData.utxos.forEach(utxo => {
        const payment = bitcoin.payments.p2pkh({
            pubkey: utxo.child.publicKey,
            network: TESTNET,
        });
        console.log(`(${payment.address}) UTXO ${utxoIndex}: ${utxo.value / SAT_BTC_MULT} BTC`);
        utxoIndex++;
    });
    console.log('');
    // interface information
    console.log(`Receive address: ${walletData.unusedAddresses[0]}`);
    console.log(`Wallet balance: ${walletData.balance / SAT_BTC_MULT} BTC\n`);
    // gather all necessary output info
    const outputAddress = prompt('Enter the address you would like to send tBTC to: ');
    const outputValue = Math.floor(Number((prompt('Enter the value of tBTC you would like to send: ')) * SAT_BTC_MULT));
    const transactionFee = 1000; // is incremented based on number of inputs (P2PKH input is 148 bytes, P2PKH output is 34 bytes)
    // include all necessary inputs and outputs for transaction
    let utxoValueSum = 0, signers = [];
    walletData.utxos.forEach(utxo => {
        if (utxoValueSum >= outputValue + transactionFee) {
            return;
        }
        utxoValueSum += utxo.value;
        psbt.addInput({
            hash: utxo.hash,
            index: utxo.index,
            nonWitnessUtxo: utxo.nonWitnessUtxo,
        });
        signers.push(utxo.child); // track which addresses' utxos are being used
    });
    psbt.addOutput({
        address: outputAddress,
        value: outputValue,
    });
    psbt.addOutput({
        address: walletData.unusedAddresses[0],
        value: utxoValueSum - outputValue - transactionFee,
    }); // change
    // sign transaction
    signers = [...new Set(signers)];
    signers.forEach(signer => {
        try {
            psbt.signAllInputs(ECPair.fromPrivateKey(signer.privateKey));
        }
        catch (err) {
            console.log(err);
        }
    });
    psbt.validateSignaturesOfAllInputs(validator);
    psbt.finalizeAllInputs();
    const rawTransaction = psbt.extractTransaction().toHex();
    console.log('\n' + rawTransaction + '\n');
    const broadcast = prompt('Would you like to broadcast this transactions? (y/n) ');
    if (broadcast !== 'y') {
        return;
    }
    const newTxId = (await axios.post('https://blockstream.info/testnet/api/tx', rawTransaction)).data;
    console.log(`New transaction: https://blockstream.info/testnet/tx/${newTxId}`);
};
await createTransaction();
