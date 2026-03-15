# Supplying Assets to Liqwid

> Deposit assets → Receive qTokens → Earn interest

## Overview

When you supply assets to Liqwid:

1. Your assets (ADA, DJED, etc.) are sent to an **Action UTxO**
2. The protocol mints **qTokens** (qADA, qDJED, etc.)
3. qTokens are sent to your wallet
4. Your qTokens accrue interest via an increasing exchange rate

## Prerequisites

- Cardano wallet with assets to supply
- Minimum ~5 ADA for transaction fees and collateral
- Understanding of the [qToken mechanism](./overview.md#qtokens--receipt-tokens)

## Calculating qTokens to Receive

```
qTokens = depositAmount / qTokenRate
```

**Example:**
- Depositing: 100 ADA
- Current qTokenRate: 1.05
- qTokens received: 100 / 1.05 = 95.24 qADA

## Transaction Structure

### Inputs
1. **User UTxO** — Contains ADA/tokens to deposit
2. **Action UTxO** — Script UTxO from Action validator
3. **MarketState UTxO** — Reference input for current qTokenRate (read-only)

### Outputs
1. **Updated Action UTxO** — With deposited assets added
2. **User UTxO** — With minted qTokens

### Minting
- **qToken Policy** mints the calculated qToken amount

### Datum Structure (Action)

```haskell
ActionDatum {
  -- Action-specific data
  -- Tracks pending deposits/withdrawals
}
```

### Redeemer

```haskell
SupplyRedeemer {
  amount :: Integer  -- Amount of underlying to supply
}
```

## Finding the qTokenRate

The qTokenRate is stored in the **MarketState** datum:

```haskell
MarketState {
  qTokenRate    :: Ratio Integer  -- e.g., 105/100 = 1.05
  qTokens       :: Integer        -- Total qTokens in circulation
  supply        :: Integer        -- Total underlying supplied
  -- ... other fields
}
```

### Query MarketState (Using Blockfrost)

```python
# Find MarketState UTxO
market_state_token = "5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c"
# Query UTxOs containing this token to find current state
```

## ADA Market Contract Addresses

| Component | Script Hash | Purpose |
|-----------|-------------|---------|
| QToken | `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68` | Minting policy |
| Action | `31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce` | Deposit endpoint |
| MarketState | `8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726` | State validator |

## Important Notes

1. **Batch Processing**: Your supply isn't instant — it's collected into a batch
2. **Minimum Amounts**: Check market params for minimum supply amounts
3. **Reference Scripts**: Use reference UTxOs to reduce TX size

## Code Example

See [examples/python/supply.py](../examples/python/supply.py) (TODO)

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| TX fails | Insufficient collateral | Add 5+ ADA as collateral |
| Wrong qToken amount | Stale qTokenRate | Re-query MarketState |
| Action UTxO busy | Already being spent | Try different Action UTxO |
