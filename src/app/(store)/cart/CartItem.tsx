"use client";
import { CustomDiscountCartItem, useCart } from "../../../react-shopper-hooks";
import { ProductThumbnail } from "../account/orders/[orderId]/ProductThumbnail";
import { NumberInput } from "../../../components/number-input/NumberInput";
import Link from "next/link";
import { CartItem as CartItemType } from "@elasticpath/js-sdk";
import { LoadingDots } from "../../../components/LoadingDots";
import { CartAdditionalData } from "../../../components/cart/CartAdditionalData";
import { CartComponentData } from "../../../components/cart/CartComponentData";
import Image from "next/image";
import AddItemCustomDiscount from "../../(admin)/admin/quotes/new/AddItemCustomDiscount";
import { useState } from "react";
import { TextButton } from "../../../components/button/TextButton";
import { ChevronUpIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Disclosure } from "@headlessui/react";
import { deleteItemCustomDiscount } from "../../(admin)/admin/quotes/actions";

export type CartItemProps = {
  item: CartItemType;
  adminDisplay?: boolean;
  enableCustomDiscount?: boolean;
  selectedAccount?: string;
  itemCustomDiscount?: any;
  cartId?: any;
};

export function CartItem({
  item,
  adminDisplay,
  enableCustomDiscount,
  selectedAccount,
  itemCustomDiscount,
  cartId,
}: CartItemProps) {
  const { useScopedRemoveCartItem, useScopedUpdateCartItem } = useCart();
  const { mutate, isPending } = useScopedRemoveCartItem();
  const { mutate: mutateUpdate } = useScopedUpdateCartItem();
  const [openDiscount, setOpenDiscount] = useState(false);

  const removeCustomDiscount = async (customDiscountId: string) => {
    await deleteItemCustomDiscount(cartId, item.id, customDiscountId);
    mutateUpdate({
      itemId: item.id,
      quantity: item.quantity,
    });
  };

  // Format price values with the correct currency
  const formatPrice = (value: number) => {
    const currency = item.meta.display_price.with_tax.value.currency;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value / 100);
  };

  return (
    <div className="flex gap-5">
      <div className="flex w-16 sm:w-24 h-20 sm:h-[7.5rem] justify-center shrink-0 items-start">
        {item.product_id && <ProductThumbnail productId={item.product_id} />}

        {item.custom_inputs?.image_url && (
          <Image
            src={item.custom_inputs?.image_url}
            width="100"
            height="100"
            alt={item.name}
            className="overflow-hidden"
          />
        )}
      </div>
      <div className="flex flex-col gap-5 flex-1">
        <div className="flex gap-5 self-stretch">
          <div className="flex flex-col flex-1 gap-1">
            {item.product_id && !adminDisplay && (
              <Link href={`/products/${item.slug}`}>
                <span className="font-medium text-md">
                  {item.name}
                  {item?.custom_inputs?.options && (
                    <div className="mt-1 text-black/60 text-xs">
                      {item?.custom_inputs?.options}
                    </div>
                  )}
                  {item.sku && (
                    <div className="mt-1 text-black/60 text-sm font-normal">
                      SKU: {item.sku}
                    </div>
                  )}
                </span>
              </Link>
            )}
            {(!item.product_id || adminDisplay) && (
              <span className="font-medium text-md">
                {item.name}
                {item?.custom_inputs?.options && (
                  <div className="mt-1 text-black/60 text-xs">
                    {item?.custom_inputs?.options}
                  </div>
                )}
                {item.sku && (
                  <div className="mt-1 text-black/60 text-sm font-normal">
                    SKU: {item.sku}
                  </div>
                )}
              </span>
            )}
            <span className="text-sm text-black/60">
              Item Price: {item.meta.display_price.with_tax.unit.formatted}
            </span>
            <span className="text-sm text-black/60">
              Quantity: {item.quantity}
            </span>

            {/* Display additional price information from custom_inputs when available */}
            {item.custom_inputs?.listPrice && (
              <span className="text-sm text-black/60">
                List Price: {formatPrice(item.custom_inputs.listPrice)}
              </span>
            )}
            {item.custom_inputs?.regularPrice && (
              <span className="text-sm text-black/60">
                Regular Price: {formatPrice(item.custom_inputs.regularPrice)}
              </span>
            )}
            {item.custom_inputs?.partnerPrice && (
              <span className="text-sm text-black/60">
                Partner Price: {formatPrice(item.custom_inputs.partnerPrice)}
              </span>
            )}
            {item.custom_inputs?.totalPartnerDiscountPercentage && (
              <span className="text-sm text-black/60">
                Partner Discount:{" "}
                {item.custom_inputs.totalPartnerDiscountPercentage}%
              </span>
            )}
            {item.custom_inputs?.totalDiscounted && (
              <span className="text-sm text-black/60">
                Partner Total Discounted:{" "}
                {formatPrice(item.custom_inputs.totalDiscounted)}
              </span>
            )}
            {item.custom_inputs?.listPriceTotal && (
              <span className="text-sm text-black/60">
                List Price Total:{" "}
                {formatPrice(item.custom_inputs.listPriceTotal)}
              </span>
            )}
            {item.custom_inputs?.regularPriceTotal && (
              <span className="text-sm text-black/60">
                Regular Price Total:{" "}
                {formatPrice(item.custom_inputs.regularPriceTotal)}
              </span>
            )}
            {item.custom_inputs?.partnerPriceTotal && (
              <span className="text-sm text-black/60">
                Partner Price Total:{" "}
                {formatPrice(item.custom_inputs.partnerPriceTotal)}
              </span>
            )}

            {/* Display proration information if available */}
            {item.custom_inputs?.prorateMultiplier !== undefined && (
              <span className="text-sm text-black/60">
                Prorate Multiplier:{" "}
                {(item.custom_inputs.prorateMultiplier * 100).toFixed(2)}%
              </span>
            )}
            {item.custom_inputs?.proratedListPrice && (
              <span className="text-sm text-black/60">
                Prorated List Price:{" "}
                {formatPrice(item.custom_inputs.proratedListPrice)}
              </span>
            )}

            {/* Display amendment information if available */}
            {(item.custom_inputs?.amendmentStartDate ||
              item.custom_inputs?.amendmentEndDate) && (
              <div className="text-sm text-black/60 mt-2 border-t border-gray-100 pt-2">
                <span className="font-medium">Amendment Period</span>
                {item.custom_inputs?.amendmentStartDate && (
                  <div>
                    Start:{" "}
                    {new Date(
                      item.custom_inputs.amendmentStartDate,
                    ).toLocaleDateString()}
                  </div>
                )}
                {item.custom_inputs?.amendmentEndDate && (
                  <div>
                    End:{" "}
                    {new Date(
                      item.custom_inputs.amendmentEndDate,
                    ).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex h-7 gap-2 flex-col">
            <span className="font-medium">
              {item.meta.display_price.with_tax.value.formatted}
            </span>
            {item.meta.display_price.without_discount?.value.amount &&
              item.meta.display_price.without_discount?.value.amount !==
                item.meta.display_price.with_tax.value.amount && (
                <span className="text-black/60 text-sm line-through">
                  {item.meta.display_price.without_discount?.value.formatted}
                </span>
              )}
          </div>
        </div>
        {enableCustomDiscount && (
          <div className="flex w-full">
            <TextButton
              className="text-sm text-brand-primary"
              onClick={() => setOpenDiscount(true)}
            >
              Add Item Discount
            </TextButton>
          </div>
        )}
        <div className="flex w-[15rem] gap-5 items-center">
          <NumberInput item={item} />
          {isPending ? (
            <LoadingDots className="bg-black" />
          ) : (
            <button
              type="button"
              className="text-sm underline text-black/60"
              onClick={() => mutate({ itemId: item.id })}
            >
              Remove
            </button>
          )}
        </div>
        {itemCustomDiscount?.length > 0 && (
          <Disclosure as="div" className="w-full" defaultOpen>
            {({ open }) => (
              <>
                <div className="flex justify-between">
                  <dt>
                    <Disclosure.Button
                      className={`${
                        itemCustomDiscount ? "cursor-pointer" : "cursor-auto"
                      } flex text-sm`}
                    >
                      {itemCustomDiscount && (
                        <ChevronUpIcon
                          className={`${
                            open
                              ? "rotate-180 transform"
                              : "rotate-90 transform"
                          } h-3 w-3 text-black mr-1 mt-1`}
                        />
                      )}
                      Item Discounts
                    </Disclosure.Button>
                  </dt>
                </div>
                <Disclosure.Panel className="text-sm">
                  {item?.relationships?.custom_discounts?.data?.map(
                    (discount: any) => {
                      const details = itemCustomDiscount.find(
                        (disc: CustomDiscountCartItem) =>
                          disc.id === discount.id,
                      );
                      return (
                        <div
                          className="flex justify-between mt-4"
                          key={details.id}
                        >
                          <div className="flex justify-between gap-4">
                            <span>
                              <TrashIcon
                                className="h-5 w-5 text-red-600 hover:text-red-400 cursor-pointer"
                                onClick={() => removeCustomDiscount(details.id)}
                              />
                            </span>
                            {details.description}
                          </div>
                          <div>{details.amount.formatted}</div>
                        </div>
                      );
                    },
                  )}
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        )}
        <CartComponentData item={item} />
        <CartAdditionalData item={item} />
      </div>
      {enableCustomDiscount && selectedAccount && (
        <AddItemCustomDiscount
          itemId={item.id}
          selectedSalesRep={selectedAccount}
          enableCustomDiscount={enableCustomDiscount}
          openDiscount={openDiscount}
          setOpenDiscount={setOpenDiscount}
          name={item.name}
          sku={item.sku}
        />
      )}
    </div>
  );
}
