# Making Use of the Wallet Hierarchy

In the [previous exercise](./exercise02.md), you created an HD wallet by generating a master key from the mnemonic seed phrase, then deriving a public/private key pair using a BIP44 path. With this child node of the HD wallet, you were able to send bitcoin by collecting UTXOs that were sent to the corresponding address and putting them as inputs in the new transaction. You specified the desired outputs, then finally signed and broadcasted the transaction across the bitcoin testnet.

While you certainly created an HD wallet, you only ever used *one* key pair to manage your funds. The purpose of this exercise will be for you to generate and receive funds at multiple bitcoin addresses (all within the same hierarchy), then sign multiple UTXOs with their appropriate private keys. Again, you will broadcast the finalized transaction over the bitcoin testnet.

> *Task:* Review your wallet implementation from the [previous exercise](./exercise02.md), as it will serve as a starting point/reference. It will be important to firmly understand the process of generating an address, supplying the inputs/specifying the outputs to build a transaction, signing a transaction, and broadcasting the transaction on the blockchain.  

## Address Reuse

Due to the public nature of the bitcoin blockchain, it is trivial for a nosey onlooker to aggregate transactions from an address and learn the details of a its financial history. This privacy issue is avoided by using a new address for every transaction. While this may sound like a cumbersome solution, HD wallets make the process painless.

### Unused Address Set

Recall that an HD wallet can derive virtually unlimited key pairs/addresses from a single master key. Also, recall that the address hierarchy structure defined by BIP43 and BIP44 is the following:

`m / purpose' / coin_type' / account' / change / address_index`

By changing any of the fields in the derivation path, a new key pair/address will be generated. The first step of an HD wallet committed to avoiding address reuse is to discover which derived addresses are available. The process for doing so for a given account is as follows:

1. derive an address using the path (starting at address_index = 0)
2. scan the blockchain for transactions associated with this address; respect the *address gap limit* described below as the stopping condition 
    * if no transactions are found, the address is considered unused
3. increment address_index and repeat

> *Task*: Use the [Blockstream API](https://github.com/Blockstream/esplora/blob/master/API.md) to find the first unused addresses associated with account 0 of your HD bitcoin wallet.

<a name="address_gap_limit"></a>

#### Address Gap Limit

The address gap limit should be set to 20 (this is most common, but somewhat arbitrary). If you scan 20 unused addresses in a row, you can expect there are no used addresses beyond this point and stops searching the address chain. In determining unused addresses, do not consider the change addresses.

## UTXOs Across Multiple Addresses

Up to this point, you have collected the UTXOs from one address in order to make a transaction. However, UTXOs may now be spread across the children of your wallet hierarchy because you are using a new address each time you receive BTC. Therefore, in order to know the balance of your wallet, you need to calculate the aggregate value of UTXOs belonging to every derived address of the wallet. Furthermore, if the UTXOs of one address cannot cover the value of a transaction you are trying to create, you may need to pick on UTXOs belonging to another child of the wallet hierarchy.