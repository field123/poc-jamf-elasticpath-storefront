import { useContext } from "react";
import Price from "./Price";
import StrikePrice from "./StrikePrice";
import clsx from "clsx";
import { ProductContext } from "../../lib/product-context";
import { ProductMultibuyOffer } from "./ProductMultibuyOffer";
import Ratings from "../reviews/yotpo/Ratings";

interface IProductSummary {
  product: any;
  offerings?: any;
  dynamicPricing?: {
    priceData: {
      amount: number;
      currency: string;
      includes_tax?: boolean;
      breakdown?: any;
      error?: boolean;
    } | null;
    isLoading: boolean;
  };
}

const ProductSummary = ({
  product,
  offerings,
  dynamicPricing,
}: IProductSummary): JSX.Element => {
  const {
    attributes,
    meta: { display_price, original_display_price },
  } = product;
  const context = useContext(ProductContext);

  // Format the dynamic price if available
  const formatDynamicPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  return (
    <div
      className={clsx(context?.isChangingSku && "opacity-20 cursor-default")}
    >
      <span className="text-xl font-semibold leading-[1.1] sm:text-3xl lg:text-4xl">
        {attributes.name}
      </span>
      <Ratings product={product} displayFromProduct={true} />
      <div className="text-lg mt-2">{attributes.sku}</div>
      {offerings.data.length == 0 && (
        <>
          {display_price && (
            <div className="flex items-center mt-2">
              {/* Show the dynamic price if available, otherwise show the original price */}
              {dynamicPricing?.priceData && !dynamicPricing.priceData.error ? (
                <div className="flex flex-col">
                  {original_display_price && (
                    <StrikePrice
                      price={
                        original_display_price?.without_tax?.formatted
                          ? original_display_price?.without_tax?.formatted
                          : original_display_price.with_tax.formatted
                      }
                      currency={
                        original_display_price.without_tax?.currency
                          ? original_display_price?.without_tax?.currency
                          : original_display_price.with_tax.currency
                      }
                    />
                  )}
                  <div className="flex items-center">
                    <Price
                      price={formatDynamicPrice(
                        dynamicPricing.priceData.amount,
                        dynamicPricing.priceData.currency,
                      )}
                      currency={dynamicPricing.priceData.currency}
                      original_display_price={original_display_price}
                      size="text-2xl"
                    />
                    {dynamicPricing.isLoading && (
                      <svg
                        className="animate-spin ml-2 h-4 w-4 text-gray-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                  </div>

                  {/* Detailed Pricing Breakdown */}
                  {dynamicPricing.priceData.breakdown && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          Detailed Pricing
                        </h4>
                        {!dynamicPricing.isLoading && (
                          <button
                            type="button"
                            className="text-xs text-blue-600 underline"
                            onClick={() => {
                              const detailsDiv =
                                document.getElementById("pricing-details");
                              if (detailsDiv) {
                                detailsDiv.classList.toggle("hidden");
                              }
                            }}
                          >
                            Hide Details
                          </button>
                        )}
                      </div>

                      <div id="pricing-details">
                        <table className="w-full text-xs">
                          <tbody>
                            {/* Unit Prices */}
                            <tr>
                              <td className="py-1 text-gray-500">
                                List Price (Unit):
                              </td>
                              <td className="py-1 text-right">
                                {formatDynamicPrice(
                                  dynamicPricing.priceData.breakdown.listPrice,
                                  dynamicPricing.priceData.currency,
                                )}
                              </td>
                            </tr>

                            {dynamicPricing.priceData.breakdown
                              .regularPrice && (
                              <tr>
                                <td className="py-1 text-gray-500">
                                  Regular Price (Unit):
                                </td>
                                <td className="py-1 text-right">
                                  {formatDynamicPrice(
                                    dynamicPricing.priceData.breakdown
                                      .regularPrice,
                                    dynamicPricing.priceData.currency,
                                  )}
                                </td>
                              </tr>
                            )}

                            {dynamicPricing.priceData.breakdown
                              .partnerPrice && (
                              <tr>
                                <td className="py-1 text-gray-500">
                                  Partner Price (Unit):
                                </td>
                                <td className="py-1 text-right">
                                  {formatDynamicPrice(
                                    dynamicPricing.priceData.breakdown
                                      .partnerPrice,
                                    dynamicPricing.priceData.currency,
                                  )}
                                </td>
                              </tr>
                            )}

                            {/* Quantity row */}
                            <tr className="border-t border-gray-100 mt-2">
                              <td className="py-1 text-gray-500">Quantity:</td>
                              <td className="py-1 text-right">
                                {dynamicPricing.priceData.breakdown.quantity}
                              </td>
                            </tr>

                            {/* Total Prices */}
                            {dynamicPricing.priceData.breakdown
                              .listPriceTotal && (
                              <tr>
                                <td className="py-1 text-gray-500">
                                  List Price Total:
                                </td>
                                <td className="py-1 text-right">
                                  {formatDynamicPrice(
                                    dynamicPricing.priceData.breakdown
                                      .listPriceTotal,
                                    dynamicPricing.priceData.currency,
                                  )}
                                </td>
                              </tr>
                            )}

                            {dynamicPricing.priceData.breakdown
                              .regularPriceTotal && (
                              <tr>
                                <td className="py-1 text-gray-500">
                                  Regular Price Total:
                                </td>
                                <td className="py-1 text-right">
                                  {formatDynamicPrice(
                                    dynamicPricing.priceData.breakdown
                                      .regularPriceTotal,
                                    dynamicPricing.priceData.currency,
                                  )}
                                </td>
                              </tr>
                            )}

                            {dynamicPricing.priceData.breakdown
                              .partnerPriceTotal && (
                              <tr>
                                <td className="py-1 text-gray-500">
                                  Partner Price Total:
                                </td>
                                <td className="py-1 text-right">
                                  {formatDynamicPrice(
                                    dynamicPricing.priceData.breakdown
                                      .partnerPriceTotal,
                                    dynamicPricing.priceData.currency,
                                  )}
                                </td>
                              </tr>
                            )}

                            {/* Final Price and Discount */}
                            {dynamicPricing.priceData.breakdown.priceTotal && (
                              <tr className="border-t border-gray-100 font-medium">
                                <td className="py-1 text-gray-700">
                                  Final Price Total:
                                </td>
                                <td className="py-1 text-right">
                                  {formatDynamicPrice(
                                    dynamicPricing.priceData.breakdown
                                      .priceTotal,
                                    dynamicPricing.priceData.currency,
                                  )}
                                </td>
                              </tr>
                            )}

                            {dynamicPricing.priceData.breakdown
                              .totalPartnerDiscountPercentage > 0 && (
                              <tr className="text-green-600">
                                <td className="py-1">Total Discount:</td>
                                <td className="py-1 text-right">
                                  {
                                    dynamicPricing.priceData.breakdown
                                      .totalPartnerDiscountPercentage
                                  }
                                  %
                                </td>
                              </tr>
                            )}

                            {/* Prorated pricing information */}
                            {dynamicPricing.priceData.breakdown
                              .prorateMultiplier && (
                              <tr className="border-t border-gray-100 mt-2">
                                <td className="py-1 text-gray-500">
                                  Prorate Multiplier:
                                </td>
                                <td className="py-1 text-right">
                                  {(
                                    dynamicPricing.priceData.breakdown
                                      .prorateMultiplier * 100
                                  ).toFixed(2)}
                                  %
                                </td>
                              </tr>
                            )}

                            {dynamicPricing.priceData.breakdown
                              .proratedListPrice && (
                              <tr>
                                <td className="py-1 text-gray-500">
                                  Prorated List Price:
                                </td>
                                <td className="py-1 text-right">
                                  {formatDynamicPrice(
                                    dynamicPricing.priceData.breakdown
                                      .proratedListPrice,
                                    dynamicPricing.priceData.currency,
                                  )}
                                </td>
                              </tr>
                            )}

                            {/* Amendment information */}
                            {dynamicPricing.priceData.breakdown.amendment && (
                              <>
                                <tr className="border-t border-gray-100 mt-4">
                                  <td
                                    colSpan={2}
                                    className="py-2 font-medium text-gray-700"
                                  >
                                    Amendment Details
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1 text-gray-500">
                                    Start Date:
                                  </td>
                                  <td className="py-1 text-right">
                                    {new Date(
                                      dynamicPricing.priceData.breakdown.amendment.startDate,
                                    ).toLocaleDateString()}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="py-1 text-gray-500">
                                    End Date:
                                  </td>
                                  <td className="py-1 text-right">
                                    {new Date(
                                      dynamicPricing.priceData.breakdown.amendment.endDate,
                                    ).toLocaleDateString()}
                                  </td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {original_display_price && (
                    <StrikePrice
                      price={
                        original_display_price?.without_tax?.formatted
                          ? original_display_price?.without_tax?.formatted
                          : original_display_price.with_tax.formatted
                      }
                      currency={
                        original_display_price.without_tax?.currency
                          ? original_display_price?.without_tax?.currency
                          : original_display_price.with_tax.currency
                      }
                    />
                  )}
                  <Price
                    price={
                      display_price?.without_tax?.formatted
                        ? display_price?.without_tax?.formatted
                        : display_price.with_tax.formatted
                    }
                    currency={
                      display_price?.without_tax?.currency
                        ? display_price?.without_tax?.currency
                        : display_price.with_tax.currency
                    }
                    original_display_price={original_display_price}
                    size="text-2xl"
                  />
                </>
              )}
            </div>
          )}
          {"tiers" in attributes && (
            <>
              <div className="uppercase font-bold mt-4 mb-4 text-lg text-red-700">
                Bulk Buy Offer
              </div>
              <ProductMultibuyOffer product={product} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ProductSummary;
