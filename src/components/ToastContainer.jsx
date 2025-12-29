import { Toaster } from "react-hot-toast";

const ToastContainer = () => (
  <Toaster
    position="bottom-right"
    reverseOrder={false}
    gutter={12}
    containerStyle={{
      bottom: 40,
      right: 20,
    }}
    toastOptions={{
      duration: 4000,
      style: {
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        color: "#333",
        fontSize: "14px",
        padding: "16px 20px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
      },
      success: {
        style: {
          borderLeft: "4px solid #10b981",
        },
      },
      error: {
        style: {
          borderLeft: "4px solid #ef4444",
        },
      },
      loading: {
        style: {
          borderLeft: "4px solid #f59e0b",
        },
      },
    }}
  />
);

export default ToastContainer;
