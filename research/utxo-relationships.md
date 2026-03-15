# Liqwid UTxO Relationships (ADA Market Mainnet)

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         REFERENCE INPUTS                              │
│  (Never spent, used to read state)                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────┐     ┌─────────────────────┐                 │
│  │   MarketState       │     │   MarketParams      │                 │
│  │   (Read-only)       │     │   (Read-only)       │                 │
│  │                     │     │                     │                 │
│  │ • supply            │     │ • Interest model    │                 │
│  │ • reserve           │     │ • Thresholds        │                 │
│  │ • qTokens           │     │ • Script refs       │                 │
│  │ • principal         │     │                     │                 │
│  │ • interest          │     │                     │                 │
│  │ • qTokenRate        │     │                     │                 │
│  │ • minAda            │     │                     │                 │
│  └──────────┬──────────┘     └──────────┬──────────┘                 │
│             │                           │                             │
│             └───────────┬───────────────┘                             │
│                         │                                             │
│                         ▼                                             │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                         SPENT/UPDATED UTxOs                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      Action UTxO (x4)                            │ │
│  │                                                                  │ │
│  │  • Holds ActionToken (identifies it)                            │ │
│  │  • Holds underlying asset (ADA) as liquidity                    │ │
│  │  • Datum tracks pending operations (supplyDiff, qTokensDiff)    │ │
│  │  • SPENT on supply/redeem, RECREATED with updated datum         │ │
│  │                                                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Script Hashes (ADA Market Mainnet)

| Component | Type | Script Hash |
|-----------|------|-------------|
| QToken | MintingPolicy | `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68` |
| Action | Validator | `31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce` |
| ActionToken | MintingPolicy | `7807209cec9f79c9f6cf5bea2ab7826e6e46b6a7583a337b7e20fb36` |
| MarketState | Validator | `8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726` |
| MarketStateToken | MintingPolicy | `5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c` |
| MarketParams | Validator | (uses MarketParamsToken holder) |
| MarketParamsToken | MintingPolicy | `24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b` |
| Batch | Validator | `a3e56ea9d2db008038ce6fb32e500faef1523dcb042e5a637d633fc8` |
| Loan | Validator | `71391f18fb131f28a230fa7f3b6c6099e447602b2bd2df5d046c5e99` |

---

## Live UTxO Addresses

### MarketState UTxO
```
Address: addr1wxxjtzuaprw2kulnzedpzagage95vptzvsy3c9ufmfvgwfsj8cv4s
Token: 5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c (qty: 1)
```

### MarketParams UTxO
```
Address: addr1wx6htk5hfmr4dw32lhxdcp7t6xpe4jhs5fxylq90mqwnldsvr87c6
Token: 24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b (qty: 1)
```

### Action UTxOs (4 total, 2 addresses)
```
Address 1: addr1zyc5zkajzqtyea4cf5d3y5mlq7fd9yfdz4hq78k3mywg8nha57wx42dufy48hug9tjkem42urlcd7v8qaafq94pfufxsz63f4p
  ActionTokens: 2

Address 2: addr1zyc5zkajzqtyea4cf5d3y5mlq7fd9yfdz4hq78k3mywg8nhkrew0j6j9qjdde8a5py4m9yyh2mylaal4q899rgptn88qe57mt7
  ActionTokens: 2
```

Note: Action addresses are the Action validator + staking credential.

---

## Transaction Flow: Supply (Deposit)

### Reference Inputs (read-only)
1. **MarketState UTxO** - to read `qTokenRate` for conversion
2. **MarketParams UTxO** - to validate against protocol rules
3. **Action Script Reference** - the Plutus script itself

### Spent Inputs
1. **Action UTxO** - one of the 4 action UTxOs (has ActionToken)
2. **User's Wallet UTxO** - ADA being supplied

### Outputs
1. **New Action UTxO** - same address, updated datum + increased ADA
2. **User's Wallet** - receives minted qTokens

### Minting
- **QToken**: Mint `supplyAmount / qTokenRate` qTokens (redeemer: `0`)

### Datum Changes
```
Input ActionDatum:
  supplyDiff: 0
  qTokensDiff: 0
  reservedSupply: 493,913,232 lovelace

Output ActionDatum:
  supplyDiff: +40,875,220,504 lovelace (~40,875 ADA)
  qTokensDiff: +1,935,750,709,614
  reservedSupply: 493,913,232 lovelace (unchanged)
```

---

## Transaction Flow: Redeem (Withdraw)

### Reference Inputs
1. **MarketState UTxO** - to read `qTokenRate`
2. **MarketParams UTxO** - to validate
3. **Action Script Reference**

### Spent Inputs
1. **Action UTxO**
2. **User's Wallet UTxO** - qTokens being redeemed

### Outputs
1. **New Action UTxO** - decreased ADA
2. **User's Wallet** - receives underlying ADA

### Burning
- **QToken**: Burn qTokens (redeemer: `1`)

### Datum Changes
```
supplyDiff: -X (negative = withdrawal)
qTokensDiff: -Y (negative = burn)
```

---

## NFT/Token Identification

Each UTxO type is identified by a unique NFT:

| UTxO Type | Identifying Token |
|-----------|------------------|
| MarketState | MarketStateToken (qty: 1) |
| MarketParams | MarketParamsToken (qty: 1) |
| Action | ActionToken (qty: 1 per UTxO) |
| Loan | (identified by datum structure) |

---

## Staking Credentials

Action UTxOs use staking credentials to:
1. Distinguish between action "slots"
2. Allow multiple concurrent operations
3. Enable stake rewards collection

The staking credential is part of the address, after the payment credential.

---

## Batch Processing

The `supplyDiff`, `qTokensDiff`, etc. accumulate in ActionDatums until a **Batch** transaction:
1. Batch TX reads all Action UTxOs
2. Aggregates all diffs
3. Updates MarketState with new totals
4. Resets Action datums to zero

This allows many supply/redeem operations between batches without updating MarketState each time.
