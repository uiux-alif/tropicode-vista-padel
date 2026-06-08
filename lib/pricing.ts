export interface PricingInput {
  startHour: number;       // 0-23
  duration: number;        // hours
  priceNormal: number;     // per hour IDR
  pricePeak: number;       // per hour IDR
  peakStart: number;
  peakEnd: number;
  addonRacket: boolean;
  addonBall: boolean;
  addonCoaching: boolean;
  racketRental: number;
  ballRental: number;
  coachingAddon: number;
  memberDiscountPercent?: number; // 0-100, applied to court fee only
}

export interface PriceBreakdown {
  courtFee: number;          // before discount
  courtFeeAfterDiscount: number; // after member discount
  memberDiscount: number;    // absolute IDR saved
  memberDiscountPercent: number;
  addonsFee: number;
  addonsDetail: { label: string; amount: number }[];
  total: number;
  hasPeak: boolean;
  perHour: { hour: number; isPeak: boolean; rate: number }[];
}

export function isPeakHour(hour: number, peakStart: number, peakEnd: number): boolean {
  return hour >= peakStart && hour < peakEnd;
}

/**
 * Calculate booking price.
 * Member discount applies to court fees only (not add-ons).
 */
export function calculatePrice(input: PricingInput): PriceBreakdown {
  const perHour: PriceBreakdown["perHour"] = [];
  let courtFee = 0;
  let hasPeak = false;

  for (let i = 0; i < input.duration; i++) {
    const hour = input.startHour + i;
    const peak = isPeakHour(hour, input.peakStart, input.peakEnd);
    const rate = peak ? input.pricePeak : input.priceNormal;
    if (peak) hasPeak = true;
    courtFee += rate;
    perHour.push({ hour, isPeak: peak, rate });
  }

  const discountPct = input.memberDiscountPercent ?? 0;
  const memberDiscount = discountPct > 0 ? Math.round(courtFee * discountPct / 100) : 0;
  const courtFeeAfterDiscount = courtFee - memberDiscount;

  const addonsDetail: { label: string; amount: number }[] = [];
  if (input.addonRacket) addonsDetail.push({ label: "Racket Rental", amount: input.racketRental });
  if (input.addonBall) addonsDetail.push({ label: "Ball Rental", amount: input.ballRental });
  if (input.addonCoaching) addonsDetail.push({ label: "Coaching Request", amount: input.coachingAddon });
  const addonsFee = addonsDetail.reduce((s, a) => s + a.amount, 0);

  return {
    courtFee,
    courtFeeAfterDiscount,
    memberDiscount,
    memberDiscountPercent: discountPct,
    addonsFee,
    addonsDetail,
    total: courtFeeAfterDiscount + addonsFee,
    hasPeak,
    perHour,
  };
}
