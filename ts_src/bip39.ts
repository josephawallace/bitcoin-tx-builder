import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1'
import * as bip39 from 'bip39';

const TESTNET = bitcoin.networks.testnet;

const bip32 = BIP32Factory(ecc); // pass the eliptic curve into the HD wallet factory

const mnemonic  = bip39.generateMnemonic(); // process described in README
const seed = bip39.mnemonicToSeedSync(mnemonic); // process described in README
const root = bip32.fromSeed(seed); // master key and chaincode

const path = 'm/44\'/1\'/0\'/0/0';
const child = root.derivePath(path);

const { address } = bitcoin.payments.p2pkh({
    pubkey: child.publicKey,
    network: TESTNET,
});

console.log(address);