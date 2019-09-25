pragma solidity ^0.5.0;

import "./Ownable.sol";


contract Adminable is Ownable {
    event AddAdmin(address admin);
    event RemoveAdmin(address admin);

    mapping (address => bool) public isAdmin;

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "msg.sender is not admin");
        _;
    }

    constructor () internal {
        _addAdmin(owner);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        _removeAdmin(owner);
        _addAdmin(newOwner);
        super.transferOwnership(newOwner);
    }

    function addAdmin(address account) public onlyOwner {
        _addAdmin(account);
    }

    function removeAdmin(address account) public onlyOwner {
        _removeAdmin(account);
    }

    function _addAdmin(address account) internal {
        isAdmin[account] = true;
        emit AddAdmin(account);
    }

    function _removeAdmin(address account) internal {
        isAdmin[account] = false;
        emit RemoveAdmin(account);
    }
}
