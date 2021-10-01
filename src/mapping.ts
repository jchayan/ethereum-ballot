import { Voted, Delegated } from '../generated/Ballot/Ballot'
import { Vote, Delegation } from '../generated/schema'

export function handleVoted(event: Voted): void {
  let params = event.params;
  let vote = new Vote(params.voterId.toHex());

  vote.weight = params.weight;
  vote.voterAddress = params.voterId;
  vote.votedProposal = params.proposal;

  vote.save();
}

export function handleDelegated(event: Delegated): void {
  let params = event.params;
  let delegation = new Delegation(params.voterId.toHex());

  delegation.voterAddress = params.voterId;
  delegation.delegateAddress = params.delegateId;

  delegation.save();
}
