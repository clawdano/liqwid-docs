# Liqwid Transaction Examples

Real mainnet transaction analysis for supply/redeem operations.

---

## Supply Transaction #1

**TX Hash:** `08b82a63266ff8d4f592e4cd074243f7a117d12cc54f79b00524d943aad801a7`  
**Block:** 13,163,903  
**Time:** 2026-03-15 22:14:40 UTC  

[CardanoScan](https://cardanoscan.io/transaction/08b82a63266ff8d4f592e4cd074243f7a117d12cc54f79b00524d943aad801a7)

### Summary

| Metric | Value |
|--------|-------|
| ADA Deposited | 40,875.22 ADA |
| qTokens Minted | 1,935,750,709,614 |
| qToken Rate | 0.0211159527 |

### Input UTxOs

1. **MarketState UTxO** (reference input)
   - Token: `5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c`
   - Contains current qTokenRate

2. **MarketParams UTxO** (reference input)  
   - Token: `24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b`
   - Contains protocol parameters

3. **Action UTxO** (spent)
   - Token: `7807209cec9f79c9f6cf5bea2ab7826e6e46b6a7583a337b7e20fb36`
   - Redeemer: `d8799fff` (unit)

### ActionDatum Changes

**BEFORE (Input):**
```cbor
9f9f0000000000ff1a1d708490ff
```
```json
{
  "actionValue": [0, 0, 0, 0, 0],
  "reservedSupply": 494822544
}
```

**AFTER (Output):**
```cbor
9f9f1b00000009845a5e181b000001c2b3bbc16e000000ff1a1d708490ff
```
```json
{
  "actionValue": [
    40875220504,      // supplyDiff: +40,875.22 ADA
    1935750709614,    // qTokensDiff: +1.9T qTokens
    0,                // principalDiff
    0,                // interestDiff  
    0                 // extraInterestRepaid
  ],
  "reservedSupply": 494822544
}
```

### MarketState at TX Time

```json
{
  "supply": 8168098832915,           // 8.17M ADA in pool
  "reserve": 1976096323,             // ~1,976 ADA reserves
  "qTokens": 386838523265,           // 386B qTokens circulating
  "principal": 5821456553243,        // 5.82M ADA borrowed
  "interest": 4983527378,            // ~4,983 ADA accrued interest
  "qTokenRate": [33220771660819, 1573254688866635]
}
```

### Minting

```
Policy: a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68
Amount: +1,935,750,709,614 qTokens
Redeemer: d8799fff (unit)
```

### Formula Verification

```python
deposit = 40_875_220_504  # lovelace
rate_num = 33_220_771_660_819
rate_denom = 1_573_254_688_866_635

# qTokens = deposit * denom / num
qTokens = (deposit * rate_denom) // rate_num
# = 1,935,750,709,614 ✓
```

---

## Supply Transaction #2

**TX Hash:** `316b30a58235f3b7615b5a3b9788f7bf674102a8a00750adec0778a1076b551d`  
**Block:** 13,163,902  

(This is the TX immediately before #1 - can be analyzed similarly)

---

## Batch Transaction (for reference)

**TX Hash:** `d2cf4117bde3c5877196ca8eec0bd134832b28d584ca7e7c173d7055d1cbf9f2`  
**Block:** 13,163,925  

Batch transactions:
- Process all pending Action UTxO changes
- Update MarketState with new totals
- Reset ActionDatum diffs to zero
- Run periodically by Liqwid backend

---

## How to Find More Examples

```bash
# Query recent transactions involving Action token
curl -s -H "project_id: $BLOCKFROST_KEY" \
  "https://cardano-mainnet.blockfrost.io/api/v0/assets/7807209cec9f79c9f6cf5bea2ab7826e6e46b6a7583a337b7e20fb36/transactions?order=desc&count=10"

# Get TX UTxO details
curl -s -H "project_id: $BLOCKFROST_KEY" \
  "https://cardano-mainnet.blockfrost.io/api/v0/txs/$TX_HASH/utxos"
```

---

## CBOR Decoding Reference

### ActionDatum Structure

```
9f                    -- Start indefinite array
  9f                  -- Start ActionValue array
    1b{8 bytes}       -- supplyDiff (bigint)
    1b{8 bytes}       -- qTokensDiff (bigint)
    00                -- principalDiff (0 for supply/redeem)
    00                -- interestDiff (0 for supply/redeem)
    00                -- extraInterestRepaid (0 for supply/redeem)
  ff                  -- End ActionValue
  1a{4 bytes}         -- reservedSupply (uint32)
ff                    -- End ActionDatum
```

### Common CBOR Prefixes

| Prefix | Type | Example |
|--------|------|---------|
| `00-17` | Small positive int | `0a` = 10 |
| `18xx` | Uint8 | `1864` = 100 |
| `19xxxx` | Uint16 | `190190` = 400 |
| `1axxxxxxxx` | Uint32 | `1a1d708490` = 494822544 |
| `1bxxxxxxxxxxxxxxxx` | Uint64/BigInt | `1b00000009845a5e18` = 40875220504 |
| `9f...ff` | Indefinite array | |
| `d87980` | Constr 0 [] | Empty constructor |
| `d8799f...ff` | Constr 0 [...] | Constructor with fields |
