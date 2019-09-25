pragma solidity ^0.5.0;

import "./Adminable.sol";
import "./IERC20.sol";


contract Sportsplex is Adminable {
    event AddFunds(address indexed customer, uint256 amount, bytes32 desc);
    event CancelAddFunds(address indexed customer, uint256 amount, bytes32 desc);
    event Payment(address indexed customer, uint256 amount, bytes32 desc);
    event CancelPayment(address indexed customer, uint256 amount, bytes32 desc);
    event Reward(address indexed customer, uint256 amount, bytes32 desc);

    IERC20 public token;

    constructor(address token_) public {
        token = IERC20(token_);
    }

    function addFunds(address customer, uint256 amount, bytes32 desc) public onlyAdmin {
        token.transfer(customer, amount);
        emit AddFunds(customer, amount, desc);
    }

    function cancelAddFunds(uint256 amount, bytes32 desc) public {
        token.transferFrom(msg.sender, address(this), amount);
        emit CancelAddFunds(msg.sender, amount, desc);
    }

    function payCharge(uint256 amount, bytes32 desc) public {
        token.transferFrom(msg.sender, address(this), amount);
        emit Payment(msg.sender, amount, desc);
    }

    function cancelPayment(address customer, uint256 amount, bytes32 desc) public onlyAdmin {
        token.transfer(customer, amount);
        emit CancelPayment(customer, amount, desc);
    }

    function reward(address customer, uint256 amount, bytes32 desc) public onlyAdmin {
        token.transfer(customer, amount);
        emit Reward(customer, amount, desc);
    }

    function batchReward(address[] memory customer, uint256[] memory amount, bytes32[] memory desc) public onlyAdmin {
        require(customer.length == amount.length && customer.length == desc.length, "array length mismatch");

        for (uint256 i = 0; i < customer.length; i++) {
            token.transfer(customer[i], amount[i]);
            emit Reward(customer[i], amount[i], desc[i]);
        }
    }
}
