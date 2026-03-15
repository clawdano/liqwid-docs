# ADA Market - Mainnet Reference

## Key Script Hashes

### QToken Minting Policy
- **Policy ID**: `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68`
- **Purpose**: Mints/burns qADA tokens
- **Token Name**: (empty string)

### Action Validator
- **Script Hash**: `31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce`
- **Token Policy**: `7807209cec9f79c9f6cf5bea2ab7826e6e46b6a7583a337b7e20fb36`
- **Purpose**: Handles supply/redeem operations

### MarketState
- **Validator**: `8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726`
- **Token Policy**: `5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c`
- **Contains**: qTokenRate (exchange rate), supply, qTokens, interest, etc.

### MarketParams
- **Token Policy**: `24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b`
- **Contains**: Initial qToken rate, interest model, thresholds

### Batch
- **Validator**: `a3e56ea9d2db008038ce6fb32e500faef1523dcb042e5a637d633fc8`
- **Token Policy**: `15706915432bf92ea3585aa468b507b90e427dc4effeae31ee5cf40e`

## Finding UTxOs

```typescript
// Find MarketState UTxO
const marketStateUtxo = await findUtxoByToken("5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c");

// Find Action UTxO (4 exist for parallel processing)
const actionUtxo = await findUtxoByToken("7807209cec9f79c9f6cf5bea2ab7826e6e46b6a7583a337b7e20fb36");

// Find MarketParams UTxO
const marketParamsUtxo = await findUtxoByToken("24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b");
```

## Transaction Flow

### Supply (Deposit ADA → Receive qADA)
1. Query MarketState UTxO → get qTokenRate
2. Calculate: `qTokensToMint = depositLovelace * qTokenRate.denom / qTokenRate.num`
3. Build TX:
   - Reference: MarketState, MarketParams, Action script ref
   - Spend: Action UTxO (unitRedeemer)
   - Mint: qADA (redeemer: unit)
   - Output: Updated Action UTxO (+ADA, updated datum)
   - Output: qTokens to user

### Withdraw (Burn qADA → Receive ADA)
1. Query MarketState UTxO → get qTokenRate
2. Calculate: `adaToReceive = qTokensToBurn * qTokenRate.num / qTokenRate.denom`
3. Build TX:
   - Reference: MarketState, MarketParams, Action script ref
   - Spend: Action UTxO (unitRedeemer), User qTokens
   - Burn: qADA (negative mint, redeemer: unit)
   - Output: Updated Action UTxO (-ADA, updated datum)
   - Output: ADA to user

## MarketState Datum Fields

| Position | Field | Description |
|----------|-------|-------------|
| 0 | supply | Total ADA supplied (lovelace) |
| 1 | reserve | Protocol reserves |
| 2 | qTokens | Total qTokens in circulation |
| 3 | principal | Total borrowed |
| 4 | interest | Accrued interest |
| 5 | interestIndex | Compound interest index |
| 6 | interestRate | Current rate [num, denom] |
| 7 | lastInterestTime | Last interest calculation |
| 8 | lastBatch | Last batch timestamp |
| 9 | **qTokenRate** | Exchange rate [num, denom] |
| 10 | minAda | Minimum ADA per UTxO |

## ActionDatum Fields

```
ActionDatum = [ActionValue, reservedSupply]
ActionValue = [supplyDiff, qTokensDiff, principalDiff, interestDiff, extraInterestRepaid]
```

| Position | Field | Update on Supply/Redeem |
|----------|-------|------------------------|
| [0][0] | supplyDiff | +deposit / -withdraw |
| [0][1] | qTokensDiff | +mint / -burn |
| [0][2] | principalDiff | (unchanged) |
| [0][3] | interestDiff | (unchanged) |
| [0][4] | extraInterestRepaid | (unchanged) |
| [1] | reservedSupply | (unchanged) |

## Redeemers

Both Action validator and QToken minting policy use **unit redeemer**:
```
Constr 0 [] = d8799fff (CBOR)
```

The QToken policy checks mint amount sign internally:
- Positive = minting (supply)
- Negative = burning (redeem)
