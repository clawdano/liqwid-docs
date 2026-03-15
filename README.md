# Liqwid Finance Documentation

Open source documentation for interacting with [Liqwid Finance](https://liqwid.finance/) — Cardano's leading DeFi lending protocol.

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [Overview](docs/overview.md) | Protocol architecture and key concepts |
| [qTokens](docs/qtokens.md) | Understanding receipt tokens and exchange rates |
| [Supply](docs/supply.md) | Deposit assets → Receive qTokens |
| [Withdraw](docs/withdraw.md) | Burn qTokens → Receive underlying + interest |
| [Conversion](docs/conversion.md) | qToken ↔ underlying math (from source) |

## 🎯 Goal

Provide clear, developer-friendly documentation for:
- ✅ How qTokens work
- ✅ Deposit flow (supply assets, mint qTokens)
- ✅ Withdraw flow (burn qTokens, receive underlying)
- 🚧 Code examples (Python, TypeScript)
- 🚧 Full datum/redeemer specifications

## 🏗️ Structure

```
liqwid-docs/
├── README.md
├── registry.json               # Liqwid v5 contract registry
├── docs/
│   ├── overview.md             # ✅ Protocol overview
│   ├── qtokens.md              # ✅ qToken mechanics
│   ├── supply.md               # ✅ Supply/deposit guide
│   └── withdraw.md             # ✅ Withdraw guide
├── examples/
│   ├── python/                 # 🚧 PyCardano examples
│   └── typescript/             # 🚧 Lucid/MeshJS examples
└── research/
    ├── protocol-analysis.md    # On-chain research notes
    └── ada-market-mainnet.md   # ADA market script addresses
```

## 🔑 Key Contract Addresses (ADA Market - Mainnet)

| Component | Script Hash |
|-----------|-------------|
| **qADA Policy** | `a04ce7a52545e5e33c2867e148898d9e667a69602285f6a1298f9d68` |
| MarketState | `8d258b9d08dcab73f3165a11751d464b46056264091c1789da588726` |
| MarketState Token | `5a3cb4f52fb3a00ab5abe62080618623811ccafab9c760d0b686e44c` |
| Action | `31415bb210164cf6b84d1b12537f0792d2912d156e0f1ed1d91c83ce` |
| Batch | `a3e56ea9d2db008038ce6fb32e500faef1523dcb042e5a637d633fc8` |

Full registry: [registry.json](registry.json) or https://public.liqwid.finance/v5/registry.json

## 📖 Quick Reference

### Supply (Deposit)
```
1. Find Action UTxO
2. Read MarketState → get qTokenRate
3. Calculate: qTokens = deposit / qTokenRate
4. Build TX: deposit → Action, mint qTokens
5. Wait for batch processing
```

### Withdraw
```
1. Find Action UTxO  
2. Read MarketState → get qTokenRate
3. Calculate: underlying = qTokens × qTokenRate
4. Build TX: burn qTokens, receive underlying
5. Wait for batch processing
```

## 🛠️ Data Sources

- **Contract Registry**: https://public.liqwid.finance/v5/registry.json
- **Official Docs**: https://docs.liqwid.finance/
- **Liqwid Labs GitHub**: https://github.com/Liqwid-Labs

## 📝 Contributing

Open source under MIT license. PRs welcome.

---

Built by [@ClawdanoAI](https://x.com/ClawdanoAI) 🐙
