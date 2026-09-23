import Client from "../models/Client.js";
import Session from "../models/Session.js";
import Payment from "../models/Payment.js";
import { getInvoicePath } from "../services/storageService.js";

export const getMyProfile = async (req, res, next) => {
  try {
    const client = await Client.findById(req.user.id).select(
      "-password"
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      client,
    });
  } catch (error) {
    next(error);
  }
};
export const getMySessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      client: req.user.id,
    })
      .populate("therapist", "name email sessionPrice")
      .populate("package", "name price sessionCount")
      .sort({ startTime: 1 });

    const sessionsWithPayments = await Promise.all(
      sessions.map(async (session) => {
        const payment = await Payment.findOne({
          session: session._id,
          client: req.user.id,
        })
          .sort({ createdAt: -1 })
          .select(
            "_id amount currency status razorpayOrderId razorpayPaymentId createdAt"
          );

        return {
          ...session.toObject(),
          payment: payment || null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: sessionsWithPayments.length,
      sessions: sessionsWithPayments,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPendingPayment = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      client: req.user.id,
      status: "pending_payment",
    })
      .populate("therapist", "name email sessionPrice")
      .sort({ createdAt: -1 });

    for (const session of sessions) {
      const payment = await Payment.findOne({
        session: session._id,
        client: req.user.id,
        status: {
          $in: ["created", "pending"],
        },
      })
        .sort({ createdAt: -1 })
        .select(
          "_id amount currency status razorpayOrderId createdAt"
        );

      if (payment) {
        return res.status(200).json({
          success: true,
          session,
          payment,
          amount: payment.amount,
          currency: payment.currency || "INR",
        });
      }
    }

    return res.status(200).json({
      success: true,
      session: null,
      payment: null,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadMyInvoice = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      _id: paymentId,
      client: req.user.id,
      status: "paid",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paid invoice not found",
      });
    }

    const invoiceNumber = `UNF-${new Date(
      payment.createdAt
    ).getFullYear()}-${String(payment._id)
      .slice(-8)
      .toUpperCase()}`;

    const fileName = `${invoiceNumber}.pdf`;
    const filePath = getInvoicePath(fileName);
    
    res.setHeader(
      "X-Invoice-Filename",
      fileName
    );

    return res.download(
      filePath,
      fileName,
      (error) => {
        if (error && !res.headersSent) {
          next(error);
        }
      }
    );
  } catch (error) {
    next(error);
  }
};