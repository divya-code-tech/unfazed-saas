import razorpay from "../config/razorpay.js";

export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
}) => {
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt,
  });

  return order;
};