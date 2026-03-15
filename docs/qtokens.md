# Understanding qTokens

## What are qTokens?

qTokens are **receipt tokens** that represent your deposited assets + accrued interest in Liqwid.

| Underlying | qToken | Policy ID (Mainnet) |
|------------|--------|---------------------|
| ADA | qADA | `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68` |
| DJED | qDJED | See registry |
| USDC | qUSDC | See registry |
| USDT | qUSDT | See registry |
| LQ | qLQ | See registry |

## The qToken Rate

The **qTokenRate** (exchange rate) determines how much underlying each qToken is worth:

```
1 qToken = qTokenRate × underlying
```

### Rate Only Increases

The qTokenRate **never decreases**. It starts at ~1.0 and grows as:
1. Borrowers pay interest
2. Protocol fees are deducted
3. Remaining interest accrues to suppliers

### Example: ADA Market

```
Initial state:
  Supply: 1,000,000 ADA
  qTokens: 1,000,000 qADA
  qTokenRate: 1.0

After 1 year (5% APY):
  Supply: 1,050,000 ADA (interest accrued)
  qTokens: 1,000,000 qADA (unchanged)
  qTokenRate: 1.05
```

If you hold 100 qADA:
- Initially worth: 100 ADA
- After 1 year: 105 ADA

**You earn interest by simply holding qTokens.**

## qToken Rate Formula

```
qTokenRate = (totalSupply + accruedInterest - reserve) / totalQTokens
```

Where:
- `totalSupply` = All underlying deposited
- `accruedInterest` = Interest paid by borrowers
- `reserve` = Protocol treasury allocation
- `totalQTokens` = All minted qTokens

## Where is qTokenRate Stored?

The qTokenRate is stored in the **MarketState** datum on-chain:

```haskell
MarketState {
  qTokenRate    :: Ratio BigInt   -- Exchange rate
  qTokens       :: BigInt         -- Total qTokens
  supply        :: BigInt         -- Total underlying
  principal     :: BigInt         -- Total borrowed
  interest      :: BigInt         -- Accrued interest
  reserve       :: BigInt         -- Protocol reserves
  interestRate  :: Ratio BigInt   -- Current borrow rate
  interestIndex :: FixedDecimal   -- Compound index
  lastBatch     :: POSIXTime      -- Last update time
  minAda        :: BigInt         -- Minimum ADA requirement
}
```

## Minting & Burning qTokens

### Minting (Supply)
When you deposit underlying:
```
qTokensMinted = depositAmount / qTokenRate
```

### Burning (Withdraw)
When you redeem qTokens:
```
underlyingReceived = qTokensBurned × qTokenRate
```

## qToken Policy

Each market has its own qToken minting policy. The policy validates:
1. Mint amount matches deposit/withdraw calculation
2. Transaction includes valid Action UTxO
3. MarketState is correctly updated

## Finding Your qToken Balance

qTokens are native Cardano tokens. Query your wallet for tokens with:
- Policy ID from registry
- Empty token name (for most markets)

### Using Blockfrost

```bash
curl -H "project_id: YOUR_KEY" \
  "https://cardano-mainnet.blockfrost.io/api/v0/addresses/YOUR_ADDR/utxos"
```

Look for UTxOs containing:
```json
{
  "unit": "a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68",
  "quantity": "95238095"  // Your qADA (in lovelace-like units)
}
```

## Converting qToken Amount to Underlying

```python
# Fetch current qTokenRate from MarketState
q_token_rate = 1.05  # Example

# Your qToken balance (raw)
q_tokens = 95238095  # ~95.24 qADA

# Underlying value
underlying_value = q_tokens * q_token_rate / 1_000_000
# = 100 ADA (approximately)
```

## Important Considerations

1. **Precision**: qTokenRate uses rational numbers (Ratio BigInt) for exact arithmetic
2. **Rounding**: Protocol rounds down when minting, up when burning (protects liquidity)
3. **No Rebasing**: Unlike some protocols, qToken supply doesn't change — only rate
4. **Composable**: qTokens are standard Cardano native tokens — can be traded, used as collateral elsewhere
