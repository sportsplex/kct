const BN = require('bignumber.js');
require('chai')
  .use(require('chai-as-promised'))
  .use(require('bn-chai')(BN))
  .should();

const Token = artifacts.require('Token');
const Oracle = artifacts.require('Oracle');
const Sportsplex = artifacts.require('Sportsplex');


contract('oracle', accounts => {
    let oracle;
    let sportsplex;
    let token;
    const desc = '0x46cb93b6d0e029a0d1d5cbf35972696bff8bad04f3855dcef16719427fdce1ef';

    const [
        owner,
        admin,
        anonymous,
        eoa0,
        eoa1,
        eoa2,
        eoa3
    ] = accounts;

    before(async () => {
        oracle = await Oracle.new({from: owner});
        sportsplex = await Sportsplex.at(await oracle.sportsplex());
        token = await Token.at(await oracle.token());
        await oracle.addAdmin(admin, {from: owner});
        await token.approve(await oracle.address, BN(10).pow(18), {from: eoa2});
    });

    it('erc20 specifications', async () => {
        (await token.name()).should.be.equal('SportsplexToken');
        (await token.symbol()).should.be.equal('SPX');
        (await token.decimals()).should.eq.BN(8);
        (await token.totalSupply()).should.eq.BN(BN(10).pow(17));
    });

    it('initial token distribution', async () => {
        const totalSupply = BN(await token.totalSupply());
        (await token.balanceOf(await oracle.address)).should.be.eq.BN(totalSupply);
    });

    it('transfer ownership', async () => {
        (await oracle.owner()).should.be.equal(owner);
        await oracle.transferOwnership(anonymous, {from:anonymous}).should.be.rejected;
        await oracle.transferOwnership(eoa0, {from:owner}).should.be.fulfilled;
        (await oracle.owner()).should.be.equal(eoa0);

        const r0 = await oracle.transferOwnership(owner, {from: eoa0}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('RemoveAdmin');
        r0.logs[1].event.should.be.equal('AddAdmin');
        r0.logs[2].event.should.be.equal('TransferOwnership');
        r0.logs[2].args.__length__.should.be.equal(2);
        r0.logs[2].args.previousOwner.should.be.equal(eoa0);
        r0.logs[2].args.newOwner.should.be.equal(owner);
    });

    it('addAdmin', async () => {
        (await oracle.isAdmin(eoa1)).should.be.equal(false);
        await oracle.addAdmin(eoa1, {from: anonymous}).should.be.rejected;
        await oracle.addAdmin(eoa1, {from: owner}).should.be.fulfilled;
        (await oracle.isAdmin(eoa1)).should.be.equal(true);

        const r0 = await oracle.addAdmin(eoa2, {from: owner}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('AddAdmin');
        r0.logs[0].args.__length__.should.be.equal(1);
        r0.logs[0].args.admin.should.be.equal(eoa2);
    });

    it('removeAdmin', async () => {
        (await oracle.isAdmin(eoa1)).should.be.equal(true);
        await oracle.removeAdmin(eoa1, {from: anonymous}).should.be.rejected;
        await oracle.removeAdmin(eoa1, {from: owner}).should.be.fulfilled;
        (await oracle.isAdmin(eoa1)).should.be.equal(false);

        const r0 = await oracle.removeAdmin(eoa2, {from: owner}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('RemoveAdmin');
        r0.logs[0].args.__length__.should.be.equal(1);
        r0.logs[0].args.admin.should.be.equal(eoa2);
    });

    it('deposit', async () => {
        const b0 = BN(await token.balanceOf(eoa2));
        const b1 = BN(await token.balanceOf(await oracle.address));

        const m0 = BN(1000);
        await oracle.deposit(eoa1, eoa2, m0, desc, {from: anonymous}).should.be.rejected;
        await oracle.deposit(eoa1, eoa2, m0, desc, {from: admin}).should.be.fulfilled;
        (await token.balanceOf(eoa2)).should.eq.BN(b0.plus(m0));
        (await token.balanceOf(await oracle.address)).should.eq.BN(b1.minus(m0));

        const r0 = await oracle.deposit(eoa1, eoa2, m0, desc, {from: admin}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('Deposit');
        r0.logs[0].args.__length__.should.be.equal(4);
        r0.logs[0].args.from.should.be.equal(eoa1);
        r0.logs[0].args.to.should.be.equal(eoa2);
        r0.logs[0].args.amount.should.eq.BN(m0);
        r0.logs[0].args.desc.should.be.equal(desc);
    });

    it('withdraw', async () => {
        const b0 = BN(await token.balanceOf(eoa2));
        const b1 = BN(await token.balanceOf(await oracle.address));

        const m0 = BN(100);
        await oracle.withdraw(eoa1, m0, desc, {from: eoa2}).should.be.fulfilled;
        (await token.balanceOf(eoa2)).should.eq.BN(b0.minus(m0));
        (await token.balanceOf(await oracle.address)).should.eq.BN(b1.plus(m0));

        const r0 = await oracle.withdraw(eoa1, m0, desc, {from: eoa2}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('Withdraw');
        r0.logs[0].args.__length__.should.be.equal(4);
        r0.logs[0].args.from.should.be.equal(eoa2);
        r0.logs[0].args.to.should.be.equal(eoa1);
        r0.logs[0].args.amount.should.eq.BN(m0);
        r0.logs[0].args.desc.should.be.equal(desc);
    });

    it('raise capital', async () => {
        const b0 = BN(await token.balanceOf(await sportsplex.address));
        const b1 = BN(await token.balanceOf(await oracle.address));

        const m0 = BN(10).pow(15);
        await oracle.raiseCapital(eoa3, m0, desc, {from: anonymous}).should.be.rejected;
        await oracle.raiseCapital(eoa3, m0, desc, {from: admin}).should.be.fulfilled;
        (await token.balanceOf(await sportsplex.address)).should.eq.BN(b0.plus(m0));
        (await token.balanceOf(await oracle.address)).should.eq.BN(b1.minus(m0));

        const r0 = await oracle.raiseCapital(eoa3, m0, desc, {from: admin}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('RaiseCapital');
        r0.logs[0].args.__length__.should.be.equal(3);
        r0.logs[0].args.from.should.be.equal(eoa3);
        r0.logs[0].args.amount.should.eq.BN(m0);
        r0.logs[0].args.desc.should.be.equal(desc);
    });
});

contract('sportsplex', accounts => {
    let sportsplex;
    let token;
    const desc = '0x46cb93b6d0e029a0d1d5cbf35972696bff8bad04f3855dcef16719427fdce1ef';

    const [
        owner,
        admin,
        anonymous,
        eoa0
    ] = accounts;

    before(async () => {
        const oracle = await Oracle.new({from: owner});
        sportsplex = await Sportsplex.at(await oracle.sportsplex());
        token = await Token.at(await oracle.token());
        await sportsplex.addAdmin(admin, {from: owner});
        await oracle.raiseCapital(eoa0, BN(10).pow(15), desc, {from: owner});
        await token.approve(await sportsplex.address, BN(10).pow(18), {from: eoa0});
    });

    it('add funds', async () => {
        const b0 = BN(await token.balanceOf(eoa0));
        const b1 = BN(await token.balanceOf(await sportsplex.address));

        const m0 = BN(1000);
        await sportsplex.addFunds(eoa0, m0, desc, {from: anonymous}).should.be.rejected;
        await sportsplex.addFunds(eoa0, m0, desc, {from: admin}).should.be.fulfilled;
        (await token.balanceOf(eoa0)).should.eq.BN(b0.plus(m0));
        (await token.balanceOf(await sportsplex.address)).should.eq.BN(b1.minus(m0));

        const r0 = await sportsplex.addFunds(eoa0, m0, desc, {from: admin}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('AddFunds');
        r0.logs[0].args.__length__.should.be.equal(3);
        r0.logs[0].args.customer.should.be.equal(eoa0);
        r0.logs[0].args.amount.should.eq.BN(m0);
        r0.logs[0].args.desc.should.be.equal(desc);
    });

    it('cancel add funds', async () => {
        const b0 = BN(await token.balanceOf(eoa0));
        const b1 = BN(await token.balanceOf(await sportsplex.address));

        const m0 = BN(100);
        await sportsplex.cancelAddFunds(m0, desc, {from: eoa0}).should.be.fulfilled;
        (await token.balanceOf(eoa0)).should.eq.BN(b0.minus(m0));
        (await token.balanceOf(await sportsplex.address)).should.eq.BN(b1.plus(m0));

        const r0 = await sportsplex.cancelAddFunds(m0, desc, {from: eoa0}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('CancelAddFunds');
        r0.logs[0].args.__length__.should.be.equal(3);
        r0.logs[0].args.customer.should.be.equal(eoa0);
        r0.logs[0].args.amount.should.eq.BN(m0);
        r0.logs[0].args.desc.should.be.equal(desc);
    });

    it('pay charge', async () => {
        const b0 = BN(await token.balanceOf(eoa0));
        const b1 = BN(await token.balanceOf(await sportsplex.address));

        const m0 = BN(10);
        await sportsplex.payCharge(m0, desc, {from: eoa0}).should.be.fulfilled;
        (await token.balanceOf(eoa0)).should.eq.BN(b0.minus(m0));
        (await token.balanceOf(await sportsplex.address)).should.eq.BN(b1.plus(m0));

        const r0 = await sportsplex.payCharge(m0, desc, {from: eoa0}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('Payment');
        r0.logs[0].args.__length__.should.be.equal(3);
        r0.logs[0].args.customer.should.be.equal(eoa0);
        r0.logs[0].args.amount.should.eq.BN(m0);
        r0.logs[0].args.desc.should.be.equal(desc);
    });

    it('cancel payment', async () => {
        const b0 = BN(await token.balanceOf(eoa0));
        const b1 = BN(await token.balanceOf(await sportsplex.address));

        const m0 = BN(10);
        await sportsplex.cancelPayment(eoa0, m0, desc, {from: anonymous}).should.be.rejected;
        await sportsplex.cancelPayment(eoa0, m0, desc, {from: admin}).should.be.fulfilled;
        (await token.balanceOf(eoa0)).should.eq.BN(b0.plus(m0));
        (await token.balanceOf(await sportsplex.address)).should.eq.BN(b1.minus(m0));

        const r0 = await sportsplex.cancelPayment(eoa0, m0, desc, {from: admin}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('CancelPayment');
        r0.logs[0].args.__length__.should.be.equal(3);
        r0.logs[0].args.customer.should.be.equal(eoa0);
        r0.logs[0].args.amount.should.eq.BN(m0);
        r0.logs[0].args.desc.should.be.equal(desc);
    });

    it('reward', async () => {
        const b0 = BN(await token.balanceOf(eoa0));
        const b1 = BN(await token.balanceOf(await sportsplex.address));

        const m0 = BN(1000);
        await sportsplex.reward(eoa0, m0, desc, {from: anonymous}).should.be.rejected;
        await sportsplex.reward(eoa0, m0, desc, {from: admin}).should.be.fulfilled;
        (await token.balanceOf(eoa0)).should.eq.BN(b0.plus(m0));
        (await token.balanceOf(await sportsplex.address)).should.eq.BN(b1.minus(m0));

        const r0 = await sportsplex.reward(eoa0, m0, desc, {from: admin}).should.be.fulfilled;
        r0.logs[0].event.should.be.equal('Reward');
        r0.logs[0].args.__length__.should.be.equal(3);
        r0.logs[0].args.customer.should.be.equal(eoa0);
        r0.logs[0].args.amount.should.eq.BN(m0);
        r0.logs[0].args.desc.should.be.equal(desc);
    });

    it('batch reward', async () => {
        await sportsplex.batchReward(
            accounts,
            Array(accounts.length).fill(BN(100)),
            Array(accounts.length).fill(desc)
        ).should.be.fulfilled;
    });
});
