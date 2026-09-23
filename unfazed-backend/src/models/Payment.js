import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },

    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },

    session: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "Session",
     default: null,
 },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

  gateway_transaction_id: {
  type: String,
  trim: true,
  default: "",
},

platform_fee: {
  type: Number,
  min: 0,
  default: 0,
},

net_amount: {
  type: Number,
  min: 0,
  default: 0,
},

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["created", "pending", "paid", "failed", "refunded"],
      default: "created",
    },

    provider: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
    },

    razorpayOrderId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpayPaymentId: {
      type: String,
      trim: true,
      default: "",
    },

    razorpaySignature: {
      type: String,
      trim: true,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ client: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 }, { sparse: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
