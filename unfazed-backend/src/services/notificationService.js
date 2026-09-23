const logNotification = ({
  channel,
  event,
  recipient,
  message,
}) => {
  console.log(
    `[Notification] ${channel.toUpperCase()} | ${event} | ${recipient} | ${message}`
  );
};

export const sendBookingConfirmation = async ({
  clientName,
  clientEmail,
  clientPhone,
  sessionDate,
  sessionTime,
}) => {
  const message = `Your therapy session is confirmed for ${sessionDate} at ${sessionTime}.`;

  if (clientEmail) {
    logNotification({
      channel: "email",
      event: "booking_confirmed",
      recipient: clientEmail,
      message,
    });
  }

  if (clientPhone) {
    logNotification({
      channel: "whatsapp",
      event: "booking_confirmed",
      recipient: clientPhone,
      message,
    });
  }

  return {
    success: true,
    event: "booking_confirmed",
    clientName,
  };
};

export const send24HourReminder = async ({
  clientName,
  clientEmail,
  clientPhone,
  sessionDate,
  sessionTime,
}) => {
  const message = `Reminder: your therapy session is tomorrow at ${sessionTime}.`;

  if (clientEmail) {
    logNotification({
      channel: "email",
      event: "session_reminder_24h",
      recipient: clientEmail,
      message,
    });
  }

  if (clientPhone) {
    logNotification({
      channel: "whatsapp",
      event: "session_reminder_24h",
      recipient: clientPhone,
      message,
    });
  }

  return {
    success: true,
    event: "session_reminder_24h",
    clientName,
    sessionDate,
  };
};

export const sendPostSessionFollowUp = async ({
  clientName,
  clientEmail,
  clientPhone,
}) => {
  const message =
    "Thank you for attending your session. Please take care and reach out if you need further support.";

  if (clientEmail) {
    logNotification({
      channel: "email",
      event: "post_session_follow_up",
      recipient: clientEmail,
      message,
    });
  }

  if (clientPhone) {
    logNotification({
      channel: "whatsapp",
      event: "post_session_follow_up",
      recipient: clientPhone,
      message,
    });
  }

  return {
    success: true,
    event: "post_session_follow_up",
    clientName,
  };
};

export default {
  sendBookingConfirmation,
  send24HourReminder,
  sendPostSessionFollowUp,
};
