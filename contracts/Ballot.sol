//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Ballot {
    struct Proposal {
        bytes32 name;
        uint votes;
    }

    struct Voter {
        uint weight;
        bool voted;
        address delegate;
        uint vote;
    }

    address public chairperson;
    mapping(address => Voter) public voters;
    Proposal[] public proposals;

    event GiveRightToVote(address indexed voter);
    event Vote(address indexed voter);

    constructor(bytes32[] memory proposalNames) {
        chairperson = msg.sender;
        voters[chairperson].weight = 1;

        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({ name : proposalNames[i], votes : 0 }));
        }
    }

    function giveRightToVote(address voter) public  {
        require(msg.sender == chairperson, 'Only the chairman can give the right to vote.');
        require(!voters[voter].voted, 'You have already voted');
        require(voters[voter].weight == 0, 'You have already been given rights');

        voters[voter].weight = 1;
        emit GiveRightToVote(voter);
    }

    function delegate(address to) public {
        Voter storage sender = voters[msg.sender];

        require(!sender.voted, 'You have already voted');
        require(msg.sender != to, "You can't delegate to yourself");

        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;
            require(msg.sender != to, 'Delegation loop found');
        }

        sender.voted = true;
        sender.delegate = to;

        Voter storage delegate_ = voters[to];

        if (delegate_.voted) {
            proposals[delegate_.vote].votes += sender.weight;
        } else {
            delegate_.weight += sender.weight;
        }
    }

    function vote(uint proposal) public {
        Voter storage sender = voters[msg.sender];

        require(sender.weight != 0, 'Has no right to vote');
        require(!sender.voted, 'Already voted');

        sender.voted = true;
        sender.vote  = proposal;

        // If 'proposal' is out of the range of the array,
        // this will throw automatically and revert changes.
        proposals[proposal].votes += sender.weight;
        emit Vote(msg.sender);
    }

    function winningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].votes > winningVoteCount) {
                winningVoteCount = proposals[p].votes;
                winningProposal_ = p;
            }
        }
    }

    function winnerName() public view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
