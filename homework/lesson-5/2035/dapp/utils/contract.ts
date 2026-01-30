export const CONTRACT_ADDRESS = "0x5CC307268a1393AB9A764A20DACE848AB8275c46" as `0x${string}`;

export const CONTRACT_ABI = [
  {
    inputs: [{ name: "_number", type: "uint256" }],
    name: "setNumber",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "storedNumber",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "newNumber", type: "uint256" }],
    name: "NumberStored",
    type: "event",
  },
] as const;
