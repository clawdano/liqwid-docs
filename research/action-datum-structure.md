# Liqwid Action Datum & Redeemer Structure

## ActionDatum (On-chain Datum)

The Action UTxO holds pending supply/redeem operations.

```haskell
-- PureScript/Haskell representation
data ActionDatum = ActionDatum
  { actionValue    :: ActionValue
  , reservedSupply :: Tagged BigInt
  }

data ActionValue = ActionValue
  { supplyDiff         :: Tagged BigInt  -- Change in supply (+ for deposit, - for withdraw)
  , qTokensDiff        :: Tagged BigInt  -- Change in qTokens (+ for mint, - for burn)
  , principalDiff      :: Tagged BigInt  -- Change in principal (for borrows)
  , interestDiff       :: Tagged BigInt  -- Change in interest
  , extraInterestRepaid :: Tagged BigInt -- Extra interest paid
  }
```

### CBOR Encoding

```
ActionDatum → Constr 0 [actionValue, reservedSupply]
ActionValue → Constr 0 [supplyDiff, qTokensDiff, principalDiff, interestDiff, extraInterestRepaid]
```

**Example (empty action):**
```cbor
d8799f         -- Constr 0 [
  d8799f       --   Constr 0 [  (ActionValue)
    00         --     supplyDiff: 0
    00         --     qTokensDiff: 0
    00         --     principalDiff: 0
    00         --     interestDiff: 0
    00         --     extraInterestRepaid: 0
  ff           --   ]
  00           --   reservedSupply: 0
ff             -- ]
```

---

## QToken Minting Policy Redeemer

The qToken minting policy uses a simple integer redeemer:

| Value | Action | Description |
|-------|--------|-------------|
| `0`   | Mint   | Supply underlying → receive qTokens |
| `1`   | Burn   | Redeem qTokens → receive underlying |

**CBOR:**
- Mint: `00` (integer 0)
- Burn: `01` (integer 1)

---

## Action Validator Redeemer

The Action validator uses `unitRedeemer` for spending:

```
Constr 0 [] → d8799fff
```

This is the standard PlutusTx unit type.

---

## Transaction Flows

### Supply (Deposit) Flow

User deposits X underlying, receives qTokens.

**Inputs:**
1. Action UTxO (spend with unitRedeemer)
2. User UTxO with underlying asset

**Outputs:**
1. New Action UTxO with updated datum:
   - `supplyDiff` += X
   - `qTokensDiff` += (X / qTokenRate)
   - `reservedSupply` updated accordingly
2. User receives minted qTokens

**Mints:**
- qTokens: `floor(X / qTokenRate)` with redeemer `0`

**Reference Inputs:**
- MarketState UTxO (for qTokenRate calculation)
- MarketParams UTxO (for validation rules)

### Redeem (Withdraw) Flow

User burns qTokens, receives underlying.

**Inputs:**
1. Action UTxO (spend with unitRedeemer)
2. User UTxO with qTokens

**Outputs:**
1. New Action UTxO with updated datum:
   - `supplyDiff` -= actualUnderlying
   - `qTokensDiff` -= burnedQTokens
2. User receives underlying asset

**Burns:**
- qTokens: `burnedAmount` with redeemer `1`

**Reference Inputs:**
- MarketState UTxO (for qTokenRate)
- MarketParams UTxO (for validation)

---

## Redeem Types (API)

From `Liqwid.Api.Types`:

```haskell
data RedeemRequest
  = RedeemQTokens { qTokens :: BigInt }      -- "I want to burn X qTokens"
  | RedeemUnderlying { underlying :: BigInt } -- "I want to receive X underlying"
```

**RedeemQTokens:** User specifies exact qTokens to burn, receives calculated underlying
**RedeemUnderlying:** User specifies exact underlying to receive, burns calculated qTokens

---

## qTokenRate Calculation

```haskell
qTokenRate :: IncomeRatio -> Supply -> Principal -> Interest -> QTokens -> Maybe Ratio
qTokenRate inc supply principal interest qTokens =
  if qTokens == 0 
    then Nothing  -- Edge case: no qTokens minted yet
    else Just $ (supply + principal + splitIncomeSuppliers inc interest) / qTokens
```

Where:
- `supply` = Total underlying supplied
- `principal` = Total borrowed principal
- `interest` = Accrued interest
- `qTokens` = Total qTokens in circulation
- `splitIncomeSuppliers` = Portion of interest going to suppliers

---

## Key Observations

1. **Action UTxO is stateful** - Each operation modifies the ActionDatum
2. **Reference inputs for read-only state** - MarketState/Params are never spent, only referenced
3. **Batching** - Multiple actions can be batched in one Action UTxO
4. **Time-bounded** - Transactions must validate within `maxTimeWidth` of `lastBatch`
