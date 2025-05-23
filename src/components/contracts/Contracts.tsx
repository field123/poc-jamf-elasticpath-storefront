"use client";

import { useEffect, useState } from "react";
import {
  formatIsoDateString,
  formatIsoTimeString,
} from "../../lib/format-iso-date-string";
import { AccountMemberCredential } from "../../app/(auth)/account-member-credentials-schema";
import { getAllActiveContracts } from "../../app/(checkout)/create-quote/contracts-service";
import clsx from "clsx";
import Link from "next/link";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  updateCartWithContract,
  removeContractFromCart,
  getCurrentCartContract,
} from "./actions";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { StatusButton } from "../button/StatusButton";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "../../react-shopper-hooks";
import { Dialog } from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function Contracts() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null,
  );
  const [contractApplied, setContractApplied] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "select" | "remove";
    contractId?: string;
  } | null>(null);
  const queryClient = useQueryClient();
  const { state } = useCart() as any;
  const hasCartItems = state?.items?.length > 0;

  console.log("contracts", selectedContractId);

  // Fetch contracts and current cart contract
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get contracts
        const response = await getAllActiveContracts();
        if (response?.data) {
          setContracts(response.data);
        }

        // Get current cart contract
        const cartContract = await getCurrentCartContract();
        if (cartContract.success) {
          setSelectedContractId(cartContract.contractId);
          setContractApplied(cartContract.contractApplied || false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getContractStatus = (contract: any) => {
    const now = new Date();
    const startDate = new Date(contract.start_date);
    const endDate = contract.end_date ? new Date(contract.end_date) : null;

    if (endDate && now > endDate) {
      return "Expired";
    } else if (now < startDate) {
      return "Pending";
    } else {
      return "Active";
    }
  };

  const initiateContractAction = (
    type: "select" | "remove",
    contractId?: string,
  ) => {
    if (hasCartItems) {
      setPendingAction({ type, contractId });
      setShowConfirmation(true);
    } else {
      if (type === "select" && contractId) {
        handleSelectContract(contractId);
      } else if (type === "remove") {
        handleRemoveContract();
      }
    }
  };

  const handleSelectContract = async (contractId: string) => {
    setActionLoading(true);
    setShowConfirmation(false);
    try {
      const result = await updateCartWithContract(contractId);
      if (result.success) {
        setSelectedContractId(contractId);
        setContractApplied(true);
        toast.success("Now shopping with contract successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to shop with contract");
      }
    } catch (error) {
      console.error("Error selecting contract:", error);
      toast.error("Failed to shop with contract");
    } finally {
      queryClient.invalidateQueries({
        queryKey: ["contract", "active-contract"],
      });
      setActionLoading(false);
    }
  };

  const handleRemoveContract = async () => {
    setActionLoading(true);
    setShowConfirmation(false);
    try {
      const result = await removeContractFromCart();
      if (result.success) {
        setSelectedContractId(null);
        setContractApplied(false);
        toast.success("No longer shopping with contract");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to stop shopping with contract");
      }
    } catch (error) {
      console.error("Error removing contract:", error);
      toast.error("Failed to stop shopping with contract");
    } finally {
      queryClient.invalidateQueries({
        queryKey: ["contract", "active-contract"],
      });
      setActionLoading(false);
    }
  };

  const confirmAction = () => {
    if (!pendingAction) return;

    if (pendingAction.type === "select" && pendingAction.contractId) {
      handleSelectContract(pendingAction.contractId);
    } else if (pendingAction.type === "remove") {
      handleRemoveContract();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row flex-1 self-stretch">
      <div className="flex justify-center self-stretch items-start gap-2 flex-only-grow">
        <div className="flex flex-col gap-10 p-5 lg:p-24 w-full">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-medium">Contract Terms</h1>
          </div>

          {/* Confirmation Dialog */}
          <Dialog
            open={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            className="relative z-50"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-medium text-gray-900">
                      {pendingAction?.type === "select"
                        ? "Switch to different contract?"
                        : "Stop shopping with contract?"}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm text-gray-500">
                      You have items in your cart. Changing contracts may affect
                      pricing and could impact the availability of some
                      products.
                    </Dialog.Description>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => setShowConfirmation(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={confirmAction}
                      >
                        {pendingAction?.type === "select"
                          ? "Switch Contract"
                          : "Stop Shopping"}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center mt-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No contracts found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don&apos;t have any contracts associated with your account.
              </p>
            </div>
          ) : (
            <div className="mt-8 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Contract Name
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Start Date
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            End Date
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Created
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {contracts.map((contract) => {
                          const status = getContractStatus(contract);
                          const isSelected =
                            selectedContractId === contract.contract_ref;
                          const isActive = status === "Active";

                          return (
                            <tr
                              key={contract.contract_ref}
                              className={clsx(
                                "hover:bg-gray-200",
                                isSelected && "bg-blue-50",
                              )}
                            >
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                <div className="flex items-center space-x-2">
                                  <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                  <span>
                                    {contract.display_name ||
                                      `Contract ${contract.contract_ref.substring(0, 8)}`}
                                  </span>
                                  {isSelected && (
                                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                  )}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {formatIsoDateString(contract.start_date)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {contract.end_date ? (
                                  formatIsoDateString(contract.end_date)
                                ) : (
                                  <span className="text-gray-400">
                                    No end date
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <div>
                                  {formatIsoDateString(
                                    contract.meta?.timestamps?.created_at,
                                  )}
                                </div>
                                <div className="mt-1 text-xs leading-5 text-gray-500">
                                  {formatIsoTimeString(
                                    contract.meta?.timestamps?.created_at,
                                  )}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <span
                                  className={clsx(
                                    status === "Active"
                                      ? "bg-green-50 text-green-700 ring-green-600/20"
                                      : status === "Expired"
                                        ? "bg-red-50 text-red-700 ring-red-600/20"
                                        : "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
                                    "uppercase inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                  )}
                                >
                                  {status}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 space-y-2">
                                <div className="flex space-x-2">
                                  <Link
                                    href={`/contracts/${contract.contract_ref}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    View Details
                                  </Link>
                                  {isActive && (
                                    <>
                                      {isSelected ? (
                                        <button
                                          onClick={() =>
                                            initiateContractAction("remove")
                                          }
                                          disabled={actionLoading}
                                          className="text-red-600 hover:text-red-800 font-medium ml-2 disabled:opacity-50"
                                        >
                                          Stop Shopping
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            initiateContractAction(
                                              "select",
                                              contract.contract_ref,
                                            )
                                          }
                                          disabled={actionLoading}
                                          className="text-green-600 hover:text-green-800 font-medium ml-2 disabled:opacity-50"
                                        >
                                          Shop with Contract
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
