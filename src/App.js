import { useState, useEffect } from "react";
import { Biconomy } from "@biconomy/mexa";
import { ethers } from "ethers";

import ISuperfluid from "@superfluid-finance/ethereum-contracts/build/contracts/ISuperfluid.json"
import IConstantFlowAgreementV1 from "@superfluid-finance/ethereum-contracts/build/contracts/IConstantFlowAgreementV1.json"

const MUMBAI_SF_HOST_ADDRESS = "0xEB796bdb90fFA0f28255275e16936D25d3418603"
const MUMBAI_CFAV1_ADDRESS = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873"
const MUMBAI_fDAIx_ADDRESS = "0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f" // token
const OPERATOR_ADDRESS = "0x614539062F7205049917e03ec4C86FF808F083cb" // any EOA address that is not the sender

const MUMBAI_BICONOMY_FORWARDER_ADDRESS = "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b" // "0x5E7Cd3B22701b93D2972914eBF55EB98CB6D66dc"
// const MUMBAI_PART_OF_BICONOMY_FORWARDER_ABI = [{ "inputs": [{ "components": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "txGas", "type": "uint256" }, { "internalType": "uint256", "name": "tokenGasPrice", "type": "uint256" }, { "internalType": "uint256", "name": "batchId", "type": "uint256" }, { "internalType": "uint256", "name": "batchNonce", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct ERC20ForwardRequestTypes.ERC20ForwardRequest", "name": "req", "type": "tuple" }, { "internalType": "bytes", "name": "sig", "type": "bytes" }], "name": "executePersonalSign", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }, { "internalType": "bytes", "name": "ret", "type": "bytes" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "uint256", "name": "batchId", "type": "uint256" }], "name": "getNonce", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "txGas", "type": "uint256" }, { "internalType": "uint256", "name": "tokenGasPrice", "type": "uint256" }, { "internalType": "uint256", "name": "batchId", "type": "uint256" }, { "internalType": "uint256", "name": "batchNonce", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct ERC20ForwardRequestTypes.ERC20ForwardRequest", "name": "req", "type": "tuple" }, { "internalType": "bytes", "name": "sig", "type": "bytes" }], "name": "verifyPersonalSign", "outputs": [], "stateMutability": "view", "type": "function" }]
const MUMBAI_BICONOMY_FORWARDER_ABI = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "domainSeparator", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "domainValue", "type": "bytes" }], "name": "DomainRegistered", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "userAddress", "type": "address" }, { "indexed": true, "internalType": "address", "name": "relayerAddress", "type": "address" }, { "indexed": true, "internalType": "bytes", "name": "functionSignature", "type": "bytes" }], "name": "MetaTransactionExecuted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "inputs": [], "name": "EIP712_DOMAIN_TYPE", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "REQUEST_TYPEHASH", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "domains", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "txGas", "type": "uint256" }, { "internalType": "uint256", "name": "tokenGasPrice", "type": "uint256" }, { "internalType": "uint256", "name": "batchId", "type": "uint256" }, { "internalType": "uint256", "name": "batchNonce", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct ForwardRequestTypes.ERC20ForwardRequest", "name": "req", "type": "tuple" }, { "internalType": "bytes32", "name": "domainSeparator", "type": "bytes32" }, { "internalType": "bytes", "name": "sig", "type": "bytes" }], "name": "executeEIP712", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }, { "internalType": "bytes", "name": "ret", "type": "bytes" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "txGas", "type": "uint256" }, { "internalType": "uint256", "name": "tokenGasPrice", "type": "uint256" }, { "internalType": "uint256", "name": "batchId", "type": "uint256" }, { "internalType": "uint256", "name": "batchNonce", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct ForwardRequestTypes.ERC20ForwardRequest", "name": "req", "type": "tuple" }, { "internalType": "bytes", "name": "sig", "type": "bytes" }], "name": "executePersonalSign", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }, { "internalType": "bytes", "name": "ret", "type": "bytes" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "uint256", "name": "batchId", "type": "uint256" }], "name": "getNonce", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "version", "type": "string" }], "name": "registerDomainSeparator", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "txGas", "type": "uint256" }, { "internalType": "uint256", "name": "tokenGasPrice", "type": "uint256" }, { "internalType": "uint256", "name": "batchId", "type": "uint256" }, { "internalType": "uint256", "name": "batchNonce", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct ForwardRequestTypes.ERC20ForwardRequest", "name": "req", "type": "tuple" }, { "internalType": "bytes32", "name": "domainSeparator", "type": "bytes32" }, { "internalType": "bytes", "name": "sig", "type": "bytes" }], "name": "verifyEIP712", "outputs": [], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "address", "name": "token", "type": "address" }, { "internalType": "uint256", "name": "txGas", "type": "uint256" }, { "internalType": "uint256", "name": "tokenGasPrice", "type": "uint256" }, { "internalType": "uint256", "name": "batchId", "type": "uint256" }, { "internalType": "uint256", "name": "batchNonce", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "internalType": "struct ForwardRequestTypes.ERC20ForwardRequest", "name": "req", "type": "tuple" }, { "internalType": "bytes", "name": "sig", "type": "bytes" }], "name": "verifyPersonalSign", "outputs": [], "stateMutability": "view", "type": "function" }]
const MUMBAI_HASHER_ADDRESS = "0xabF9893851D2aA7078575274848307247c6F34c7"
const MUMBAI_HASHER_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_to",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "_token",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_txGas",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_tokenGasPrice",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_batchId",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_batchNonce",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_deadline",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "_data",
                "type": "bytes"
            }
        ],
        "name": "getMessageHash",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes",
                "name": "_data",
                "type": "bytes"
            }
        ],
        "name": "hashWithKeccak256",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "pure",
        "type": "function"
    }
]

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
    const [sfContract, setSFContract] = useState(null)

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

                const sfContract = new ethers.Contract(
                    MUMBAI_SF_HOST_ADDRESS,
                    ISuperfluid.abi,
                    walletSigner,
                )
                const cfav1Contract = new ethers.Contract(
                    MUMBAI_CFAV1_ADDRESS,
                    IConstantFlowAgreementV1.abi,
                    walletSigner,
                )
                setSFContract(sfContract)
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
        // const callData = callAgreement(data)

        // Additional setup required by SF ******
        const forwardCallData = sfInterface.encodeFunctionData("forwardBatchCall", [
            [
                [
                    201, // operation type, sf specific
                    MUMBAI_CFAV1_ADDRESS,
                    data, //callData,
                ],
            ]
        ])

        // Suggestion from the SF Team
        const biconomyForwarderInterface = new ethers.utils.Interface(MUMBAI_BICONOMY_FORWARDER_ABI);
        const biconomyForwarderContract = new ethers.Contract(
            MUMBAI_BICONOMY_FORWARDER_ADDRESS,
            MUMBAI_BICONOMY_FORWARDER_ABI,
            signer,
        )

        const hasherContract = new ethers.Contract(
            MUMBAI_HASHER_ADDRESS,
            MUMBAI_HASHER_ABI,
            signer,
        )

        // // GAS ESTIMATES
        // const estimatedGasUpdateFlow = await cfav1Contract.estimateGas.updateFlowOperatorPermissions(
        //     MUMBAI_fDAIx_ADDRESS,
        //     OPERATOR_ADDRESS,
        //     "4", // grants operator the delete permission (example only)
        //     "0", // flow allowance is 0 for delete permission
        //     [], // empty
        // )
        // const estimatedGasRevokeFlow = cfav1Contract.estimateGas.revokeFlowOperatorWithFullControl(
        //     MUMBAI_fDAIx_ADDRESS,
        //     OPERATOR_ADDRESS,
        //     [], // empty
        // )
        // const estimatedGasCallAgreement = sfContract.estimateGas.callAgreement(
        //     MUMBAI_CFAV1_ADDRESS,
        //     data,
        //     "0x", // userData is empty
        // )
        // const estimatedGasForwardCall = await sfContract.estimateGas.forwardBatchCall(
        //     [
        //         [
        //             201, // operation type, sf specific
        //             MUMBAI_SF_HOST_ADDRESS,
        //             callData,
        //         ],
        //     ]
        // )
        // console.log("GAS ESTIMATES")
        // console.log(estimatedGasUpdateFlow)
        // console.log(estimatedGasRevokeFlow)
        // console.log(estimatedGasCallAgreement)
        // console.log(estimatedGasForwardCall)

        const token = ethers.constants.AddressZero // is only used if you want to collect gas fees in an ERC20
        const txGas = "9000000000000000" // is how much gas (in wei) you're going to forward to the Host contract
        const tokenGasPrice = "0" // is only used if you want to collect fees in an ERC20
        const batchId = "0" // can be always zero
        const batchNonce = (await biconomyForwarderContract.getNonce(selectedAddress, batchId)).toString()

        const now = Math.floor(new Date().getTime() / 1000.0)
        const minutesFromNow = 20
        const deadline = (now + (minutesFromNow * 60)).toString()

        // const hashedData = await hasherContract.hashWithKeccak256(forwardCallData)

        const hash = await hasherContract.getMessageHash(
            selectedAddress,
            MUMBAI_SF_HOST_ADDRESS,
            token,
            txGas,
            tokenGasPrice,
            batchId,
            batchNonce,
            deadline,
            forwardCallData, //hashedData,
        )
        const signature = await signer.signMessage(ethers.utils.arrayify(hash))

        const biconomyForwarderData = biconomyForwarderInterface.encodeFunctionData("executePersonalSign", [
            [
                selectedAddress,
                MUMBAI_SF_HOST_ADDRESS,
                token,
                txGas,
                tokenGasPrice,
                batchId,
                batchNonce,
                deadline,
                forwardCallData, //hashedData,
            ],
            signature
        ])

        // const biconomyForwarderData = biconomyForwarderInterface.encodeFunctionData("verifyPersonalSign", [
        //     [
        //         selectedAddress,
        //         MUMBAI_SF_HOST_ADDRESS,
        //         token,
        //         txGas,
        //         tokenGasPrice,
        //         batchId,
        //         batchNonce,
        //         deadline,
        //         hashedData,
        //     ],
        //     signature
        // ])

        const txParams = {
            data: biconomyForwarderData,
            to: MUMBAI_BICONOMY_FORWARDER_ADDRESS,
            from: selectedAddress,
            gasLimit: "9000000000000000",
        };

        // Switch provider from normal to Biconomy ******
        let tx
        try
        {
            tx = await biconomyProvider.send("eth_sendTransaction", [txParams])
        } catch (error)
        {
            console.error(error)
        }

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

                    <p>---------------------------------</p>
                    <p>testing SF suggestions, click:</p>
                    <button
                        onClick={ async () =>
                        {
                            await runBiconomyFlowWithSFSuggestions(grantPermission)
                        } }
                    >
                        runBiconomyFlowWithSFSuggestions
                    </button>
                    <p>after signing the transaction, it hits the error:</p>
                    <p style={ { color: "red" } }>Fail with error 'Forwarded call to destination did not succeed'</p>
                    <p>
                        There is another issue, the `runBiconomyFlowWithSFSuggestions` method requires the user the spent gas which defeats the purpose of
                        Biconomy meta txs. Any comments on this?
                    </p>
                </div >
            ) : (
                <div>loading...</div>
            )
            }
        </div >
    );
}

export default App;
