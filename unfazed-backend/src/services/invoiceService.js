import PDFDocument from "pdfkit";
import Payment from "../models/Payment.js";
import { saveInvoice } from "./storageService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = path.join(
  __dirname,
  "../../assets/fonts/NotoSans-Regular.ttf"
);

const formatCurrency = (amount, currency = "INR") => {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return currency === "INR"
    ? `₹${formattedAmount}`
    : `${currency} ${formattedAmount}`;
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

export const generateInvoice = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate("client", "name email phone")
    .populate("therapist", "name email phone")
    .populate("package", "name sessionCount sessionDuration")
    .populate("session", "startTime endTime duration");

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "paid") {
    throw new Error(
      "Invoice can only be generated for a paid payment"
    );
  }

  const invoiceNumber = `UNF-${new Date().getFullYear()}-${String(
    payment._id
  )
    .slice(-8)
    .toUpperCase()}`;

  const subtotal = Number(payment.amount) || 0;
  const platformFee = Number(payment.platform_fee) || 0;
  const netAmount = Number(payment.net_amount) || subtotal;

  // GST-style presentation.
  // The actual GST percentage can be configured later if required.
  const gstRate = 0;
  const gstAmount = 0;
  const total = subtotal + gstAmount;

  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  // Register Noto Sans so the Indian Rupee symbol (₹)
  // renders correctly in the generated PDF.
  doc.registerFont("NotoSans", fontPath);

  const chunks = [];

  return await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);

        const fileName = `${invoiceNumber}.pdf`;

        const storedInvoice = await saveInvoice(
          fileName,
          buffer
        );

        resolve({
          buffer,
          invoiceNumber,
          paymentId: payment._id,
          total,
          fileName: storedInvoice.fileName,
          filePath: storedInvoice.filePath,
        });
      } catch (error) {
        reject(error);
      }
    });

    doc.on("error", reject);

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    doc
      .fontSize(24)
      .font("NotoSans")
      .text("UNFAZED", 50, 50);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        "Therapy Practice Management Platform",
        50,
        80
      );

    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", 380, 55, {
        align: "right",
      });

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice No: ${invoiceNumber}`, 350, 85, {
        width: 195,
        align: "right",
      });

    doc
      .text(
        `Invoice Date: ${formatDate(payment.paidAt)}`,
        350,
        100,
        {
          width: 195,
          align: "right",
        }
      );

    doc
      .moveTo(50, 125)
      .lineTo(545, 125)
      .stroke();

    // --------------------------------------------------
    // THERAPIST / CLIENT INFORMATION
    // --------------------------------------------------

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("SERVICE PROVIDER", 50, 150);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        payment.therapist?.name || "Therapist",
        50,
        170
      );

    if (payment.therapist?.email) {
      doc.text(payment.therapist.email, 50, 185);
    }

    if (payment.therapist?.phone) {
      doc.text(payment.therapist.phone, 50, 200);
    }

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("BILL TO", 310, 150);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        payment.client?.name || "Client",
        310,
        170
      );

    if (payment.client?.email) {
      doc.text(payment.client.email, 310, 185);
    }

    if (payment.client?.phone) {
      doc.text(payment.client.phone, 310, 200);
    }

    // --------------------------------------------------
    // SERVICE DETAILS
    // --------------------------------------------------

    const tableTop = 245;

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("DESCRIPTION", 55, tableTop);

    doc.text("QTY", 330, tableTop);
    doc.text("RATE", 390, tableTop);
    doc.text("AMOUNT", 470, tableTop);

    doc
      .moveTo(50, tableTop + 20)
      .lineTo(545, tableTop + 20)
      .stroke();

    let description = "Therapy Session";

    if (payment.package?.name) {
      description = `Package: ${payment.package.name}`;

      if (payment.package.sessionCount) {
        description += ` (${payment.package.sessionCount} sessions)`;
      }
    }

    if (payment.session?.startTime) {
      description += ` | Session: ${formatDate(
        payment.session.startTime
      )}`;
    }

    const rowTop = tableTop + 35;

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(description, 55, rowTop, {
        width: 260,
      });

    doc
      .font("Helvetica")
      .text("1", 330, rowTop);

    // Use NotoSans for ₹ currency values.
    doc
      .font("NotoSans")
      .text(
        formatCurrency(subtotal, payment.currency),
        390,
        rowTop
      );

    doc
      .font("NotoSans")
      .text(
        formatCurrency(subtotal, payment.currency),
        470,
        rowTop
      );

    doc
      .moveTo(50, rowTop + 55)
      .lineTo(545, rowTop + 55)
      .stroke();

    // --------------------------------------------------
    // TOTALS
    // --------------------------------------------------

    const totalsTop = rowTop + 80;

    doc
      .font("Helvetica")
      .text("Subtotal", 350, totalsTop);

    doc
      .font("NotoSans")
      .text(
        formatCurrency(subtotal, payment.currency),
        470,
        totalsTop
      );

    doc
      .font("Helvetica")
      .text(
        `GST (${gstRate}%)`,
        350,
        totalsTop + 20
      );

    doc
      .font("NotoSans")
      .text(
        formatCurrency(gstAmount, payment.currency),
        470,
        totalsTop + 20
      );

    doc
      .font("Helvetica-Bold")
      .text("Total", 350, totalsTop + 50);

    doc
      .font("NotoSans")
      .text(
        formatCurrency(total, payment.currency),
        470,
        totalsTop + 50
      );

    doc
      .moveTo(50, totalsTop + 80)
      .lineTo(545, totalsTop + 80)
      .stroke();

    // --------------------------------------------------
    // PAYMENT INFORMATION
    // --------------------------------------------------

    const paymentTop = totalsTop + 110;

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("PAYMENT DETAILS", 50, paymentTop);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Status: ${payment.status.toUpperCase()}`,
        50,
        paymentTop + 25
      );

    doc.text(
      `Provider: ${payment.provider || "Razorpay"}`,
      50,
      paymentTop + 42
    );

    if (payment.razorpayPaymentId) {
      doc.text(
        `Transaction ID: ${payment.razorpayPaymentId}`,
        50,
        paymentTop + 59
      );
    }

    doc.text(
      `Order ID: ${payment.razorpayOrderId || "N/A"}`,
      50,
      paymentTop + 76
    );

    // --------------------------------------------------
    // FOOTER
    // --------------------------------------------------

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text(
        "This is a system-generated GST-style invoice from Unfazed.",
        50,
        735,
        {
          align: "center",
          width: 495,
        }
      );

    doc.text(
      "For billing support, please contact your therapist.",
      50,
      750,
      {
        align: "center",
        width: 495,
      }
    );

    // Finish PDF generation.
    doc.end();
  });
};

export default {
  generateInvoice,
};