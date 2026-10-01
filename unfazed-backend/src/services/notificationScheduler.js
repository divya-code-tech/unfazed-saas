import Session from "../models/Session.js";
import {
  send24HourReminder,
  sendPostSessionFollowUp,
} from "./notificationService.js";

const ONE_MINUTE = 60 * 1000;

let schedulerTimer = null;
let processingNotifications = false;

export const processPendingNotifications = async () => {
  if (processingNotifications) {
    return;
  }

  processingNotifications = true;

  try {
    const now = new Date();

    // ----------------------------------------------
    // 24-HOUR SESSION REMINDERS
    // ----------------------------------------------
    const reminderWindowStart = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 - ONE_MINUTE
    );

    const reminderWindowEnd = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 + ONE_MINUTE
    );

    const sessionsForReminder = await Session.find({
      status: "confirmed",
      reminderSentAt: null,
      startTime: {
        $gte: reminderWindowStart,
        $lte: reminderWindowEnd,
      },
    }).populate("client", "name email phone");

    for (const session of sessionsForReminder) {
      if (!session.client) {
        continue;
      }

      try {
        await send24HourReminder({
          clientName: session.client.name,
          clientEmail: session.client.email,
          clientPhone: session.client.phone,
          sessionDate: session.startTime.toLocaleDateString(
            "en-IN"
          ),
          sessionTime: session.startTime.toLocaleTimeString(
            "en-IN",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
        });

        await Session.updateOne(
          {
            _id: session._id,
            reminderSentAt: null,
          },
          {
            $set: {
              reminderSentAt: new Date(),
            },
          }
        );
      } catch (notificationError) {
        console.error(
          `[Notification] Failed 24-hour reminder for session ${session._id}:`,
          notificationError
        );
      }
    }

    // ----------------------------------------------
    // POST-SESSION FOLLOW-UP
    // ----------------------------------------------
    const sessionsForFollowUp = await Session.find({
      status: "completed",
      followUpSentAt: null,
    }).populate("client", "name email phone");

    for (const session of sessionsForFollowUp) {
      if (!session.client) {
        continue;
      }

      try {
        await sendPostSessionFollowUp({
          clientName: session.client.name,
          clientEmail: session.client.email,
          clientPhone: session.client.phone,
        });

        await Session.updateOne(
          {
            _id: session._id,
            followUpSentAt: null,
          },
          {
            $set: {
              followUpSentAt: new Date(),
            },
          }
        );
      } catch (notificationError) {
        console.error(
          `[Notification] Failed post-session follow-up for session ${session._id}:`,
          notificationError
        );
      }
    }
  } catch (error) {
    console.error(
      "[NotificationScheduler] Processing failed:",
      error
    );
  } finally {
    processingNotifications = false;
  }
};

export const startNotificationScheduler = () => {
  if (schedulerTimer) {
    return;
  }

  console.log(
    "[NotificationScheduler] Started. Checking every minute."
  );

  processPendingNotifications();

  schedulerTimer = setInterval(
    processPendingNotifications,
    ONE_MINUTE
  );
};

export default {
  startNotificationScheduler,
  processPendingNotifications,
};