import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../services/api";

function TrackOrder() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tracking, setTracking] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadTracking = async () => {
      try {
        const response = await api.get(
          `/orders/${id}/track`
        );

        setTracking(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          window.dispatchEvent(
            new Event("authChanged")
          );

          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load tracking information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="page">
        <p>Loading tracking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p className="error-message">
          {error}
        </p>

        <Link
          to="/orders"
          className="primary-btn"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!tracking) {
    return null;
  }

  return (
    <div className="page">
      <Link
        to="/orders"
        className="back-link"
      >
        ← Back to My Orders
      </Link>

      <div className="page-header">
        <p className="eyebrow">
          Order #{tracking.order_id}
        </p>

        <h1>Track Order</h1>

        <p>
          Current status:{" "}
          <strong>
            {tracking.current_status}
          </strong>
        </p>
      </div>

      <div className="tracking-card">
  <div className="tracking-header">
    <h2>Delivery Progress</h2>
    <p>
      Current Status:
      <span className="tracking-current-status">
        {tracking.current_status}
      </span>
    </p>
  </div>

  <div className="tracking-list">
        {tracking.tracking.map(
          (step, index) => (
            <div
              className={`tracking-step ${
                step.completed
                  ? "completed"
                  : ""
              } ${
                step.current
                  ? "current"
                  : ""
              }`}
              key={step.status}
            >
              <div className="tracking-number">
                {step.completed
                  ? "✓"
                  : index + 1}
              </div>

              <div>
                <h3>{step.status}</h3>

                <p>
                  {step.current
                    ? "Current status"
                    : step.completed
                      ? "Completed"
                      : "Waiting"}
                </p>
              </div>
            </div>
          )
                )}
      </div>
    </div>

      {tracking.created_at && (
        <p className="order-created">
          Order placed:{" "}
          {new Date(
            tracking.created_at
          ).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default TrackOrder;