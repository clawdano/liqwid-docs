# Withdrawing from Liqwid

> Burn qTokens → Receive underlying assets + interest

## Overview

When you withdraw from Liqwid:

1. Your **qTokens** (qADA, qDJED, etc.) are burned
2. The protocol calculates your share: `underlying = qTokens × qTokenRate`
3. Your underlying assets (ADA, DJED, etc.) are sent to your wallet

**You always receive more than you deposited** (assuming positive interest).

## Prerequisites

- qTokens in your wallet (from previous supply)
- ~5 ADA for transaction fees and collateral
- Understanding of the [qToken mechanism](./overview.md#qtokens--receipt-tokens)

## Calculating Underlying to Receive

```
underlyingReceived = qTokens × qTokenRate
```

**Example:**
- Burning: 95.24 qADA
- Current qTokenRate: 1.08 (rate increased since deposit)
- ADA received: 95.24 × 1.08 = **102.86 ADA**

You deposited 100 ADA, you receive 102.86 ADA — that's your interest!

## Two Withdrawal Methods

### 1. RedeemQTokens
Specify how many **qTokens to burn**:

```haskell
RedeemQTokens {
  amount       :: Integer  -- qTokens to burn
  roundQTokens :: Bool     -- Round to exact qToken amount
}
```

Underlying received = `amount × qTokenRate`

### 2. RedeemUnderlying
Specify how much **underlying to receive**:

```haskell
RedeemUnderlying {
  amount :: Integer  -- Underlying amount desired
}
```

qTokens burned = `ceil(amount / qTokenRate)`

## Transaction Structure

### Inputs
1. **User UTxO** — Contains qTokens to burn
2. **Action UTxO** — Script UTxO from Action validator
3. **MarketState UTxO** — Reference input for current qTokenRate (read-only)

### Outputs
1. **Updated Action UTxO** — With reduced supply
2. **User UTxO** — With underlying assets (ADA, etc.)

### Minting (Burn)
- **qToken Policy** with **negative** amount (burns qTokens)

## Withdrawal Calculation (from bot code)

```javascript
// RedeemQTokens: User specifies qTokens to burn
actualReceive = truncate(qTokensBurned × qTokenRate)
actualBurn = ceil(actualReceive / qTokenRate)  // May differ due to rounding

// RedeemUnderlying: User specifies underlying to receive  
actualBurn = ceil(underlyingDesired / qTokenRate)
actualReceive = truncate(actualBurn × qTokenRate)
```

**Note**: Small rounding differences may occur to ensure protocol solvency.

## ADA Market Contract Addresses

| Component | Script Hash | Purpose |
|-----------|-------------|---------|
| QToken | `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68` | Burning policy |
| Action | `31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce` | Withdraw endpoint |
| MarketState | `8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726` | State validator |

## Important Notes

1. **Batch Processing**: Withdrawals are batched, not instant
2. **Liquidity Check**: Protocol must have sufficient liquidity
3. **Interest Timing**: qTokenRate is updated periodically; query fresh rate

## Code Example

See [examples/python/withdraw.py](../examples/python/withdraw.py) (TODO)

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Insufficient liquidity | Too much borrowed | Wait or withdraw less |
| Rounding error | qTokenRate precision | Use RedeemQTokens for exactness |
| TX too large | Many qToken UTxOs | Consolidate qTokens first |
