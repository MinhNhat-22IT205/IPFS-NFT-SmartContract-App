require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/60457bcc01d743168430e04ceae46078", // or Infura
      accounts: [
        "a5b2ffd4e769753542dff3fb46da713a347745ef992c0e27a5c88ee21fa4c4b1",
      ], // test wallet only!
    },
  },
};
