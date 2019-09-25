pragma solidity ^0.5.0;

import "./Adminable.sol";
import "./Token.sol";
import "./Sportsplex.sol";


contract Oracle is Adminable {
    event Deposit(address indexed from, address indexed to, uint256 amount, bytes32 desc);
    event Withdraw(address indexed from, address indexed to, uint256 amount, bytes32 desc);
    event RaiseCapital(address indexed from, uint256 amount, bytes32 desc);

    Token public token;
    Sportsplex public sportsplex;

    constructor() public {
        token = new Token();
        sportsplex = new Sportsplex(address(token));
        sportsplex.transferOwnership(msg.sender);
    }

    function deposit(address from, address to, uint256 amount, bytes32 desc) public onlyAdmin {
        token.transfer(to, amount);
        emit Deposit(from, to, amount, desc);
    }

    function withdraw(address to, uint256 amount, bytes32 desc) public {
        token.transferFrom(msg.sender, address(this), amount);
        emit Withdraw(msg.sender, to, amount, desc);
    }

    function raiseCapital(address from, uint256 amount, bytes32 desc) public onlyAdmin {
        token.transfer(address(sportsplex), amount);
        emit RaiseCapital(from, amount, desc);
    }
}
