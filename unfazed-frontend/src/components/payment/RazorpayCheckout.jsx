import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";

function RazorpayCheckout({ sessionId, amount, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in as a client first.");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        setError("Unable to load Razorpay Checkout.");
        return;
      }

      const response = await axiosInstance.post(
        "/payments/client/create-order",
        {
          sessionId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { order } = response.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Unfazed",
        description: "Therapy Session",
        order_id: order.id,

        handler: (paymentResponse) => {
          if (onSuccess) {
            onSuccess(paymentResponse);
          }
        },

        theme: {
          color: "#3399cc",
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setError(
          response.error?.description ||
            "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (requestError) {
      console.error(requestError);

      setError(
        requestError.response?.data?.message ||
          "Unable to start payment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading
          ? "Creating Payment..."
          : `Pay ₹${Number(amount).toLocaleString("en-IN")}`}
      </button>

      {error && <p>{error}</p>}
    </div>
  );
}

export default RazorpayCheckout;