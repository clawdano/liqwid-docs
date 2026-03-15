# Liqwid Supply & Redeem Guide

Complete guide to depositing and withdrawing liquidity from Liqwid Finance using MeshJS.

## Overview

| Action | Description | qTokens | Underlying |
|--------|-------------|---------|------------|
| **Supply (Deposit)** | Add liquidity to earn yield | Minted (+) | Locked (+) |
| **Redeem (Withdraw)** | Remove liquidity | Burned (-) | Received (-) |

---

## UTxO Architecture

```
REFERENCE INPUTS (read-only):
├── MarketState UTxO    → qTokenRate, supply totals
├── MarketParams UTxO   → protocol parameters
└── Action Script Ref   → validator code

SPENT INPUT:
└── Action UTxO         → holds liquidity + ActionDatum

OUTPUTS:
├── Action UTxO (updated) → new liquidity + updated ActionDatum
└── User wallet           → qTokens (deposit) or ADA (withdraw)
```

---

## Script Hashes (ADA Market Mainnet)

```typescript
const QTOKEN_POLICY      = "a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68";
const ACTION_SCRIPT_HASH = "31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce";
const ACTION_TOKEN       = "7807209cec9f79c9f6cf5bea2ab7826e6e46b6a7583a337b7e20fb36";
const MARKET_STATE_TOKEN = "5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c";
const MARKET_PARAMS_TOKEN= "24f51a8308b4e47b9d1438ec1e91da4ee063c38c704b530cba4adc5b";
```

---

## Datum Structures

### MarketState (11 fields)

```typescript
// Position 9 is qTokenRate - the key field for conversions
interface MarketState {
  supply: bigint;              // [0] Total ADA supplied
  reserve: bigint;             // [1] Protocol reserves
  qTokens: bigint;             // [2] Total qTokens minted
  principal: bigint;           // [3] Total borrowed
  interest: bigint;            // [4] Accrued interest
  interestIndex: bigint;       // [5] Compound index
  interestRate: [bigint, bigint]; // [6] Current rate
  lastInterestTime: bigint;    // [7] Last update
  lastBatch: bigint;           // [8] Last batch time
  qTokenRate: [bigint, bigint]; // [9] ★ EXCHANGE RATE [num, denom]
  minAda: bigint;              // [10] Min ADA per UTxO
}

// Deserialize from MeshJS format
const deserializeMarketState = (datum: any): MarketState => {
  const f = datum.list;
  return {
    supply:           BigInt(f[0].int),
    reserve:          BigInt(f[1].int),
    qTokens:          BigInt(f[2].int),
    principal:        BigInt(f[3].int),
    interest:         BigInt(f[4].int),
    interestIndex:    BigInt(f[5].int),
    interestRate:     [BigInt(f[6].list[0].int), BigInt(f[6].list[1].int)],
    lastInterestTime: BigInt(f[7].int),
    lastBatch:        BigInt(f[8].int),
    qTokenRate:       [BigInt(f[9].list[0].int), BigInt(f[9].list[1].int)],
    minAda:           BigInt(f[10].int),
  };
};
```

### ActionDatum (2 fields)

```typescript
// Fields [0] and [1] need updates on supply/redeem
interface ActionDatum {
  actionValue: {
    supplyDiff: bigint;          // [0][0] ★ UPDATE: +deposit / -withdraw
    qTokensDiff: bigint;         // [0][1] ★ UPDATE: +mint / -burn
    principalDiff: bigint;       // [0][2] unchanged for supply/redeem
    interestDiff: bigint;        // [0][3] unchanged
    extraInterestRepaid: bigint; // [0][4] unchanged
  };
  reservedSupply: bigint;        // [1] unchanged
}

// Deserialize
const deserializeActionDatum = (datum: any): ActionDatum => {
  const f = datum.list;
  const av = f[0].list;
  return {
    actionValue: {
      supplyDiff:          BigInt(av[0].int),
      qTokensDiff:         BigInt(av[1].int),
      principalDiff:       BigInt(av[2].int),
      interestDiff:        BigInt(av[3].int),
      extraInterestRepaid: BigInt(av[4].int),
    },
    reservedSupply: BigInt(f[1].int),
  };
};

// Serialize
const serializeActionDatum = (datum: ActionDatum): any => ({
  list: [
    {
      list: [
        { int: datum.actionValue.supplyDiff.toString() },
        { int: datum.actionValue.qTokensDiff.toString() },
        { int: datum.actionValue.principalDiff.toString() },
        { int: datum.actionValue.interestDiff.toString() },
        { int: datum.actionValue.extraInterestRepaid.toString() },
      ]
    },
    { int: datum.reservedSupply.toString() }
  ]
});
```

---

## Conversion Formulas

```typescript
// Deposit: ADA → qTokens
const qTokensToMint = (depositLovelace * qTokenRate[1]) / qTokenRate[0];

// Withdraw: qTokens → ADA  
const lovelaceToReceive = (qTokensToBurn * qTokenRate[0]) / qTokenRate[1];
```

**Example (live mainnet data):**
```
qTokenRate = 33220771660819 / 1573254688866635

10 ADA deposit:
  qTokens = (10_000_000 * 1573254688866635) / 33220771660819
         = 473,575,600 qTokens

473,575,600 qTokens redeem:
  ADA = (473575600 * 33220771660819) / 1573254688866635
      = 10,000,000 lovelace = 10 ADA
```

---

## MeshJS Transaction: Supply (Deposit)

```typescript
import { BlockfrostProvider, MeshTxBuilder, deserializeDatum, mConStr0 } from "@meshsdk/core";

const buildDepositTx = async (wallet: MeshWallet, depositAda: number) => {
  const provider = new BlockfrostProvider(BLOCKFROST_KEY);
  const depositLovelace = BigInt(Math.floor(depositAda * 1_000_000));
  const userAddress = await wallet.getChangeAddress();

  // 1. Fetch UTxOs
  const marketStateUtxo = await findUtxoByToken(provider, MARKET_STATE_TOKEN);
  const marketParamsUtxo = await findUtxoByToken(provider, MARKET_PARAMS_TOKEN);
  const actionScriptRefUtxo = await findScriptRefUtxo(ACTION_SCRIPT_HASH);
  const actionUtxo = await findUtxoByToken(provider, ACTION_TOKEN);

  // 2. Decode MarketState → get qTokenRate
  const marketState = deserializeMarketState(
    deserializeDatum(marketStateUtxo.output.plutusData)
  );
  const qTokenRate = marketState.qTokenRate;

  // 3. Calculate qTokens to mint
  const qTokensToMint = (depositLovelace * qTokenRate[1]) / qTokenRate[0];

  // 4. Update ActionDatum
  const currentAction = deserializeActionDatum(
    deserializeDatum(actionUtxo.output.plutusData)
  );
  
  const newActionDatum = {
    actionValue: {
      supplyDiff:  currentAction.actionValue.supplyDiff + depositLovelace,
      qTokensDiff: currentAction.actionValue.qTokensDiff + qTokensToMint,
      principalDiff: currentAction.actionValue.principalDiff,
      interestDiff: currentAction.actionValue.interestDiff,
      extraInterestRepaid: currentAction.actionValue.extraInterestRepaid,
    },
    reservedSupply: currentAction.reservedSupply,
  };

  // 5. Calculate new Action UTxO value
  const currentLovelace = BigInt(
    actionUtxo.output.amount.find(a => a.unit === "lovelace")?.quantity || "0"
  );
  const newLovelace = currentLovelace + depositLovelace;

  // 6. Build transaction
  const mesh = new MeshTxBuilder({ fetcher: provider, evaluator: provider });

  await mesh
    // Reference inputs (read-only)
    .readOnlyTxInReference(marketStateUtxo.input.txHash, marketStateUtxo.input.outputIndex)
    .readOnlyTxInReference(marketParamsUtxo.input.txHash, marketParamsUtxo.input.outputIndex)
    .readOnlyTxInReference(actionScriptRefUtxo.input.txHash, actionScriptRefUtxo.input.outputIndex)
    
    // Spend Action UTxO
    .spendingPlutusScriptV2()
    .txIn(actionUtxo.input.txHash, actionUtxo.input.outputIndex)
    .txInInlineDatumPresent()
    .txInRedeemerValue(mConStr0([]))  // unit redeemer
    .spendingTxInReference(actionScriptRefUtxo.input.txHash, actionScriptRefUtxo.input.outputIndex)
    
    // Mint qTokens
    .mintPlutusScriptV2()
    .mint(qTokensToMint.toString(), QTOKEN_POLICY, "")
    .mintRedeemerValue(mConStr0([]))  // unit redeemer
    
    // Output: Updated Action UTxO
    .txOut(actionUtxo.output.address, [
      { unit: "lovelace", quantity: newLovelace.toString() },
      { unit: ACTION_TOKEN, quantity: "1" },
    ])
    .txOutInlineDatumValue(serializeActionDatum(newActionDatum))
    
    // Output: qTokens to user
    .txOut(userAddress, [
      { unit: "lovelace", quantity: "1500000" },
      { unit: QTOKEN_POLICY, quantity: qTokensToMint.toString() },
    ])
    
    .changeAddress(userAddress)
    .selectUtxosFrom(await wallet.getUtxos())
    .complete();

  return mesh.txHex;
};
```

---

## MeshJS Transaction: Redeem (Withdraw)

```typescript
const buildWithdrawTx = async (wallet: MeshWallet, qTokensToBurn: bigint) => {
  // ... fetch UTxOs same as deposit ...

  // Calculate ADA to receive (inverse formula)
  const lovelaceToReceive = (qTokensToBurn * qTokenRate[0]) / qTokenRate[1];

  // Update ActionDatum with NEGATIVE values
  const newActionDatum = {
    actionValue: {
      supplyDiff:  currentAction.actionValue.supplyDiff - lovelaceToReceive,  // negative
      qTokensDiff: currentAction.actionValue.qTokensDiff - qTokensToBurn,     // negative
      // ... rest unchanged ...
    },
    reservedSupply: currentAction.reservedSupply,
  };

  // New Action UTxO has LESS ADA
  const newLovelace = currentLovelace - lovelaceToReceive;

  await mesh
    // ... reference inputs same as deposit ...
    
    // Spend Action UTxO
    .spendingPlutusScriptV2()
    .txIn(actionUtxo.input.txHash, actionUtxo.input.outputIndex)
    .txInInlineDatumPresent()
    .txInRedeemerValue(mConStr0([]))
    .spendingTxInReference(actionScriptRefUtxo.input.txHash, actionScriptRefUtxo.input.outputIndex)
    
    // Burn qTokens (NEGATIVE mint)
    .mintPlutusScriptV2()
    .mint("-" + qTokensToBurn.toString(), QTOKEN_POLICY, "")
    .mintRedeemerValue(mConStr0([]))
    
    // Output: Updated Action UTxO (less ADA)
    .txOut(actionUtxo.output.address, [
      { unit: "lovelace", quantity: newLovelace.toString() },
      { unit: ACTION_TOKEN, quantity: "1" },
    ])
    .txOutInlineDatumValue(serializeActionDatum(newActionDatum))
    
    // Output: ADA to user
    .txOut(userAddress, [
      { unit: "lovelace", quantity: lovelaceToReceive.toString() },
    ])
    
    .changeAddress(userAddress)
    .selectUtxosFrom(await wallet.getUtxos())
    .complete();

  return mesh.txHex;
};
```

---

## Live Transaction Examples

### Supply (Deposit) - Real Mainnet TX

**TX Hash:** `08b82a63266ff8d4f592e4cd074243f7a117d12cc54f79b00524d943aad801a7`

[View on CardanoScan](https://cardanoscan.io/transaction/08b82a63266ff8d4f592e4cd074243f7a117d12cc54f79b00524d943aad801a7)

**ActionDatum BEFORE (CBOR hex):**
```
9f9f0000000000ff1a1d708490ff
```
Decoded:
```json
{
  "actionValue": {
    "supplyDiff": 0,
    "qTokensDiff": 0,
    "principalDiff": 0,
    "interestDiff": 0,
    "extraInterestRepaid": 0
  },
  "reservedSupply": 494822544
}
```

**ActionDatum AFTER (CBOR hex):**
```
9f9f1b00000009845a5e181b000001c2b3bbc16e000000ff1a1d708490ff
```
Decoded:
```json
{
  "actionValue": {
    "supplyDiff": 40875220504,      // +40,875.22 ADA
    "qTokensDiff": 1935750709614,   // +1.9T qTokens minted
    "principalDiff": 0,
    "interestDiff": 0,
    "extraInterestRepaid": 0
  },
  "reservedSupply": 494822544
}
```

**MarketState qTokenRate (at time of TX):**
```
qTokenRate = [33220771660819, 1573254688866635]
           = 0.0211159527 ADA per qToken
           ≈ 47.36 qTokens per ADA
```

**Verification:**
```typescript
const depositLovelace = 40_875_220_504n;
const qTokenRate = [33220771660819n, 1573254688866635n];

// qTokens = deposit * rate[1] / rate[0]
const qTokensToMint = (depositLovelace * qTokenRate[1]) / qTokenRate[0];
// = 1,935,750,709,614 ✓ (matches on-chain)
```

**What Happened:**
1. User deposited **40,875.22 ADA** into the Action UTxO
2. Protocol minted **1,935,750,709,614 qTokens** to user
3. ActionDatum updated with positive `supplyDiff` and `qTokensDiff`
4. Action UTxO value increased by 40,875.22 ADA

---

### Redeem (Withdraw) - Expected Pattern

For withdrawals, the datum changes are **negative**:

```json
{
  "actionValue": {
    "supplyDiff": -10000000000,     // -10,000 ADA leaving
    "qTokensDiff": -473575600000,   // qTokens being burned
    "principalDiff": 0,
    "interestDiff": 0,
    "extraInterestRepaid": 0
  },
  "reservedSupply": 494822544
}
```

And qTokens are **burned** (negative mint amount in the transaction).

---

## Important Notes

1. **Redeemers are always `unit` (`mConStr0([])`)** - the scripts check mint amount sign internally
2. **Action UTxO address includes staking credential** - must preserve exact address
3. **ActionDatum diffs accumulate** until a Batch TX resets them
4. **4 Action UTxOs exist** for parallel processing - pick any available one
5. **Reference inputs are never spent** - MarketState/Params only read

---

## Full SDK Code

See: [`sdk/liqwid-supply.ts`](../sdk/liqwid-supply.ts)
