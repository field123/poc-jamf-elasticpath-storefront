import {
  CartItem,
  ProductResponse,
  ShopperCatalogResource,
} from "@elasticpath/js-sdk";

/**
 * Combines product quantities from cart items with a new product being added
 * @param cartItems Current cart items
 * @param productIdToAdd Product ID being added to cart
 * @param quantityToAdd Quantity of product being added
 * @returns Array of products with combined quantities
 */
export function combineProductQuantities(
  cartItems: { product_id: string | undefined | null; quantity: number }[],
  productIdToAdd: string,
  quantityToAdd: number,
) {
  const productQuantityMap = new Map<string, number>();

  // Process existing cart items
  cartItems.forEach((item) => {
    if (!item.product_id) return;
    const currentQuantity = productQuantityMap.get(item.product_id) || 0;
    productQuantityMap.set(item.product_id, currentQuantity + item.quantity);
  });

  // Add or update the new product quantity
  const currentQuantity = productQuantityMap.get(productIdToAdd) || 0;
  productQuantityMap.set(productIdToAdd, currentQuantity + quantityToAdd);

  // Convert map to array
  return Array.from(productQuantityMap.entries()).map(
    ([product_id, quantity]) => ({
      product_id,
      quantity,
    }),
  );
}

/**
 * Resolves the image URL for a custom cart item from a product
 */
export function resolveCustomItemImage(
  originalProduct: ShopperCatalogResource<ProductResponse>,
) {
  // @ts-ignore
  return originalProduct.included?.main_images?.[0].link.href ?? null;
}

export type DynamicPricingResponseItem = {
  product_id: string;
  sku: string;
  quantity: number;
  price: number;
  listPrice: number;
  proratedListPrice?: number;
  regularPrice: number;
  partnerPrice: number;
  totalPartnerDiscountPercentage: number;
  totalDiscounted?: number;
  listPriceTotal: number;
  regularPriceTotal: number;
  partnerPriceTotal: number;
  priceTotal: number;
  prorateMultiplier?: number;
  amendment?: {
    startDate: string;
    endDate: string;
  };
};

/**
 * Converts a dynamic pricing response item into a custom cart item
 */
export function convertDynamicPricingResponseToCustomItem(
  response: DynamicPricingResponseItem,
  originalProduct: ShopperCatalogResource<ProductResponse>,
  originalCartItem?: CartItem,
) {
  return {
    type: "custom_item",
    quantity: response.quantity || 1,
    price: {
      amount: response.price,
    },
    description:
      originalCartItem?.description ??
      originalProduct.data.attributes.description,
    sku: originalCartItem?.sku ?? originalProduct.data.attributes.sku,
    name: originalCartItem?.name ?? originalProduct.data.attributes.name,
    custom_inputs: {
      image_url:
        originalCartItem?.custom_inputs?.image_url ??
        resolveCustomItemImage(originalProduct),
      originalQuantityForContract:
        originalCartItem?.custom_inputs?.originalQuantityForContract ?? 1,
      product_id:
        originalCartItem?.custom_inputs?.product_id ?? originalProduct.data.id,
      partnerPrice: response.partnerPrice,
      totalPartnerDiscountPercentage: response.totalPartnerDiscountPercentage,
      totalDiscounted: response.totalDiscounted,
      listPrice: response.listPrice,
      regularPrice: response.regularPrice,
      partnerPriceTotal: response.partnerPriceTotal,
      listPriceTotal: response.listPriceTotal,
      regularPriceTotal: response.regularPriceTotal,
      priceTotal: response.priceTotal,
      proratedListPrice: response.proratedListPrice,
      prorateMultiplier: response.prorateMultiplier,
      amendmentStartDate: response.amendment?.startDate,
      amendmentEndDate: response.amendment?.endDate,
    },
  };
}
