import Client from "../models/Client.js";
import Session from "../models/Session.js";
import SessionNote from "../models/SessionNote.js";
import Payment from "../models/Payment.js";
import Package from "../models/Package.js";
import ClientPackage from "../models/ClientPackage.js";
import { getInvoicePath } from "../services/storageService.js";

export const getMyProfile = async (req, res, next) => {
  try {
     const client = await Client.findById(req.user.id)
       .select("-password")
       .populate("therapist", "name email sessionPrice");

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

export const getMyAvailablePackages = async (
  req,
  res,
  next
) => {
  try {
    const client = await Client.findById(
      req.user.id
    ).select("therapist");

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client profile not found",
      });
    }

    const packages = await Package.find({
      therapist: client.therapist,
      isActive: true,
    })
      .sort({
        sessionCount: 1,
        createdAt: -1,
      })
      .lean();

    const packagesWithRate = packages.map(
      (packageData) => ({
        ...packageData,
        perSessionRate:
          Number(packageData.price) /
          Number(packageData.sessionCount),
      })
    );

    return res.status(200).json({
      success: true,
      count: packagesWithRate.length,
      packages: packagesWithRate,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPackages = async (
  req,
  res,
  next
) => {
  try {
    const clientPackages = await ClientPackage.find({
      client: req.user.id,
    })
      .populate(
        "package",
        "name description sessionCount sessionDuration price currency validityDays"
      )
      .populate(
        "payment",
        "_id amount currency status razorpayPaymentId paidAt createdAt"
      )
      .sort({
        createdAt: -1,
      });

    const packagesWithRemaining = clientPackages.map(
      (clientPackage) => ({
        ...clientPackage.toObject(),
        sessionsRemaining: Math.max(
          clientPackage.sessionsPurchased -
            clientPackage.sessionsUsed,
          0
        ),
      })
    );

    return res.status(200).json({
      success: true,
      count: packagesWithRemaining.length,
      clientPackages: packagesWithRemaining,
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

export const getMySessionNotes = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      client: req.user.id,
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    const notes = await SessionNote.find({
      session: session._id,
      client: req.user.id,
      isClientVisible: true,
    })
      .populate("session", "startTime endTime status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      notes,
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