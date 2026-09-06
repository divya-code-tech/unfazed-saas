import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Session from "../models/Session.js";


export const getAnalytics = async (req, res, next) => {
  try {
    const therapistId =  new mongoose.Types.ObjectId(req.user.id);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfNextMonth = new Date(startOfMonth);
    startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);

    const revenueResult = await Payment.aggregate([
      {
        $match: {
          therapist: therapistId,
          status: "paid",
          paidAt: {
            $gte: startOfMonth,
            $lt: startOfNextMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$net_amount" },
        },
      },
    ]);

    const sessionResult = await Session.aggregate([
      {
        $match: {
          therapist: therapistId,
          startTime: {
            $gte: startOfMonth,
            $lt: startOfNextMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          noShowSessions: {
            $sum: {
              $cond: [{ $eq: ["$status", "no_show"] }, 1, 0],
            },
          },
          clients: { $addToSet: "$client" },
        },
      },
    ]);

    const revenue = revenueResult[0]?.revenue || 0;
    const totalSessions = sessionResult[0]?.totalSessions || 0;
    const noShowSessions = sessionResult[0]?.noShowSessions || 0;
    const activeClients = sessionResult[0]?.clients?.length || 0;

    const noShowRate =
      totalSessions > 0
        ? Number(((noShowSessions / totalSessions) * 100).toFixed(2))
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        revenue,
        activeClients,
        totalSessions,
        noShowSessions,
        noShowRate,
      },
    });
  } catch (error) {
    next(error);
  }
};
