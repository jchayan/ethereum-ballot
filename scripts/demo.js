const hre = require('hardhat');
const ethers = hre.ethers;
const parseOptions = require('minimist');
const argv = process.argv.slice(2);
const options = parseOptions(argv, { string : ['address'] });

const fs = require('fs');
const compiled = fs.readFileSync('./artifacts/contracts/Ballot.sol/Ballot.json')
const abi = JSON.parse(compiled).abi;

const TX_OVERRIDES = { gasPrice: 60000000 };

const giveRightsToVote = (ballot, addresses) => {
    const rightPromises = addresses.map(async (address) => {
        let tx = await ballot.giveRightToVote(address, TX_OVERRIDES);
        return tx.wait();
    });

    return Promise.all(rightPromises);
};

const vote = (ballot, signers) => {
    const voterSets = [ 
        [signers[0], signers[1]],
        [signers[2], signers[3], signers[4]]
    ];

    const votePromises = voterSets.map((set, candidateId) => {
        return set.map(async (voter) => {
            let ballotVoter = ballot.connect(voter);
            let tx = await ballotVoter.vote(candidateId, TX_OVERRIDES);
            return tx.wait();
        });
    }).reduce((acc, promise) => acc.concat(promise));

    return Promise.all(votePromises);
};

const getSigners = provider => {
    return [
        provider.getSigner(1),
        provider.getSigner(2),
        provider.getSigner(3),
        provider.getSigner(4),
        provider.getSigner(5)
    ];
}

const getAddresses = signers => {
    const addressPromises = signers.map(signer => signer.getAddress());
    return Promise.all(addressPromises);
};

const getWinner = async (ballot) => {
    const winnerName = await ballot.winnerName();
    return ethers.utils.parseBytes32String(winnerName);
};

const main = async () => {
    const address = options.address;
    const provider = new ethers.providers.JsonRpcProvider('http://localhost:4444');
    const chairman = provider.getSigner(0);

    let ballot = new ethers.Contract(address, abi, chairman);
    const signers = getSigners(provider);

    getAddresses(signers)
        .then(addresses => giveRightsToVote(ballot, addresses))
        .then(() => vote(ballot, signers))
        .then(() => getWinner(ballot))
        .then(console.log);
};

main();
