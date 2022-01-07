# Introduction

Before beginning to understand concepts fundamental to crypto custody, it is important to know a little bit about the motivation behind blockchain, its history, and its implications.

> *Task:* Watch this [TEDx Talk](https://youtu.be/kvyKyRZJYh0) given by Ali Raza Dar and read this [excerpt](./../extras/A%20Brief%20History%20of%20Blockchain.md) from an article written by Lewis Popovski and George Soussou.

## Wallet Basics

Fundamental to crypto custody is the abstraction known as a crypto *wallet*. In the physical world, we understand the word "wallet" as the item that holds our cash and cards. The contents of our wallet determine our buying power when looking to make a purchase. In other words, a wallet holds money that can be spent at the holder's discretion.

Similarly, the contents of a crypto wallet determine how much of a given currency the holder is entitled to spend. The difference is, crypto wallets do not actually hold any money (or cryptocurrency). Instead, crypto wallets are responsible for managing a set of keys that are used to prove that the holder is entitled to spend $x$ amount of money. In this way, a crypto wallet is conceptually very similar to a physical wallet that can hold only debit cards.

Consider you wanted to make a purchase with a debit card. You would open your wallet, swipe your card, and your bank would verify that you actually have enough money to make the payment. On the other hand, if you wanted to make a purchase in bitcoin, you would present a key that is stored in your crypto wallet and that key would be used to verify that you can actually afford whatever it is you are trying to buy.

This may be confusing right now, but the important thing to remember at this stage is that crypto wallets do not actually hold cryptocurrency; they hold keys that let you spend cryptocurrency.

> *Task:* Read [Chapter 1](https://github.com/bitcoinbook/bitcoinbook/blob/develop/ch01.asciidoc) from *Mastering Bitcoin*. Then, set up a testnet bitcoin wallet on your phone by following these [steps](../extras/Setting%20Up%20Testnet%20Bitcoin%20Wallet%20With%20BitPay.md).

### Receiving crypto

At this stage, you should have a crypto wallet that is ready to manage tBTC (testnet bitcoin). Since tBTC holds no monetary value, community members have created *faucets* which will send tBTC to the testnet bitcoin address you provide. To fund the wallet you created, follow these steps:

1. Find a tBTC faucet online (e.g. https://testnet-faucet.mempool.co/).
2. From the *Wallets* tab of BitPay, select the testnet bitcoin wallet (the one with the grey icon), then click `Receive`.
3. Use the faucet to send some tBTC to this address. You should see the funds appear as *confirmed* within 10 minutes.

> *Task:* Follow the steps above to fund your testnet bitcoin wallet.

### Sending crypto

Once the tBTC appears as *confirmed* in wallet, you can send it to any testnet bitcoin address (e.g. tb1ql7w62elx9ucw4pj5lgw4l028hmuw80sndtntxt).

1. Within your testnet bitcoin wallet, select `Send`.
2. Enter the address you would like to send testnet bitcoin to. Feel free to use the example address above.
3. Enter the amount of tBTC you would like to send and press `Continue`.
4. Confirm the details on the next page and slide to send the funds.

> *Task:* Follow the steps above to send tBTC.

### Recovering wallet with mnemonic phrase

1. Delete BitPay from your device.
2. Reinstall and open BitPay. 
3. You will be shown the same intro slides from when you originally installed the app. At the end of the slides, instead of creating a new wallet, select `Import from backup`.
4. Once you are at the *Import Wallet* screen, type in the recovery phrase you wrote down and select `Import`. 

You will now have imported your crypto wallet from a mnemonic phrase. You should be able to see the tBTC still within your wallet.

> *Task:* Follow the steps above to use your mnemonic phrase to import your crypto wallet.

### Moving forward

Now that you have interacted with the bitcoin blockchain, it's time to start learning what has happened behind the scenes.

> *Task:* Read [Chapter 2](https://github.com/bitcoinbook/bitcoinbook/blob/develop/ch02.asciidoc) from *Mastering Bitcoin*.