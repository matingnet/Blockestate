const hre = require("hardhat");

const tokens = (n) => ethers.utils.parseUnits(n.toString(), "ether");

async function deployContract(name, ...args) {
  const Contract = await ethers.getContractFactory(name);
  const contract = await Contract.deploy(...args);
  await contract.deployed();
  console.log(`Deployed ${name} Contract at: ${contract.address}`);
  return contract;
}

async function mintProperties(contract, seller, count) {
  console.log(`Minting ${count} properties...\n`);
  for (let i = 0; i < count; i++) {
    const tx = await contract
      .connect(seller)
      .mint(`./metadata/${i + 1}.json`);
    await tx.wait();
  }
}

async function approveProperties(contract, seller, escrowAddress, count) {
  for (let i = 0; i < count; i++) {
    const tx = await contract.connect(seller).approve(escrowAddress, i + 1);
    await tx.wait();
  }
}

async function listProperties(contract, seller, properties) {
  for (const { id, buyer, price, deposit } of properties) {
    const tx = await contract
      .connect(seller)
      .list(id, buyer, tokens(price), tokens(deposit));
    await tx.wait();
  }
}

async function main() {
  const [buyer, seller, inspector, lender] = await ethers.getSigners();

  // Deploy RealEstate contract and mint properties
  const realEstate = await deployContract("RealEstate");
  await mintProperties(realEstate, seller, 3);

  // Deploy Escrow contract
  const escrow = await deployContract(
    "Escrow",
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  );

  console.log(`Listing properties...\n`);

  // Approve and list properties
  await approveProperties(realEstate, seller, escrow.address, 3);
  await listProperties(escrow, seller, [
    { id: 1, buyer: buyer.address, price: 20, deposit: 10 },
    { id: 2, buyer: buyer.address, price: 15, deposit: 5 },
    { id: 3, buyer: buyer.address, price: 10, deposit: 5 },
  ]);

  console.log(`Finished.`);
}

// Handle errors and execute the main function
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
