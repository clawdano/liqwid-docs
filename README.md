# Liqwid Finance - Open Source Documentation

Community-driven documentation for [Liqwid Finance](https://liqwid.finance), the largest DeFi lending protocol on Cardano.

> ⚠️ **Work in Progress** - This documentation is being reverse-engineered from on-chain data and open source components. Not affiliated with Liqwid Labs.

## Overview

Liqwid is a lending protocol where:
- **Suppliers** deposit assets (ADA, USDA, etc.) and receive qTokens representing their position
- **Borrowers** use collateral to take loans, paying interest to suppliers
- **Liquidators** close unhealthy positions, earning a bonus

## Documentation

### Core Concepts
- [**Supply/Redeem Flow**](./docs/supply-redeem.md) ✅ - Complete MeshJS guide
- [**Market Registry**](./docs/market-registry.md) ✅ - All markets with script hashes
- [qTokens Explained](./docs/qtokens.md) *(coming soon)*
- [Interest Rates](./docs/interest-rates.md) *(coming soon)*

### Technical Reference
- [ActionDatum Structure](./research/action-datum-structure.md)
- [MarketState Structure](./research/market-state-structure.md)
- [UTxO Relationships](./research/utxo-relationships.md)

### SDK
- [MeshJS Supply/Withdraw](./sdk/liqwid-supply.ts) - Working TypeScript implementation

### On-Chain Data
- [Registry (v5)](./registry.json) - All market addresses, tokens, and script hashes

## Quick Start

### Read the qTokenRate (Python + Blockfrost)
```python
import requests
from pycardano import PlutusData

BLOCKFROST_KEY = "your_key"
MARKET_STATE_ADDR = "addr1w8..."  # From registry.json

# Query MarketState UTxO
utxos = requests.get(
    f"https://cardano-mainnet.blockfrost.io/api/v0/addresses/{MARKET_STATE_ADDR}/utxos",
    headers={"project_id": BLOCKFROST_KEY}
).json()

# Find UTxO with MarketState token and decode inline datum
# qTokenRate is field index 9 (Ratio of two BigInts)
```

### Calculate APY
```python
def calculate_supply_apy(market_state):
    """
    Supply APY = (qTokenRate_now / qTokenRate_year_ago - 1) * 100
    
    Or estimate from utilization + interest model
    """
    utilization = market_state['principal'] / (market_state['supply'] + market_state['principal'])
    # Apply interest model curve...
```

## Contributing

This is a community effort! Help wanted:
- [ ] Document supply transaction flow
- [ ] Document borrow transaction flow
- [ ] Add liquidation mechanics
- [ ] Create example transactions
- [ ] Build Python/TypeScript SDK snippets

## Resources

- [Liqwid App](https://app.liqwid.finance)
- [Liqwid Docs (Official)](https://docs.liqwid.finance) - High-level overview
- [Liqwid GitHub](https://github.com/Liqwid-Labs) - Some SDK code
- [Agora Governance](https://agora.liqwid.finance) - DAO proposals

## License

MIT - Documentation is free for anyone to use and contribute to.

---

*Built with 🐙 by the Cardano community*
