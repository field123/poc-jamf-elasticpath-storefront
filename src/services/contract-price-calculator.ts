"use server";

import { cookies } from "next/headers";
import { getServerSideImplicitClient } from "../lib/epcc-server-side-implicit-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../lib/retrieve-account-member-credentials";
import { getDynamicPricing } from "./add-to-cart";
import { combineProductQuantities } from "./cart-utils";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../lib/cookie-constants";
import { redirect } from "next/navigation";
import { COOKIE_PREFIX_KEY } from "../lib/resolve-cart-env";

export type PriceCalculationResponse = {
  success: boolean;
  data?: {
    price: {
      amount: number;
      currency: string;
      includes_tax?: boolean;
    };
    breakdown?: {
      basePrice: number;
      quantity: number;
      discount: number;
      totalBeforeDiscount: number;
      totalAfterDiscount: number;
      partnerPrice: number;
      totalPartnerDiscountPercentage: number;
      totalDiscounted?: number;
      listPrice: number;
      regularPrice: number;
      partnerPriceTotal: number;
      listPriceTotal: number;
      regularPriceTotal: number;
      priceTotal: number;
      proratedListPrice?: number;
      prorateMultiplier?: number;
      amendment?: {
        startDate: string;
        endDate: string;
      };
    };
  };
  error?: string;
};

/**
 * Server action to calculate price for contract items
 * This allows us to use server-side logic in client components safely
 */
export async function calculateContractItemPrice(
  productId: string,
  quantity: number,
  contractRef?: string,
): Promise<PriceCalculationResponse> {
  try {
    const client = getServerSideImplicitClient();
    const cookieStore = cookies();

    const accountMemberCookie = retrieveAccountMemberCredentials(
      cookieStore,
      ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
    );

    if (!accountMemberCookie) {
      redirect("/login?returnUrl=/checkout");
      throw new Error("No account member cookie found");
    }
    const currency = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_currency`)?.value;

    const selectedAccount = getSelectedAccount(accountMemberCookie);

    let mappedCartItems: { product_id: string; quantity: number }[] = [];
    let contractTerm = contractRef;
    if (!contractRef) {
      const cartCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_cart`);
      const cart = await client.Cart(cartCookie?.value).With("items").Get();

      if (!cart) {
        throw new Error("No cart found");
      }

      const currentCartItems = cart.included?.items ?? [];
      mappedCartItems = currentCartItems.map((item) => ({
        product_id: item.product_id ?? item.custom_inputs?.product_id,
        quantity: item.quantity,
      }));

      // @ts-ignore
      const customAttributes = cart?.data?.custom_attributes || {};

      contractTerm = customAttributes?.contract_term_id?.value;
    }

    // Combine quantities for matching products
    const combinedProducts = combineProductQuantities(
      mappedCartItems,
      productId,
      quantity ?? 1,
    );

    const resolvedDynamicPricing = await getDynamicPricing({
      contract_terms: contractTerm ?? "",
      account: selectedAccount.account_id,
      products: combinedProducts,
      currency: currency ?? "USD",
    });

    // find the product in the resolvedDynamicPricing.products array
    const product = resolvedDynamicPricing.products?.find(
      (product) => product.product_id === productId,
    );

    if (resolvedDynamicPricing.success && product) {
      return {
        success: true,
        data: {
          price: {
            amount: product.priceTotal,
            currency: currency ?? "USD",
            includes_tax: true,
          },
          breakdown: {
            basePrice: product.listPrice,
            quantity: quantity,
            discount: product.totalPartnerDiscountPercentage,
            totalBeforeDiscount: product.listPrice * quantity,
            totalAfterDiscount: product.price * quantity,
            partnerPrice: product.partnerPrice,
            totalPartnerDiscountPercentage:
              product.totalPartnerDiscountPercentage,
            totalDiscounted: product.totalDiscounted,
            listPrice: product.listPrice,
            regularPrice: product.regularPrice,
            partnerPriceTotal: product.partnerPriceTotal,
            listPriceTotal: product.listPriceTotal,
            regularPriceTotal: product.regularPriceTotal,
            priceTotal: product.priceTotal,
            proratedListPrice: product.proratedListPrice,
            prorateMultiplier: product.prorateMultiplier,
            amendment: product.amendment,
          },
        },
      };
    } else {
      // If no dynamic pricing is available
      return {
        success: false,
        error: "No dynamic pricing available for this product",
      };
    }
  } catch (error) {
    console.error("Error calculating contract item price:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to calculate price",
    };
  }
}
