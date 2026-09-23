import Payment from "../models/Payment.js";
import Client from "../models/Client.js";
import Package from "../models/Package.js";
import Session from "../models/Session.js";
import { createRazorpayOrder } from "../services/paymentService.js";

import {
  generateInvoice,
} from "../services/invoiceService.js";

import {
  sendBookingConfirmation,
} from "../services/notificationService.js";

import crypto from "crypto";

export const createPaymentOrder = async (req, res, next) => {
  try {
    const { clientId, amount } = req.body;

    if (!clientId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Client ID and valid amount are required",
      });
    }

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

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `unfazed_${Date.now()}`,
    });

    const platformFee = 0;
    const netAmount = amount - platformFee;

    const payment = await Payment.create({
      client: client._id,
      therapist: req.user.id,
      amount,
      currency: "INR",
      status: "created",
      provider: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      gateway_transaction_id: razorpayOrder.id,
      platform_fee: platformFee,
      net_amount: netAmount,
    });

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      payment,
      order: razorpayOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId,
      therapist: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = "paid";
    payment.paidAt = new Date();

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const {
      clientId,
      packageId,
      amount,
      currency,
    } = req.body;

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

export const createClientPaymentOrder = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    const session = await Session.findOne({
      _id: sessionId,
      client: req.user.id,
      status: "pending_payment",
    }).populate("therapist", "name sessionPrice");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Pending payment session not found",
      });
    }

    // Prevent duplicate payment orders for the same session
    const existingPayment = await Payment.findOne({
      session: session._id,
      client: req.user.id,
      status: {
        $in: ["created", "pending"],
      },
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Payment order already exists for this session",
        session: {
          id: session._id,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
        },
        payment: existingPayment,
      });
    }

    const amount = Number(session.therapist.sessionPrice);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "This therapist does not have a valid session price configured",
      });
    }

    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `session_${session._id}_${Date.now()}`,
    });

    const platformFee = 0;
    const netAmount = amount - platformFee;

    const payment = await Payment.create({
      client: session.client,
      therapist: session.therapist._id,
      session: session._id,
      amount,
      currency: "INR",
      status: "created",
      provider: "razorpay",
      razorpayOrderId: razorpayOrder.id,
      gateway_transaction_id: razorpayOrder.id,
      platform_fee: platformFee,
      net_amount: netAmount,
    });

    return res.status(201).json({
      success: true,
      message: "Client payment order created successfully",
      session: {
        id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
      },
      payment,
      order: razorpayOrder,
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
      payment.failureReason =
        failureReason || "Payment failed";
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

    if (
      !razorpayOrderId &&
      !razorpayPaymentId &&
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one Razorpay payment detail is required",
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

export const handleRazorpayWebhook = async (
  req,
  res,
  next
) => {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({
        success: false,
        message:
          "Razorpay webhook secret is not configured",
      });
    }

    const signature =
      req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature is missing",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = JSON.parse(
      req.body.toString()
    );

    if (event.event === "payment.captured") {
      const paymentEntity =
        event.payload.payment.entity;

      const payment = await Payment.findOne({
        razorpayOrderId: paymentEntity.order_id,
      }).populate(
        "client",
        "name email phone"
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found",
        });
      }

      // Prevent duplicate processing
      if (
        payment.status === "paid" &&
        payment.razorpayPaymentId ===
          paymentEntity.id
      ) {
        return res.status(200).json({
          success: true,
          message: "Webhook already processed",
        });
      }

      payment.razorpayPaymentId =
        paymentEntity.id;

      payment.status = "paid";
      payment.paidAt = new Date();

      await payment.save();

      // Confirm the linked booking
      let confirmedSession = null;

      if (payment.session) {
        const sessionId = payment.session;
        const clientId =
          payment.client?._id || payment.client;

        confirmedSession =
          await Session.findOneAndUpdate(
            {
              _id: sessionId,
              client: clientId,
              therapist: payment.therapist,
              status: "pending_payment",
            },
            {
              $set: {
                status: "confirmed",
              },
            },
            {
              returnDocument: "after",
            }
          ).populate(
            "client",
            "name email phone"
          );

        if (confirmedSession) {
          console.log(
            `[Session] Confirmed ${confirmedSession._id}`
          );
        } else {
          console.error(
            `[Session] Failed to confirm session ${sessionId}`
          );
        }
      }

      // Generate invoice
      try {
        const invoice = await generateInvoice(
          payment._id
        );

        console.log(
          `[Invoice] Generated ${invoice.invoiceNumber} for payment ${payment._id}`
        );
      } catch (invoiceError) {
        console.error(
          "[Invoice] Failed to generate invoice:",
          invoiceError
        );
      }

      // Send booking confirmation notification
      try {
        if (payment.client) {
          await sendBookingConfirmation({
            clientName: payment.client.name,
            clientEmail: payment.client.email,
            clientPhone: payment.client.phone,
            sessionDate: confirmedSession
              ? new Date(
                  confirmedSession.startTime
                ).toLocaleDateString("en-IN")
              : "your scheduled date",
            sessionTime: confirmedSession
              ? new Date(
                  confirmedSession.startTime
                ).toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )
              : "your scheduled time",
          });
        }
      } catch (notificationError) {
        console.error(
          "[Notification] Failed to send booking confirmation:",
          notificationError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    next(error);
  }
};