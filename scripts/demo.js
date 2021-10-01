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

    return Promise.all(rightPromises).catch(console.error);
};

const delegateVotes = (ballot, voters, to) => {
    const delegatePromises = voters.map(async (voter) => {
        let tx = await ballot.connect(voter).delegate(to, TX_OVERRIDES);
        return tx.wait();
    });

    return Promise.all(delegatePromises);
};

const vote = (ballot, voterSets) => {
    const votePromises = voterSets.map((set, candidateId) => {
        return set.map(async (voter) => {
            let ballotVoter = ballot.connect(voter);
            let tx = await ballotVoter.vote(candidateId, TX_OVERRIDES);
            return tx.wait();
        });
    }).reduce((acc, promise) => acc.concat(promise));

    return Promise.all(votePromises);
};

const getVoters = (provider, from, to) => {
    let voters = [];
    for (let i = from; i <= to; i++) {
        voters.push(provider.getSigner(i));
    }
    return voters;
}

const getAddresses = signers => {
    const addressPromises = signers.map(signer => signer.getAddress());
    return Promise.all(addressPromises);
};

const getWinner = async (ballot) => {
    const winnerName  = await ballot.winnerName();
    const winnerVotes = await ballot.winnerVotes();
    return {
        name  : ethers.utils.parseBytes32String(winnerName),
        votes : winnerVotes
    };
};

const main = async () => {
    const address = options.address;

    const provider = new ethers.providers.JsonRpcProvider('http://localhost:4444');
    const chairman = provider.getSigner(0);
    const chairmanAddress = await chairman.getAddress();

    const ballot = new ethers.Contract(address, abi, chairman);
    const signers = getVoters(provider, 1, 5);

    const voterSets = [ 
        [signers[0], signers[1]],
        [signers[2], signers[3], signers[4]]
    ];

    const votersToDelegate = getVoters(provider, 6, 8);

    getAddresses(signers)
        .then(addresses => giveRightsToVote(ballot, addresses))
        .then(() => vote(ballot, voterSets))
        .then(() => getWinner(ballot))
        .then(winner => console.log(`Winner before chairman vote: ${winner.name} with ${winner.votes} votes`))
        .then(() =>  delegateVotes(ballot, votersToDelegate, chairmanAddress))
        .then(() => vote(ballot, [ [chairman] ]))
        .then(() => getWinner(ballot))
        .then(winner => console.log(`Winner after chairman vote: ${winner.name} with ${winner.votes} votes`));
};

main();
