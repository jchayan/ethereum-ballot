const hre = require('hardhat');
const utils = hre.ethers.utils;

async function main() {
    const proposals = [
        'Alvaro Fariña', 'Juraj Piar'
    ].map(utils.formatBytes32String);

    await hre.run('compile', { force: true });

    // We get the contract to deploy
    const Ballot = await hre.ethers.getContractFactory('Ballot');
    const ballot = await Ballot.deploy(proposals);
    await ballot.deployed();
    return ballot;
}

main().then(ballot => {
    console.log("Ballot deployed to:", ballot.address);
    process.exit(0);
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
