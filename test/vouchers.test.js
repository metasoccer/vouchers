const { expect } = require("chai");
const  firstDrop = ethers.utils.formatBytes32String("1");
const  secondDrop = ethers.utils.formatBytes32String("2");
const  thirdDrop = ethers.utils.formatBytes32String("3");
const  emptyWhitelist = ethers.utils.formatBytes32String("");
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const whitelist = require('./whitelist.json')
const whitelistUpdated = require('./whitelistUpdated.json')


// Hash token function. To be used with MerkleTree.
function convertToSolidity(account) {
  return Buffer.from(
    ethers.utils
      .solidityKeccak256(['address'], [account])
      .slice(2),
    'hex'
  );
}

const whitelistSolidityFormat = whitelist.map((token) => convertToSolidity(token));

const merkleTree = new MerkleTree(
  whitelistSolidityFormat,
  keccak256,
  { sortPairs: true }
)

const updatedWhitelistSolidityFormat = whitelistUpdated.map((token) => convertToSolidity(token));
const updatedTree = new MerkleTree(
  updatedWhitelistSolidityFormat,
  keccak256,
  { sortPairs: true }
)

const formattedDrop = [
  emptyWhitelist, // Merkle Root - empty string for whitelist
  1, // Price
  10, // Min Purchase per drop
  50, // Max Purchase per drop
  false, // started
  [ // Goalkeepers
    20, // Available for Drop
    0,  // Total Bought in Drop
    10  // Max of type per wallet
  ],
  [ // Defenders
    30, // Available for Drop
    0,  // Total Bought in Drop
    20  // Max of type per wallet
  ],
  [ // Midfielders
    30, // Available for Drop
    0,  // Total Bought in Drop
    20  // Max of type per wallet
  ],
  [ // Attackers
    30, // Available for Drop
    0,  // Total Bought in Drop
    20  // Max of type per wallet
  ]
];

const secondFormattedDrop = [
    emptyWhitelist, // Merkle Root - empty string for whitelist
    1, // Price
    5, // Min Purchase per drop
    10, // Max Purchase per drop
    false, // started
    [ // Goalkeepers
      50, // Available for Drop
      0,  // Total Bought in Drop
      5  // Max of type per wallet
    ],
    [ // Defenders
      100, // Available for Drop
      0,  // Total Bought in Drop
      10  // Max of type per wallet
    ],
    [ // Midfielders
      100, // Available for Drop
      0,  // Total Bought in Drop
      10  // Max of type per wallet
    ],
    [ // Attackers
      100, // Available for Drop
      0,  // Total Bought in Drop
      10  // Max of type per wallet
    ]
];

const thirdFormattedDrop = [
  merkleTree.getHexRoot(), // Merkle Root
  1, // Price
  5, // Min Purchase per drop
  20, // Max Purchase per drop
  false, // started
  [ // Goalkeepers
    50, // Available for Drop
    0,  // Total Bought in Drop
    5  // Max of type per wallet
  ],
  [ // Defenders
    100, // Available for Drop
    0,  // Total Bought in Drop
    10  // Max of type per wallet
  ],
  [ // Midfielders
    100, // Available for Drop
    0,  // Total Bought in Drop
    10  // Max of type per wallet
  ],
  [ // Attackers
    100, // Available for Drop
    0,  // Total Bought in Drop
    10  // Max of type per wallet
  ]
];

describe("Vouchers Contract", () => {
  let minter, wallet1, wallet2, wallet3;
  before(async  () => {
    const wallets = await ethers.getSigners();
    this.admin = wallets[0];
    this.minter = wallets[1];
    this.pauser = wallets[2];
    this.treasury = wallets[3];
    this.alice = wallets[4];
    this.bob = wallets[5];
    this.charlie = wallets[6];
  });

  describe('Setting up the environment', () => {
    it("Should deploy an ERC20", async () => {
      const Contract = await ethers.getContractFactory('TestMintableToken');

      // Deploy NFT Contract and assign minter as MINTER_ROLE.
  	  const initialSupply = ethers.utils.parseEther('360000000');
      this.erc20 = await Contract.connect(this.admin).deploy(this.treasury.address, initialSupply)
        .then(f => f.deployed());
      expect(await this.erc20.name()).to.equal('Test Mintable Token');
      expect(await this.erc20.symbol()).to.equal('TMT');
      expect(await this.erc20.decimals()).to.equal(18);
  	  expect(await this.erc20.totalSupply()).to.equal(initialSupply);
    })

    it("Should deploy Vouchers contract", async () => {
      const Contract = await ethers.getContractFactory('Vouchers');

      this.vouchers = await Contract.connect(this.admin).deploy()
        .then(f => f.deployed());
      expect(await this.vouchers.name()).to.equal('MetaSoccer Youth Scout Tickets');
      expect(await this.vouchers.symbol()).to.equal('MSYST');
  	  expect(await this.vouchers.totalSupply()).to.equal(0);
    })

    it("Should change vouchers payment token to test MSU", async () => {
      await this.vouchers.connect(this.admin).setMintingToken(this.erc20.address);
      expect(await this.vouchers.mintingToken()).to.equal(this.erc20.address);
    })

    it("Should transfer 1000 tokens to Alice", async () => {
	    const amount = ethers.utils.parseEther('1000');
      await this.erc20.connect(this.treasury).transfer(this.alice.address, amount);
      res = await this.erc20.balanceOf(this.alice.address);
      expect(res).to.equal(amount);
    })

    it("Should transfer 1000 tokens to Bob", async () => {
	    const amount = ethers.utils.parseEther('1000');
      await this.erc20.connect(this.treasury).transfer(this.bob.address, amount);
      res = await this.erc20.balanceOf(this.bob.address);
      expect(res).to.equal(amount);
    })

    it("Should transfer 1000 tokens to Charlie", async () => {
	    const amount = ethers.utils.parseEther('1000');
      await this.erc20.connect(this.treasury).transfer(this.charlie.address, amount);
      res = await this.erc20.balanceOf(this.charlie.address);
      expect(res).to.equal(amount);
    })
  });


  describe('Test Vouchers', () => {
    describe("Prepare drop and allowance ", () => {
      it("Alice should grant allowance to vouchers contract to spend the 1000 MSU", async () => {
        amount = ethers.utils.parseEther('1000');
        await this.erc20.connect(this.alice).approve(this.vouchers.address, amount);
        allowance = await this.erc20.allowance(this.alice.address, this.vouchers.address)
        expect(allowance).to.equal(amount);
      })

      it("Bob should grant allowance to vouchers contract to spend the 1000 MSU", async () => {
        amount = ethers.utils.parseEther('1000');
        await this.erc20.connect(this.bob).approve(this.vouchers.address, amount);
        allowance = await this.erc20.allowance(this.bob.address, this.vouchers.address)
        expect(allowance).to.equal(amount);
      })

      it("Should create first drop with 10 min purchase, no whitelist", async () => {
        await this.vouchers.connect(this.admin).setDrop(firstDrop, formattedDrop);
        const drop = await this.vouchers.drops(firstDrop);
        expect(drop['minPurchase']).to.equal(10);
        expect(drop['maxPurchase']).to.equal(50);
        expect(drop['started']).to.equal(false);
      })

      it("Should fail if Alice tries to buy 10 tickets since drop is not started", async () => {
        await expect( this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '0', '0', '0', '10'))
          .to.be.revertedWith('drop not started');
      })

      it("Should start first drop", async () => {
        await this.vouchers.connect(this.admin).toggleDropStarted(firstDrop);
        const drop = await this.vouchers.drops(firstDrop);
        expect(drop['started']).to.equal(true);
      })
    });
    
    describe("Scenario 1: A user can't buy less than a minimum by drop", () => {
      it("Should fail if Alice tries to buy less than minimum first drop", async () => {
        await expect( this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '2', '2', '2', '2'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })
    });

    describe("Scenario 2 : A user can't buy more than a maximum by type and drop", () => {
      it("Should fail if Alice tries to buy 11 goalkeepers", async () => {
        await expect( this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '11', '0', '0', '0'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })
    });

    describe("Scenario 3: The minimum is at drop level", () => {
      it("Should allow Alice to buy 10 vouchers on first drop", async () => {
        await this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '2', '3', '3', '2')
        expect(await this.vouchers.balanceOf(this.alice.address)).to.equal(10);
      })
    
      it("Should allow Alice to buy 4 vouchers since she already bought 10", async () => {
        await this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '1', '1', '1', '1')
        expect(await this.vouchers.balanceOf(this.alice.address)).to.equal(14);
      })
    });

    describe("Scenario 4: The maximum is at drop and type level", () => {
      it("Should fail if Alice tries to buy another 8 goalkeepers since she already has 3 and max is 10", async () => {
        await expect( this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '8', '0', '0', '0'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Should fail if Alice tries to buy another 20 defenders since she already has 4 and max is 20", async () => {
        await expect( this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '0', '20', '0', '0'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Should fail if Alice tries to buy another 20 midfielders since she already has 4 and max is 20", async () => {
        await expect( this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '0', '0', '20', '0'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Should fail if Alice tries to buy another 20 forwards since she already has 3 and max is 20", async () => {
        await expect( this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '0', '0', '0', '20'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Should fail if Alice tries to buy another 40 vouchers since she already has 14 and drop total is 50", async () => {
        await expect( this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '0', '15', '15', '10'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Should allow Alice to buy another 7 goalkeepers for a total of 10", async () => {
        await this.vouchers.connect(this.alice).buyVouchers(firstDrop, [emptyWhitelist], '7', '0', '0', '0')
        expect(await this.vouchers.balanceOf(this.alice.address)).to.equal(21);
      })

      it("Should allow Bob to buy 10 of each covering", async () => {
        await this.vouchers.connect(this.bob).buyVouchers(firstDrop, [emptyWhitelist], '10', '10', '10', '10')
        expect(await this.vouchers.balanceOf(this.bob.address)).to.equal(40);
      })

      it("Shouldn't allow Charlie to buy 10 goalkeepers since drop is sold out", async () => {
        await expect( this.vouchers.connect(this.charlie).buyVouchers(firstDrop, [emptyWhitelist], '10', '0', '0', '0'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Shouldn't allow Charlie to buy 20 defenders since not enough remain at drop level", async () => {
        await expect( this.vouchers.connect(this.charlie).buyVouchers(firstDrop, [emptyWhitelist], '0', '20', '0', '0'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Shouldn't allow Charlie to buy 20 midfielders since not enough remain at drop level", async () => {
        await expect( this.vouchers.connect(this.charlie).buyVouchers(firstDrop, [emptyWhitelist], '0', '0', '20', '0'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Shouldn't allow Charlie to buy 20 forwards since not enough remain at drop level", async () => {
        await expect( this.vouchers.connect(this.charlie).buyVouchers(firstDrop, [emptyWhitelist], '0', '0', '0', '20'))
          .to.be.revertedWith('ERROR_WRONG_QTY');
      })

      it("Shouldn't allow Charlie to buy 10 tickets since he hasn't approved ERC20", async () => {
        await expect( this.vouchers.connect(this.charlie).buyVouchers(firstDrop, [emptyWhitelist], '0', '5', '5', '0'))
          .to.be.revertedWith('ERC20: transfer amount exceeds allowance');
      })
      
    });

    describe("Scenario 5: A user can buy in different drops", () => {
      it("Should create second drop with 5 min purchase", async () => {
        await this.vouchers.connect(this.admin).setDrop(secondDrop, secondFormattedDrop);
        const drop = await this.vouchers.drops(secondDrop);
        expect(drop['minPurchase']).to.equal(5);
        expect(drop['maxPurchase']).to.equal(10);
        expect(drop['started']).to.equal(false);
      })
        
      it("Should start second drop", async () => {
        await this.vouchers.connect(this.admin).toggleDropStarted(secondDrop);
        const drop = await this.vouchers.drops(secondDrop);
        expect(drop['started']).to.equal(true);
      })

      it("Should allow Alice to buy 10 vouchers on second drop", async () => {
        await this.vouchers.connect(this.alice).buyVouchers(secondDrop, [emptyWhitelist],  '2', '3', '3', '2')
        expect(await this.vouchers.balanceOf(this.alice.address)).to.equal(31);
      })
    });

    

    describe("Scenario 6: A user not whitelisted can't buy in a drop ", () => {

      it("Should create third drop with 5 min purchase whitelisted for Alice and not for Bob", async () => {
        await this.vouchers.connect(this.admin).setDrop(thirdDrop, thirdFormattedDrop);
        const drop = await this.vouchers.drops(thirdDrop);
        expect(drop['minPurchase']).to.equal(5);
        expect(drop['maxPurchase']).to.equal(20);
        expect(drop['started']).to.equal(false);
      })
        
      it("Should start third drop", async () => {
        await this.vouchers.connect(this.admin).toggleDropStarted(thirdDrop);
        const drop = await this.vouchers.drops(thirdDrop);
        expect(drop['started']).to.equal(true);
      })

      it("Should allow Alice to buy 10 vouchers on third drop", async () => {
        await this.vouchers.connect(this.alice).buyVouchers(
          thirdDrop,
          merkleTree.getHexProof(convertToSolidity(this.alice.address)),
           '2', '3', '3', '2')
        expect(await this.vouchers.balanceOf(this.alice.address)).to.equal(41);
      })

      it("Should fail if Bob tries to buy since he's not whitelisted", async () => {
        await expect(
          this.vouchers.connect(this.alice).buyVouchers(
            thirdDrop,
            merkleTree.getHexProof(convertToSolidity(this.bob.address)),
             '2', '3', '3', '2'))
          .to.be.revertedWith('Invalid merkle proof');
      })
    });  
    
    describe("Scenario 7: A user not whitelisted can be added to the whitelist and buy", () => {
      it("Should add Bob to the whitelist of the active drop", async () => {
        const updatedRoot = updatedTree.getHexRoot();
        await this.vouchers.connect(this.admin).setDropWhitelist(thirdDrop, updatedRoot);
        const drop = await this.vouchers.drops(thirdDrop);
        expect(drop['root']).to.equal(updatedRoot);
      })

      it("Should allow Bob to buy 10 vouchers on third drop since he's now whitelisted", async () => {
        await this.vouchers.connect(this.bob).buyVouchers(
          thirdDrop,
          updatedTree.getHexProof(convertToSolidity(this.bob.address)),
           '2', '3', '3', '2')
        expect(await this.vouchers.balanceOf(this.bob.address)).to.equal(50);
      })
    });

    describe("Scenario 8: Admin can mint for giveaway", () => {
      it("Should allow Admin to get 10 vouchers for giveaway", async () => {
        await this.vouchers.connect(this.admin).mintForGiveaway("10", "Midfielder");
        expect(await this.vouchers.balanceOf(this.admin.address)).to.equal(10);
      })
    });

    describe("Scenario 9: Admin can burn an approved NFT", () => {

      const tokenId = 50;

      it("Shouldn't allow Admin to burn Bob NFT since not approved yet", async () => {
        await expect(this.vouchers.connect(this.admin).burnToken(tokenId)).to.be.revertedWith('Sender is not owner nor approved');
      })

      it("Should allow Bob to approve the admin for using his NFT", async () => {
        await this.vouchers.connect(this.bob).approve(this.admin.address, tokenId);
        expect(await this.vouchers.getApproved(tokenId)).to.equal(this.admin.address);
      })

      it("Should allow Admin to burn Bob NFT", async () => {
        await this.vouchers.connect(this.admin).burnToken(tokenId);
        await expect(this.vouchers.ownerOf(tokenId)).to.be.revertedWith('ERC721: owner query for nonexistent token');
      })
    });

    describe("Scenario 10: Admin can pause the contract and bob should be unable to buy", () => {
      it("Should allow Admin to pause the contract", async () => {
        await this.vouchers.connect(this.admin).pause(true);
        expect(await this.vouchers.paused()).to.equal(true);
      })
      it("Shouldn't allow Bob to buy", async () => {
        await expect(this.vouchers.connect(this.bob).buyVouchers(
          thirdDrop,
          updatedTree.getHexProof(convertToSolidity(this.bob.address)),
           '2', '3', '3', '2')).to.be.revertedWith("buy while paused");
      })
      it("Should allow Admin to unpause the contract", async () => {
        await this.vouchers.connect(this.admin).pause(false);
        expect(await this.vouchers.paused()).to.equal(false);
      })
      it("Should allow Bob to buy", async () => {
        await this.vouchers.connect(this.bob).buyVouchers(
          thirdDrop,
          updatedTree.getHexProof(convertToSolidity(this.bob.address)),
           '2', '3', '3', '2')
        expect(await this.vouchers.balanceOf(this.bob.address)).to.equal(59);
      })
    });

  });
  
  describe("Read only methods", function () {
    let vouchers;
    let admin;
    let alice;
    let bob;
    let random;
    let treasury;
    let erc20;
    let aliceVouchers = {
      Goalkeeper: 2,
      Defender: 3,
      Midfielder: 3,
      Forward: 2
    };
    let bobVouchers = {
      Goalkeeper: 0,
      Defender: 5,
      Midfielder: 5,
      Forward: 0
    };
    beforeEach(async function () {
      [admin, alice, bob, random, treasury, ...addrs] = await ethers.getSigners();
       const msuContract = await ethers.getContractFactory('TestMintableToken');

      // Deploy NFT Contract and assign minter as MINTER_ROLE.
  	  const initialSupply = ethers.utils.parseEther('360000000');
      erc20 = await msuContract.connect(admin).deploy(treasury.address, initialSupply)
        .then(f => f.deployed());

      const vouchersContract = await ethers.getContractFactory('Vouchers');

      vouchers = await vouchersContract.connect(admin).deploy()
        .then(f => f.deployed());

      let promises = [];
      promises.push(vouchers.connect(admin).setDrop(firstDrop, formattedDrop));
      promises.push(vouchers.connect(admin).setDrop(secondDrop, secondFormattedDrop));
      promises.push(vouchers.connect(admin).setDrop(thirdDrop, thirdFormattedDrop));
      promises.push(vouchers.connect(admin).toggleDropStarted(firstDrop));
      promises.push(vouchers.connect(admin).setMintingToken(erc20.address));

      const amount = ethers.utils.parseEther('10000');
      [alice, bob].forEach((signer) => {
        promises.push(
          erc20.connect(treasury).transfer(signer.address, amount),
          erc20.connect(signer).approve(vouchers.address, amount),
          erc20.allowance(signer.address, vouchers.address)
        );
      });

      await Promise.all(promises);
      await vouchers.connect(alice).buyVouchers(firstDrop, [emptyWhitelist], ...Object.values(aliceVouchers));
      await vouchers.connect(bob).buyVouchers(firstDrop, [emptyWhitelist], ...Object.values(bobVouchers));

    });

    it("getAllOwned should return alices vouchers", async () => {
      let r = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0};
      const ownedVouchers = await vouchers.getAllOwned(alice.address);
      for (voucher of ownedVouchers) {
        r[voucher]++;
      }

      let total = Object.values(r).reduce((p, c) => c + p);
      let expectedTotal = Object.values(aliceVouchers).reduce((p, c) => p + c);
      expect(r).to.eql(aliceVouchers);
      expect(total).to.equal(expectedTotal);
    });
    it("getAllOwned should return bob vouchers", async () => {
      let r = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0};
      const ownedVouchers = await vouchers.getAllOwned(bob.address);
      for (voucher of ownedVouchers) {
        r[voucher]++;
      }

      let total = Object.values(r).reduce((p, c) => c + p);
      let expectedTotal = Object.values(bobVouchers).reduce((p, c) => p + c);
      expect(r).to.eql(bobVouchers);
      expect(total).to.equal(expectedTotal);
    });

    it("getAllOwned should return empty array for random", async () => {
      let r = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0};
      const ownedVouchers = await vouchers.getAllOwned(random.address);
      expect(ownedVouchers).to.be.empty;
    });

    it("getAllVouchers should return all minted", async () => {
      let r = { Goalkeeper: 0, Defender: 0, Midfielder: 0, Forward: 0};
      const allVouchers = await vouchers.getAllVouchers();
      for (voucher of allVouchers) {
        r[voucher]++;
      }

      let total = Object.values(r).reduce((p, c) => c + p);
      let expectedTotal = Object.values(bobVouchers).reduce((p, c) => p + c);
      expectedTotal += Object.values(aliceVouchers).reduce((p, c) => p + c);
      expect(total).to.equal(expectedTotal);
    });

    it("getDropsById should return given drops", async () => {
      const nonExistingDrop = ethers.utils.formatBytes32String("42");
      const allDrops = await vouchers.getDropsById([firstDrop, secondDrop, thirdDrop, nonExistingDrop]);
      expect(allDrops).to.not.be.empty;
      const drop1 = allDrops[0];
      const drop2 = allDrops[1];
      const drop3 = allDrops[2];
      const emptyDrop = allDrops[3];

      expect(drop1[0]).to.equal(formattedDrop[0]);
      expect(drop2[0]).to.equal(secondFormattedDrop[0]);
      expect(drop3[0]).to.equal(thirdFormattedDrop[0]);
      expect(drop3[0]).to.equal(thirdFormattedDrop[0]);
      expect(drop1.goalkeepers.totalNumber).to.equal(formattedDrop[5][0]);
      expect(drop2.goalkeepers.totalNumber).to.equal(secondFormattedDrop[5][0]);
      expect(drop3.goalkeepers.totalNumber).to.equal(thirdFormattedDrop[5][0]);

      expect(emptyDrop[1]).to.equal(0);
      expect(emptyDrop[2]).to.equal(0);
      expect(emptyDrop[3]).to.equal(0);
      expect(emptyDrop.goalkeepers.totalNumber).to.equal(0);
    });

    it("should return valid JSON as metadata", async () => {
      await vouchers.connect(admin).setExternalUrl("https://app.metasoccer.com/");
      await vouchers.connect(admin).setImageUrl("Forward", "https://marketplacewip.metasoccer.com/_nuxt/images/for.jpg");
      await vouchers.connect(admin).setAnimationUrl("Forward", "https://marketplacewip.metasoccer.com/_nuxt/videos/for.32b56e7.mp4");
      const metadata = await vouchers.tokenURI(8);
      const jsonBase64 = ethers.utils.base64.decode(metadata.split(",")[1]);
      const decodedJSONString = Buffer.from(jsonBase64, "base64");
      const json = JSON.parse(decodedJSONString);
      console.log(json);
    });

    it("Should fail if metadata query for nonexistent token", async () => {
      await expect(vouchers.tokenURI(888)).to.be.revertedWith('nonexistent token');
    })

  });

});