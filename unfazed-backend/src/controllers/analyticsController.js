import mongoose from "mongoose";

import Payment from "../models/Payment.js";
import Session from "../models/Session.js";
import Client from "../models/Client.js";

export const getAnalytics = async (req, res, next) => {
  try {
    const therapistId = new mongoose.Types.ObjectId(req.user.id);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfNextMonth = new Date(startOfMonth);
    startOfNextMonth.setMonth(
      startOfNextMonth.getMonth() + 1
    );

    // -----------------------------------------
    // REVENUE TREND
    // -----------------------------------------
    const revenueTrendResult = await Payment.aggregate([
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
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$paidAt",
            },
          },
          revenue: {
            $sum: "$net_amount",
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    // -----------------------------------------
    // ACTIVE CLIENTS
    // -----------------------------------------
    const activeClientResult = await Client.aggregate([
      {
        $match: {
          therapist: therapistId,
          isActive: true,
        },
      },
      {
        $count: "activeClients",
      },
    ]);

    // -----------------------------------------
    // SESSION + NO-SHOW ANALYTICS
    // -----------------------------------------
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

          totalSessions: {
            $sum: 1,
          },

          noShowSessions: {
            $sum: {
              $cond: [
                { $eq: ["$status", "no_show"] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const revenueTrend = revenueTrendResult.map(
      (item) => ({
        date: item._id,
        revenue: item.revenue,
      })
    );

    const revenue = revenueTrend.reduce(
      (total, item) => total + item.revenue,
      0
    );

    const activeClients =
      activeClientResult[0]?.activeClients || 0;

    const totalSessions =
      sessionResult[0]?.totalSessions || 0;

    const noShowSessions =
      sessionResult[0]?.noShowSessions || 0;

    const noShowRate =
      totalSessions > 0
        ? Number(
            (
              (noShowSessions / totalSessions) *
              100
            ).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        revenue,
        revenueTrend,
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