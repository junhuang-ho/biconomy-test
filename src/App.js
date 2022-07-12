import { useState, useEffect } from "react";
import { Biconomy } from "@biconomy/mexa";
import { ethers } from "ethers";

import ISuperfluid from "@superfluid-finance/ethereum-contracts/build/contracts/ISuperfluid.json"
import IConstantFlowAgreementV1 from "@superfluid-finance/ethereum-contracts/build/contracts/IConstantFlowAgreementV1.json"

const MUMBAI_SF_HOST_ADDRESS = "0xEB796bdb90fFA0f28255275e16936D25d3418603"
const MUMBAI_CFAV1_ADDRESS = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873"
const MUMBAI_fDAIx_ADDRESS = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f" // token
const OPERATOR_ADDRESS = "0x614539062F7205049917e03ec4C86FF808F083cb" // any EOA address that is not the sender

function App()
{

    const [biconomy, setBiconomy] = useState(null)
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [normalProvider, setNormalProvider] = useState(null)
    const [biconomyProvider, setBiconomyProvider] = useState(null)
    const [signer, setSigner] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [refresh, setRefresh] = useState(false)
    const [operatorPermission, setOperatorPermission] = useState(0)

    const [sfInterface, setSFInterface] = useState(null)
    const [cfav1Interface, setCFAV1Interface] = useState(null)
    const [cfav1Contract, setCFAV1Contract] = useState(null)

    useEffect(() =>
    {
        const init = async () =>
        {
            const provider = window["ethereum"];
            await provider.enable();

            const jsonRpcProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_ALCHEMY_RPC_URL_MUMBAI)
            const biconomy = new Biconomy(jsonRpcProvider, {
                walletProvider: window.ethereum,
                apiKey: process.env.REACT_APP_BICONOMY_API_KEY,
                debug: false
            });

            const walletProvider = new ethers.providers.Web3Provider(window.ethereum);
            setNormalProvider(walletProvider)
            const walletSigner = walletProvider.getSigner();
            setSigner(walletSigner)

            setSelectedAddress(await walletSigner.getAddress());

            biconomy.onEvent(biconomy.READY, () =>
            {
                const sfInterface = new ethers.utils.Interface(ISuperfluid.abi);
                const cfav1Interface = new ethers.utils.Interface(IConstantFlowAgreementV1.abi);

                setSFInterface(sfInterface)
                setCFAV1Interface(cfav1Interface)

                const cfav1Contract = new ethers.Contract(
                    MUMBAI_CFAV1_ADDRESS,
                    IConstantFlowAgreementV1.abi,
                    walletSigner,
                )
                setCFAV1Contract(cfav1Contract)

                setBiconomyProvider(biconomy.getEthersProvider())
                setBiconomy(biconomy)
            }).onEvent(biconomy.ERROR, (error, message) =>
            {
                console.error(error)
                console.error(message)
            });
        }

        if (
            typeof window.ethereum !== "undefined" &&
            window.ethereum.isMetaMask
        )
        {
            init()
        } else
        {
            console.warn("MetaMask not installed")
        }

    }, [window.ethereum.isMetaMask])

    const getLatestPermission = async () =>
    {
        const info = await getOperatorData()
        setOperatorPermission(info.permissions)
    }

    useEffect(() =>
    {
        if (cfav1Contract && selectedAddress)
        {
            getLatestPermission()
        }
    }, [cfav1Contract, selectedAddress, refresh])

    const getOperatorData = async () =>
    {
        const operatorInfo = await cfav1Contract.getFlowOperatorData(
            MUMBAI_fDAIx_ADDRESS,
            selectedAddress,
            OPERATOR_ADDRESS,
        )
        return operatorInfo
    }

    const grantPermission = () =>
    {
        const grantData = cfav1Interface.encodeFunctionData("updateFlowOperatorPermissions", [
            MUMBAI_fDAIx_ADDRESS,
            OPERATOR_ADDRESS,
            "4", // grants operator the delete permission (example only)
            "0", // flow allowance is 0 for delete permission
            [], // empty
        ])
        return grantData
    }

    const revokePermission = () =>
    {
        const revokeData = cfav1Interface.encodeFunctionData("revokeFlowOperatorWithFullControl", [
            MUMBAI_fDAIx_ADDRESS,
            OPERATOR_ADDRESS,
            [], // empty
        ])
        return revokeData
    }

    const callAgreement = (calldata) =>
    {
        const callAgreementData = sfInterface.encodeFunctionData("callAgreement", [
            MUMBAI_CFAV1_ADDRESS,
            calldata,
            "0x", // userData is empty
        ])

        return callAgreementData
    }

    const runNormalFlow = async (fn) =>
    {
        setIsProcessing(true)

        const data = fn() // grant or revoke
        const callData = callAgreement(data)

        const txParams = {
            data: callData,
            to: MUMBAI_SF_HOST_ADDRESS,
            from: selectedAddress,
        };
        const tx = await normalProvider.send("eth_sendTransaction", [txParams])
        normalProvider.once(tx, (transaction) =>
        { // Emitted when the transaction has been mined
            setRefresh(!refresh)
            console.log("Transaction confirmed on chain");
            console.log(transaction);
        })

        setIsProcessing(false)
    }

    const runBiconomyFlow = async (fn) =>
    {
        setIsProcessing(true)

        const data = fn() // grant or revoke
        const callData = callAgreement(data)

        // Additional setup required by SF ******
        const forwardCallData = sfInterface.encodeFunctionData("forwardBatchCall", [
            [
                [
                    201, // operation type, sf specific
                    MUMBAI_CFAV1_ADDRESS,
                    callData,
                ],
            ]
        ])

        const txParams = {
            data: forwardCallData,
            to: MUMBAI_SF_HOST_ADDRESS,
            from: selectedAddress,
        };

        // Switch provider from normal to Biconomy ******
        const tx = await biconomyProvider.send("eth_sendTransaction", [txParams])
        biconomyProvider.once(tx, (transaction) =>
        { // Emitted when the transaction has been mined
            setRefresh(!refresh)
            console.log("Transaction confirmed on chain");
            console.log(transaction);
        })

        setIsProcessing(false)
    }

    const runBiconomyFlowWithSFSuggestions = async (fn) =>
    {
        setIsProcessing(true)

        const data = fn() // grant or revoke
        const callData = callAgreement(data)

        // Additional setup required by SF ******
        const forwardCallData = sfInterface.encodeFunctionData("forwardBatchCall", [
            [
                [
                    201, // operation type, sf specific
                    MUMBAI_CFAV1_ADDRESS,
                    callData,
                ],
            ]
        ])

        // Suggestion from the SF Team
        const biconomyForwarderInterface = new ethers.utils.Interface(/** BiconomyForwarderABI ???? */); // mumbai Biconomy Forwarder address is: 0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b
        const hash = "0x" // <how to get> // <------ ????
        const signature = await signer.signMessage(ethers.utils.arrayify(hash))
        const biconomyForwarderData = biconomyForwarderInterface.encodeFunctionData("executePersonalSign", [
            [
                "", // <ERC20ForwardRequest params> // <------ ???? https://github.com/bcnmy/mexa/blob/2f4957cd2253ef7cdfbee09c0844c9b71492034e/contracts/6/forwarder/ERC20ForwardRequestTypes.sol#L21
                "",
                forwardCallData, // the "data" param in ERC20ForwardRequest
            ],
            signature
        ])

        const txParams = {
            data: biconomyForwarderData,
            to: MUMBAI_SF_HOST_ADDRESS,
            from: selectedAddress,
        };

        // Switch provider from normal to Biconomy ******
        const tx = await biconomyProvider.send("eth_sendTransaction", [txParams])
        biconomyProvider.once(tx, (transaction) =>
        { // Emitted when the transaction has been mined
            setRefresh(!refresh)
            console.log("Transaction confirmed on chain");
            console.log(transaction);
        })

        setIsProcessing(false)
    }


    return (
        <div>
            { (selectedAddress && normalProvider && sfInterface && cfav1Interface) ? (
                <div>
                    <p>Current situation:</p>
                    <p>
                        Working in mumbai network. Using Superfluid (SF) contracts: https://www.superfluid.finance/home . In particular, accessing SF Host and Constant Flow Agreement (CFAv1) contracts.
                        We are able to make 2 contract calls, "grant" and "revoke". Grant changes the operator permission value in the contract to 4 (which means allow to "delete"). Revoke changes the operator
                        permission value in the contract to 0 (which means not allowed to "delete"). The meaning of the operator permissions are NOT important.
                    </p>
                    <p>The goal is to be able to call "grant" and "revoke" via Biconomy.</p>
                    <p>Clicking "grant/revoke - normal" buttons means sender will use their gas (ie no meta txs - so NOT using Biconomy), this works, remember to set OPERATOR_ADDRESS param in code to an address different from the sender</p>
                    <p>Clicking "grant/revoke - biconomy" buttons means going through Biconomy, this does NOT work currently and gives the error below.</p>
                    <p>----- minimum demo ------</p>
                    <p>selected address: { selectedAddress }</p>
                    <p>operator address: { OPERATOR_ADDRESS }</p>
                    <p>operator permission: </p>
                    <p style={ { color: "green" } }>{ operatorPermission }</p>
                    <p> -- if value dont automatically update after grant/revoke, click button to refresh</p>
                    <button
                        onClick={ async () =>
                        {
                            await getLatestPermission()
                        } }
                    >
                        click to refresh and get latest operator permission
                    </button>
                    <p>-----------</p>
                    <br />
                    <p>clicking any "grant" should set operator permission to 4 - only working for normal</p>
                    <button
                        disabled={ isProcessing }
                        onClick={ async () =>
                        {
                            await runNormalFlow(grantPermission)
                        } }
                    >
                        grant - normal
                    </button>
                    <br />
                    <button
                        disabled={ isProcessing }
                        onClick={ async () =>
                        {
                            await runBiconomyFlow(grantPermission)
                        } }
                    >
                        grant - biconomy
                    </button>
                    <p>clicking any "revoke" should set operator permission to 0  - only working for normal</p>
                    <button
                        disabled={ isProcessing }
                        onClick={ async () =>
                        {
                            await runNormalFlow(revokePermission)
                        } }
                    >
                        revoke - normal
                    </button>
                    <br />
                    <button
                        disabled={ isProcessing }
                        onClick={ async () =>
                        {
                            await runBiconomyFlow(revokePermission)
                        } }
                    >
                        revoke - biconomy
                    </button>
                    <p>-----------</p>
                    <br />
                    <button
                        onClick={ () =>
                        {
                            setIsProcessing(false)
                        } }
                    >
                        reset grant/revoke buttons if stuck on disabled
                    </button>
                    <p>-----------</p>
                    <p>The Issue: grant/revoke - biconomy buttons will get error</p>
                    <p style={ { color: "red" } }>Error: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (reason="execution reverted: Not trusted forwarder", method="estimateGas"</p>
                    <br />
                    <p>SF team suggested to make the changes, see the incomplete "runBiconomyFlowWithSFSuggestions" function in code</p>
                    <br />
                    <p>In general, I just need to get grant/revoke permission working via Biconomy</p>
                    <p>1. Given my error, is the SF recommendation the correct path? Is there an easier way which I do not need to interact with the Biconomy Forwarder contract directly?</p>
                    <p>If I still have to interact with the Biconomy Forwader contract then,</p>
                    <p>2. What is the full ABI for it? (mumbai)</p>
                    <p>3. In the ERC20ForwardRequest params, what is the best values for `txGas`, `tokenGasPrice`, `batchId`, `batchNonce` and `deadline`? Are these params normally done for us on the Biconomy side of things? How do I set them?</p>
                    <p>Also, I am still confused on the proper workflow for everything here, general explanations/tutorials/guides would help</p>
                </div>
            ) : (
                <div>loading...</div>
            ) }
        </div>
    );
}

export default App;
