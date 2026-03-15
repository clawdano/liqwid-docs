# Liqwid MarketState Datum Structure

## MarketState (On-chain Datum)

The MarketState UTxO holds the current state of a lending market. It is used as a **reference input** (never spent) to provide read-only access to market data.

```haskell
data MarketState = MarketState
  { supply           :: Tagged BigInt      -- Total underlying supplied by lenders
  , reserve          :: Tagged BigInt      -- Protocol reserves (fees)
  , qTokens          :: Tagged BigInt      -- Total qTokens in circulation
  , principal        :: Tagged BigInt      -- Total borrowed principal
  , interest         :: Tagged BigInt      -- Total accrued interest
  , interestIndex    :: Tagged FixedDecimal -- Compound interest index (9 decimal places)
  , interestRate     :: Tagged (Ratio BigInt) -- Current interest rate
  , lastInterestTime :: Tagged BigInt      -- Last time interest was updated (POSIX ms)
  , lastBatch        :: POSIXTime          -- Last batch processing time
  , qTokenRate       :: Tagged (Ratio BigInt) -- Exchange rate: underlying per qToken
  , minAda           :: Tagged BigInt      -- Minimum ADA for UTxOs
  }
```

### CBOR Field Order

The datum is encoded as `Constr 0 [...]` with fields in this order:

1. `supply`
2. `reserve`
3. `qTokens`
4. `principal`
5. `interest`
6. `interestIndex`
7. `interestRate`
8. `lastInterestTime`
9. `lastBatch`
10. `qTokenRate`
11. `minAda`

---

## Key Fields Explained

### qTokenRate
The exchange rate between qTokens and underlying assets.

```
qTokenRate = (supply + principal + supplierInterest) / qTokens
```

Where `supplierInterest` is the portion of accrued interest that goes to suppliers (determined by `incomeRatio`).

**Example:** If qTokenRate = 1.05, then 1 qToken can be redeemed for 1.05 ADA.

### supply
Total underlying assets deposited by liquidity providers.

### principal  
Total underlying assets currently borrowed by borrowers.

### interest
Total accrued interest from loans, not yet distributed.

### interestIndex
Compound interest index used to calculate borrow balances. Stored with 9 decimal places for precision.

### reserve
Protocol fees accumulated. A portion of interest income goes to reserves.

### qTokens
Total qTokens minted. This represents all outstanding supplier positions.

---

## Utilization Rate

```
utilizationRate = principal / (supply + principal)
```

Higher utilization = higher interest rates (based on the interest model curve).

---

## Reading MarketState On-chain

MarketState is always used as a **reference input**:

```haskell
mustReferenceScriptUtxo(toDataMarketState)(marketStateUtxo)
```

This allows reading the state without modifying it.

---

## Finding MarketState UTxO

Use the MarketState token from the registry:

```json
{
  "marketStateToken": {
    "currencySymbol": "8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726",
    "tokenName": "5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c"
  }
}
```

Query the MarketState validator address for a UTxO containing this token.

---

## Example: Calculating qTokens to Mint

```python
def calculate_qTokens_to_mint(supply_amount: int, market_state: dict) -> int:
    """
    Calculate how many qTokens to mint when supplying underlying.
    
    Args:
        supply_amount: Amount of underlying to supply (in lovelace for ADA)
        market_state: Decoded MarketState datum
    
    Returns:
        Number of qTokens to mint
    """
    q_token_rate = market_state['qTokenRate']  # Ratio: numerator/denominator
    
    # qTokens = supplyAmount / qTokenRate
    # = supplyAmount * denominator / numerator
    return (supply_amount * q_token_rate['denominator']) // q_token_rate['numerator']
```

## Example: Calculating Underlying to Receive

```python
def calculate_underlying_to_receive(qtokens: int, market_state: dict) -> int:
    """
    Calculate underlying received when redeeming qTokens.
    
    Args:
        qtokens: Number of qTokens to redeem
        market_state: Decoded MarketState datum
    
    Returns:
        Amount of underlying to receive
    """
    q_token_rate = market_state['qTokenRate']
    
    # underlying = qTokens * qTokenRate
    # = qTokens * numerator / denominator
    return (qtokens * q_token_rate['numerator']) // q_token_rate['denominator']
```

---

## Relationship to Other Components

```
┌─────────────────┐
│  MarketParams   │  ← Configuration (interest model, thresholds, etc.)
└────────┬────────┘
         │ reference
         ▼
┌─────────────────┐
│  MarketState    │  ← Current state (supply, borrows, rates)
└────────┬────────┘
         │ reference
         ▼
┌─────────────────┐
│  Action UTxOs   │  ← Pending operations (spend + update)
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Batch (Epoch)  │  ← Periodic state update
└─────────────────┘
```
