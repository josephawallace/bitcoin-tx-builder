# Setting Up Testnet Bitcoin Wallet With BitPay

## Create a bitcoin wallet

1. Download [BitPay](https://bitpay.com/wallet) and open it on your mobile device.
2. Swipe through the introduction screens and select `Start` on the last slide.
3. Deselect all currencies except for Bitcoin, then hit `Continue`. 
> You will be prompted to encrypt the wallet with a passphrase. This wallet is intended only to be used for testing purposes, so the option you choose will not matter.
4. On the next screen, select `View my recovery key`. Follow the instructions and write down each word of the recovery phrase, then verify you have recorded the words in the correct order. 
> This phrase is known as a *mnemonic*; it serves as the key to unlock all of the funds associated with your wallet. Anyone who knows the recovery key can spend the funds of your wallet. If you lose your recovery key, the funds are gone forever.
5. Acknowledge that you are in custody of your funds on the next screen, then skip connecting any accounts to finally make it to the home screen.

## Switch to testnet

Congratulations, you now have successfully created a BIP39 crypto wallet (don't worry if you don't know what BIP39 means yet, it will be important to understand later). The single mnemonic phrase you wrote down is what generated your wallet, which lets you receive and send a wide variety of different cryptocurrencies&mdash;although only bitcoin is setup at this point.

If this wallet was going to be used to manage real funds, your work would be done; however, this wallet is going to be used for testing purposes only. For situations like this, there exists what is known as the *bitcoin testnet*. The bitcoin testnet is meant to mirror the functionality of the main bitcoin network&mdash;the primary difference being only fictitious funds with no value flow through the bitcoin testnet (you probably don't want to run experiments with an asset worth thousands of dollars). With that in mind, the next steps will guide you to replace bitcoin with testnet bitcoin within BitPay.

1. Navigate to the *Wallets* screen within BitPay. You can do this by selecting the wallet icon on the bottom toolbar.
2. Click the three dots on the top right, then select `Create a new wallet`.
3. You should now be on the *Add Wallet* screen. Select `Simple Wallet`, then `Bitcoin`. 
4. Select the `Show advanced options` button below the wallet name field. Make sure `Testnet` is on and finally click `Create`.

> *Remember:* the main bitcoin network is used to facilitate very real and valuable assets. For testing purposes, only interact with the testnet address that was just created. 