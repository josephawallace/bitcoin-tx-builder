# BIP32/39 Practice

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
2. The resulting 512 bits are then split evenly in the middle—the left half is the master private key and the right half is what is known as the "chain code". 
3. The public key is then derived using elliptic curve multiplication.

## BIP43/44
These improvement proposals introduced the concepts of multipurpose and multiaccount wallet structure, respectively. The wallet paths are specified as follows: 

`m / purpose' / coin_type' / account' / change / address_index`

This makes sense of the wallet path specified in my code.

`const path = 'm/44\'/1\'/0\'/0/0';`
