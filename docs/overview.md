# Liqwid Finance Protocol Overview

## What is Liqwid?

Liqwid is Cardano's leading DeFi lending protocol. Users can:
- **Supply** assets to earn interest
- **Borrow** assets using supplied assets as collateral
- **Liquidate** undercollateralized positions

## qTokens — Receipt Tokens

When you supply assets to Liqwid, you receive **qTokens** in return:

| Deposit | Receive |
|---------|---------|
| ADA | qADA |
| DJED | qDJED |
| USDC | qUSDC |
| LQ | qLQ |

**qTokens represent your claim on the underlying asset + accrued interest.**

### How qTokens Accrue Interest

qTokens don't change in quantity — instead, their **exchange rate** increases over time.

```
Initial:    1 qADA = 1.00 ADA
After 1yr:  1 qADA = 1.05 ADA  (5% APY)
After 2yr:  1 qADA = 1.10 ADA
```

When you withdraw, you burn your qTokens and receive:
```
ADA received = qTokens × qTokenRate
```

## Key Concepts

### qToken Rate (Exchange Rate)

The **qTokenRate** is stored in the MarketState datum and represents how much underlying asset each qToken is worth.

```
qTokenRate = (totalSupply + totalInterest) / totalQTokens
```

This rate only increases (never decreases), ensuring suppliers always earn.

### Action UTxOs

Liqwid uses **Action UTxOs** as entry points for user interactions. These are script UTxOs that:
- Accept user deposits
- Process withdrawals
- Are consumed and recreated in batches

### Batch Processing

Transactions don't execute immediately. They're collected into **batches** that are processed periodically by batch executors. This improves efficiency and reduces costs.

## Architecture

```
User Transaction
       │
       ▼
┌─────────────────┐
│   Action UTxO   │  ← User interacts here
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Batch UTxO    │  ← Transactions collected
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Market State   │  ← qTokenRate updated
└─────────────────┘
```

## Contract Addresses (ADA Market - Mainnet)

| Component | Script Hash |
|-----------|-------------|
| QToken Policy | `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68` |
| MarketState Validator | `8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726` |
| MarketState Token | `5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c` |
| Action Validator | `31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce` |
| Batch Validator | `a3e56ea9d2db008038ce6fb32e500faef1523dcb042e5a637d633fc8` |

## References

- Registry: https://public.liqwid.finance/v5/registry.json
- Docs: https://docs.liqwid.finance/
- GitHub: https://github.com/Liqwid-Labs
