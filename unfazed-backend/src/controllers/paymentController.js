import Payment from "../models/Payment.js";
import Client from "../models/Client.js";
import Package from "../models/Package.js";

export const createPayment = async (req, res, next) => {
  try {
    const { clientId, packageId, amount, currency } = req.body;

    if (!clientId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Client ID and amount are required",
      });
    }

    // Make sure the client belongs to the authenticated therapist
    const client = await Client.findOne({
      _id: clientId,
      therapist: req.user.id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Package is optional, but if provided it must belong to the therapist
    let packageData = null;

    if (packageId) {
      packageData = await Package.findOne({
        _id: packageId,
        therapist: req.user.id,
      });

      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: "Package not found",
        });
      }
    }

    const payment = await Payment.create({
      client: clientId,
      therapist: req.user.id,
      package: packageData ? packageData._id : null,
      amount,
      currency: currency || "INR",
      status: "created",
      provider: "razorpay",
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      therapist: req.user.id,
    })
      .populate("client", "name email phone")
      .populate(
        "package",
        "name sessionCount sessionDuration price currency validityDays"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    })
      .populate("client", "name email phone")
      .populate(
        "package",
        "name sessionCount sessionDuration price currency validityDays"
      );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { status, failureReason } = req.body;

    const allowedStatuses = [
      "created",
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    payment.status = status;

    if (status === "paid") {
      payment.paidAt = new Date();
      payment.failureReason = undefined;
    }

    if (status === "failed") {
      payment.failureReason = failureReason || "Payment failed";
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentDetails = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!razorpayOrderId && !razorpayPaymentId && !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "At least one Razorpay payment detail is required",
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      therapist: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (razorpayOrderId !== undefined) {
      payment.razorpayOrderId = razorpayOrderId;
    }

    if (razorpayPaymentId !== undefined) {
      payment.razorpayPaymentId = razorpayPaymentId;
    }

    if (razorpaySignature !== undefined) {
      payment.razorpaySignature = razorpaySignature;
    }

    await payment.save();

    res.status(200).json({
      success: true,
      message: "Payment details updated successfully",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

