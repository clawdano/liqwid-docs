# qToken Conversion Logic

> Extracted from Liqwid liquidation bot source code

## Core Functions

### 1. qTokenRate Calculation

The exchange rate is calculated from MarketState:

```haskell
qTokenRate :: IncomeRatio -> Supply -> Principal -> Interest -> QTokens -> Maybe (Ratio BigInt)
qTokenRate inc supply principal interest qTokens
  | qTokens == 0 = Nothing
  | otherwise = Just $ reduce
      (supply + principal + splitIncomeSuppliers(inc, interest))
      qTokens
```

**In pseudocode:**
```
qTokenRate = (supply + principal + supplierInterest) / totalQTokens

Where:
- supply = total underlying deposited
- principal = total borrowed (still in pool for interest calc)
- supplierInterest = interest × incomeRatio (portion going to suppliers)
- totalQTokens = total qTokens minted
```

### 2. getQTokenValue (qTokens → Underlying)

Convert qToken balance to underlying value:

```haskell
getQTokenValue :: QTokens -> Contract Underlying
getQTokenValue qTokens = do
  marketState <- queryMarketState
  let qTokenRate = marketState.datum.qTokenRate
  pure $ mulTruncate(qTokenRate, qTokens)
```

**Formula:**
```
underlyingValue = truncate(qTokens × qTokenRate)
```

### 3. marketRedeemActualValues

Calculate actual amounts for redemption:

#### RedeemQTokens (user specifies qTokens to burn)

```haskell
-- Input: wishBurn (qTokens user wants to burn)
actualReceive = truncate(wishBurn × qTokenRate)

actualBurn = 
  if roundQTokens 
  then ceil(actualReceive / qTokenRate)  -- Recalculate for rounding
  else wishBurn                           -- Use exact input
```

#### RedeemUnderlying (user specifies underlying to receive)

```haskell
-- Input: wishReceive (underlying user wants)
actualBurn = ceil(wishReceive / qTokenRate)
actualReceive = truncate(actualBurn × qTokenRate)
```

**Note:** `ceil` when burning protects the protocol; `truncate` when receiving protects the protocol.

## Rounding Rules

| Operation | Direction | Reason |
|-----------|-----------|--------|
| `underlying = qTokens × rate` | truncate (floor) | User receives less, protocol protected |
| `qTokens = underlying / rate` | ceil (round up) | User burns more, protocol protected |

This ensures the protocol is always solvent — rounding errors favor the pool.

## Example Calculation

Using live mainnet data:

```
qTokenRate = 0.0211159449

User wants to redeem 1,000,000 qADA:
  actualReceive = truncate(1,000,000 × 0.0211159449)
                = truncate(21,115.9449)
                = 21,115 ADA (in lovelace: 21,115,944,900)

User wants to receive 21,115 ADA:
  actualBurn = ceil(21,115 / 0.0211159449)
             = ceil(999,997.6)
             = 999,998 qADA
  actualReceive = truncate(999,998 × 0.0211159449)
                = 21,115 ADA
```

## Code Reference

From `Liqwid.Utils.QTokenRate`:
```javascript
var getQTokenValue = function (qTokens) {
    return Control_Bind.bind(Liqwid_Contract.bindLiqwidContract)(
        Liqwid_Market_Query_Utxos.unchainedQuery(
            Control_Parallel_Class.sequential(
                Liqwid_Contract.parallelParLiqwidContract)(
                Liqwid_Market_Query_Utxos.queryMarketState
            )
        )
    )(function (marketState) {
        var qTokenRate = Data_Newtype.unwrap()(
            marketState.datum.qTokenRate
        );
        return Control_Applicative.pure(Liqwid_Contract.applicativeLiqwidContract)(
            Data_Newtype.wrap()(
                Liqwid_Utils_Ratio.mulTruncate(
                    Data_BigInt.ordBigInt)(
                    Data_BigInt.euclideanRingBigInt)(
                    qTokenRate)(
                    Data_Newtype.unwrap()(qTokens)
                )
            )
        );
    });
};
```

## Utility Functions

### truncate
Rounds a ratio down to the nearest integer.

### ceil  
Rounds a ratio up to the nearest integer.

### mulTruncate
Multiplies a ratio by an integer and truncates: `truncate(ratio × integer)`

### reduce
Creates a reduced ratio from numerator and denominator.
