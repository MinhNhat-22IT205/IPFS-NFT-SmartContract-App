async function main() {
  const IPFSStorage = await ethers.getContractFactory("IPFSNFT");
  const contract = await IPFSStorage.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("Deployed to:", address);
  console.log("Add this to your frontend → CONTRACT_ADDRESS =", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
