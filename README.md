# ![ss](https://polygonscan.com/token/images/metasocceruniverse_32.png) MetaSoccer Tickets
[![contract](https://img.shields.io/badge/Contract-Polygon-%238247e5)](https://polygonscan.com/address/0x281d01e5b148e00bfb4e4a9532b8115479179e67)
![coverage](https://img.shields.io/badge/Coverage-~100-green)


  [Twitter](https://twitter.com/MetaSoccer_EN)
• [Discord](https://discord.gg/metasoccer)
• [Telegram](https://t.me/MetaSoccerOfficial)
• [Blog](https://metasoccer.medium.com/)
• [Game](https://metasoccer.com/)

Clone project, install dependencies, update API keys under hardhat.config.js, then you can compile latest changes and run tests with:

```
npx hardhat test
```

Deploy on external networks by running the scripts under the /deploy folder:

```
npx hardhat deploy --network mumbai
OR
npx hardhat run --network mumbai scripts/deployVouchers.js
```

Verify contracs on polygonscan with:

```
npx hardhat verify --network mumbai <contract_address>
```
