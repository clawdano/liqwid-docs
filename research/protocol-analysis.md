# Liqwid Protocol Analysis

## Key Addresses

### Governance (Agora)
- **AgoraStake**: `addr1w8arvq7j9qlrmt0wpdvpp7h4jr4fmfk8l653p9t907v2nsss7w7r4`
- **AgoraProposal**: `addr1wyn2aflq8ff7xaxpmqk9vz53ks28hz256tkyaj739rsvrrq3u5ft3`
- **AgoraStake script hash**: `fa3603d2283e3dadee0b5810faf590ea9da6c7fea91095657f98a9c2`

### Lending Markets
- TODO: Document main market addresses
- TODO: Document qToken policy IDs

## Protocol Mechanics

### Supply Flow
1. User sends ADA/tokens to market contract
2. Contract mints qTokens (receipt tokens) proportional to supply
3. qTokens accrue interest over time
4. qToken balance = claim on underlying + accrued interest

### Withdraw Flow
1. User sends qTokens back to market contract
2. Contract burns qTokens
3. Contract returns underlying + accrued interest
4. Exchange rate: qToken → underlying improves over time

## On-Chain Data

### LQ Token
- Policy ID: `da8c30857834c6ae7203935b89278c532b3995245295456f993e1d24`
- Asset name: `LQ` (hex: `4c51`)

### Staking Stats (as of 2026-03-14)
- Total staked in Agora: ~3.54M LQ
- Active voters: ~9% of staked LQ
- Largest staker: 383,274 LQ

## References
- Liqwid Docs: https://docs.liqwid.finance/
- GitHub: https://github.com/Liqwid-Labs
