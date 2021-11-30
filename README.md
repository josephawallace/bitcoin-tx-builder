# BIP32/39 and UTXO Practice

Use `bitcoinjs-lib` to create a HD bitcoin wallet using a mnemonic/seed. 

## BIP32/39

`const mnemonic  = bip39.generateMnemonic();`
1. Creates a random 128-256 bit number.
2. Creates a checksum by taking the first (entropy-length/32) bits of the SHA-256 hash of the entropy.
3. Add the checksum to the end of the entropy.
4. Splits the result into 11-bit segments.
5. Maps each 11-bit segments to a word according to a predefined dictionary.
6. The mnemonic code is the sequence of words, in order.

`const seed = bip39.mnemonicToSeedSync(mnemonic);`
1. Passes the mnemonic and a user provided 'salt' (if not provided, defaults to 'mnemonic') into the PBKDF-2 key stretching function.
2. The PBKDF-2 functions stretches the combination of the entropy and the salt to 512 bits through 2048 rounds of HMAC-SHA512 hashing. The resulting 512 bits is the seed.

`const root = bip32.fromSeed(seed);`
1. The seed is passed into the HMAC-SHA512 hashing function. 
2. The resulting 512 bits are then split evenly in the middle—the left half is the master private key and the right half is what is known as the "chain code". In this case, `root` is the master extended private key.
3. The public key is then derived using elliptic curve multiplication.

## BIP43/44
These improvement proposals introduced the concepts of multipurpose and multiaccount wallet structure, respectively. The wallet paths are specified as follows: 

`m / purpose' / coin_type' / account' / change / address_index`

This makes sense of the wallet path specified in my code.

`const path = 'm/44\'/1\'/0\'/0/0';`

## Transaction

`const payment = bitcoin.payments.p2pkh(...)`

This defines the locking script used to verify ownership of funds. Therefore, any Bitcoin sent to this address can only be unlocked when presented the hash of the public key and the signature generated from the private key and transaction data.

### Collecting all transaction outputs associated with the address

The first step to create the transaction is to collect all previous transactions in which the address *received* tBTC. This is done by checking the addresses of all outputs to our address.

The next step is to remove outputs that have already been spent, as they cannot be double-spent. We keep track of the transaction ids that have already been used as inputs in previous transactions, by pushing them to the `spentTxids` array. Then we pluck those transactions from our inputs array. We are left with the UTXOs.

### Forming the transaction

The necessary amount of UTXOs are passed now as inputs of our transaction. The new output will be sent to the the address specified and can be unlocked as defined by the P2PKH script. The second output is sent back to our address as change.

We then sign the inputs, proving ownership of the funds. Here, we are presenting the hash of the public key and the signature generated from the private key and transaction data. The validator confirms that we are entitled to send the funds.

The raw transaction that is created is a serialized version of all the data needed to be broadcasted to the network. Finally, we use the Blockstream API to broadcast to testnet.


