import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { UUPSBoxV1, UUPSBoxV2 } from "../typechain-types";

describe("UUPSBox Upgrade", function () {
    let boxV1: UUPSBoxV1;
    let boxV2: UUPSBoxV2;

    beforeEach(async function () {
        // Clear any previous state if necessary, though hardhat-network resets usually handle this
    });

    it("Should deploy UUPSBoxV1 and initialize correctly", async function () {
        const BoxV1Factory = await ethers.getContractFactory("UUPSBoxV1");
        // Deploy proxy
        boxV1 = (await upgrades.deployProxy(BoxV1Factory, [42], {
            initializer: "initialize",
        })) as unknown as UUPSBoxV1;
        await boxV1.waitForDeployment();

        expect(await boxV1.value()).to.equal(42);
        expect(await boxV1.name()).to.equal("UUPS_Box");
        expect(await boxV1.version()).to.equal("V1");
    });

    it("Should upgrade to UUPSBoxV2 and preserve state", async function () {
        // 1. Deploy V1
        const BoxV1Factory = await ethers.getContractFactory("UUPSBoxV1");
        boxV1 = (await upgrades.deployProxy(BoxV1Factory, [42], {
            initializer: "initialize",
        })) as unknown as UUPSBoxV1;
        await boxV1.waitForDeployment();

        const proxyAddress = await boxV1.getAddress();

        // 2. Upgrade to V2
        const BoxV2Factory = await ethers.getContractFactory("UUPSBoxV2");
        boxV2 = (await upgrades.upgradeProxy(proxyAddress, BoxV2Factory)) as unknown as UUPSBoxV2;
        await boxV2.waitForDeployment();

        // 3. Verify Address is same
        expect(await boxV2.getAddress()).to.equal(proxyAddress);

        // 4. Verify State Preserved
        expect(await boxV2.value()).to.equal(42);
        expect(await boxV2.name()).to.equal("UUPS_Box");

        // 5. Verify New Functionality
        expect(await boxV2.version()).to.equal("V2");

        await boxV2.increment();
        expect(await boxV2.value()).to.equal(43);

        await boxV2.setUpgradeTime();
        const lastUpgradeTime = await boxV2.lastUpgradeTime();
        expect(lastUpgradeTime).to.be.gt(0);
    });
});
