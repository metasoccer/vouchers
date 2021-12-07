require('dotenv').config();

async function main() {
  // We get the contract to deploy
  const [owner] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("TestMintableToken");
  const initialSupply = ethers.utils.parseEther('100000000');
  console.log("Owner: ", owner.address);
  console.log("Initial Supply: ", initialSupply.toString());
  const token = await Token.connect(owner).deploy(owner.address, initialSupply);

  console.log("MetaSoccer deployed to:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
