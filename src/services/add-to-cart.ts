"use server";

import { CartAdditionalHeaders, CartItem } from "@elasticpath/js-sdk";
import { getServerSideImplicitClient } from "../lib/epcc-server-side-implicit-client";
import {
  getSelectedAccount,
  retrieveAccountMemberCredentials,
} from "../lib/retrieve-account-member-credentials";
import { cookies } from "next/headers";
import { ACCOUNT_MEMBER_TOKEN_COOKIE_NAME } from "../lib/cookie-constants";
import { redirect } from "next/navigation";
import { COOKIE_PREFIX_KEY } from "../lib/resolve-cart-env";
import {
  combineProductQuantities,
  convertDynamicPricingResponseToCustomItem,
  DynamicPricingResponseItem,
} from "./cart-utils";

export type ServerSideAddProductToCartProps = {
  cartId: string;
  productId: string;
  quantity?: number;
  data?: any;
  isSku?: boolean;
  token?: string;
  additionalHeaders?: CartAdditionalHeaders;
};

export async function serverSideAddProductToCart(
  props: ServerSideAddProductToCartProps,
) {
  const client = getServerSideImplicitClient();
  const cookieStore = cookies();

  const { cartId, productId, quantity, data, isSku, token, additionalHeaders } =
    props;

  const accountMemberCookie = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCookie) {
    redirect("/login?returnUrl=/checkout");
    throw new Error("No account member cookie found");
  }

  const selectedAccount = getSelectedAccount(accountMemberCookie);

  const cartCookie = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_cart`);
  const cart = await client.Cart(cartCookie?.value).With("items").Get();

  if (!cart) {
    throw new Error("No cart found");
  }

  const currentCartItems = cart.included?.items ?? [];
  const mappedCartItems = currentCartItems.map((item) => ({
    product_id: item.product_id ?? item.custom_inputs?.product_id,
    quantity: item.quantity,
  }));

  // @ts-ignore
  const customAttributes = cart?.data?.custom_attributes || {};

  const contractTerm = customAttributes?.contract_term_id?.value;

  const currency = cookieStore.get(`${COOKIE_PREFIX_KEY}_ep_currency`)?.value;

  // Combine quantities for matching products
  const combinedProducts = combineProductQuantities(
    mappedCartItems,
    productId,
    quantity ?? 1,
  );

  const resolvedDynamicPricing = await getDynamicPricing({
    contract_terms: contractTerm,
    account: selectedAccount.account_id,
    products: combinedProducts,
    currency: currency ?? "USD",
  });

  const originalProduct = await client.ShopperCatalog.Products.With(
    "main_image",
  ).Get({
    productId,
  });

  if (!resolvedDynamicPricing?.success) {
    return client
      .Cart(cartId)
      .AddProduct(productId, quantity, data, isSku, token, additionalHeaders);
  }

  const cartItemLookUpByProductId = currentCartItems.reduce(
    (acc, item) => {
      const productId = item.custom_inputs?.product_id ?? item.product_id;

      return {
        ...acc,
        ...(productId && { [productId]: item }),
      };
    },
    {} as Record<string, CartItem>,
  );

  const customItems = resolvedDynamicPricing.products?.map((item) =>
    convertDynamicPricingResponseToCustomItem(
      item,
      originalProduct,
      cartItemLookUpByProductId[item.product_id],
    ),
  );

  await client.Cart(cartId).RemoveAllItems();
  return client.Cart(cartId).AddCustomItem(customItems);
}

export type DynamicPricingRequest = {
  contract_terms: string;
  account: string;
  products: {
    product_id: string;
    quantity: number;
  }[];
  currency: string;
};

type DynamicPricingResponse = DynamicPricingResponseItem[];

export async function getDynamicPricing(request: DynamicPricingRequest) {
  const response = await fetch(process.env.DYNAMIC_PRICING_URL ?? "", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const responseBody: DynamicPricingResponse = await response.json();

  // if the responseBody object properties are a number, convert them to an integer with Math.ceil
  const responseBodyWithIntegers = responseBody.map((item) => ({
    ...item,
    price: Math.ceil(item.price),
    listPrice: Math.ceil(item.listPrice),
    proratedListPrice: item.proratedListPrice
      ? Math.ceil(item.proratedListPrice)
      : undefined,
    regularPrice: Math.ceil(item.regularPrice),
    partnerPrice: Math.ceil(item.partnerPrice),
    totalDiscounted: item.totalDiscounted
      ? Math.ceil(item.totalDiscounted)
      : undefined,
    totalPartnerDiscountPercentage: Math.ceil(
      item.totalPartnerDiscountPercentage,
    ),
    partnerPriceTotal: Math.ceil(item.partnerPriceTotal),
    listPriceTotal: Math.ceil(item.listPriceTotal),
    regularPriceTotal: Math.ceil(item.regularPriceTotal),
    priceTotal: Math.ceil(item.priceTotal),
    // Preserve the amendment object and prorateMultiplier unchanged
    amendment: item.amendment,
    prorateMultiplier: item.prorateMultiplier,
  }));

  if (responseBody) {
    return {
      success: true,
      products: responseBodyWithIntegers,
    };
  }

  return {
    success: false,
    products: null,
  };
}
