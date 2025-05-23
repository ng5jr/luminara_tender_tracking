import React, { useState, useEffect } from "react";
import { db } from "../../firebaseconfig"; // Assuming you have Firebase configured
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./rating.css"; // Create this CSS file for styling
import Logo from "../../components/logo";
import { Link } from "react-router-dom";
import back from "../../assets/back.png"; // Import the back icon

function Rating() {
  const [websiteRating, setWebsiteRating] = useState(0);
  const [tenderRating, setTenderRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [redirectTimer, setRedirectTimer] = useState(0); // State for the timer

  const navigate = useNavigate(); // Initialize useNavigate

  const handleWebsiteRatingClick = (selectedRating) => {
    setWebsiteRating(selectedRating);
  };

  const handleTenderRatingClick = (selectedRating) => {
    setTenderRating(selectedRating);
  };

  const handleCommentsChange = (event) => {
    setComments(event.target.value);
  };

  const handleSubmitFeedback = async () => {
    if (websiteRating === 0 || tenderRating === 0) {
      setSubmissionStatus(
        "Please rate both the website and the tender service."
      );
      return;
    }

    try {
      const feedbackCollectionRef = collection(db, "guestFeedback"); // New collection name
      await addDoc(feedbackCollectionRef, {
        websiteRating: websiteRating,
        tenderRating: tenderRating,
        comments: comments,
        timestamp: serverTimestamp(),
      });

      setWebsiteRating(0);
      setTenderRating(0);
      setComments("");
      setSubmissionStatus(
        "Thank you for your feedback! You will be redirected in 5 seconds..."
      );
      setRedirectTimer(5); // Start the timer
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      setSubmissionStatus("Failed to submit feedback. Please try again.");
    }
  };

  useEffect(() => {
    if (redirectTimer > 0) {
      const timer = setInterval(() => {
        setRedirectTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(timer); // Cleanup the interval
    }

    if (redirectTimer === 0 && submissionStatus.startsWith("Thank you")) {
      navigate("/"); // Redirect to the main page
    }
  }, [redirectTimer, navigate, submissionStatus]); // Dependencies: redirectTimer, navigate, submissionStatus

  useEffect(() => {
    // Prevent body from scrolling
    document.body.style.overflow = "hidden";
    return () => {
      // Restore body scroll when leaving the page
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="feedback-website">
      <Logo page="no-sound" />
      <h1>GUEST FEEDBACK</h1>
      <div className="sections">
        <div className="rating-section">
          <h3>Rate our notification service:</h3>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= websiteRating ? "filled" : ""}`}
                onClick={() => handleWebsiteRatingClick(star)}
              >
                ★
              </span>
            ))}
          </div>
          {/* {websiteRating > 0 && <p>You rated the website {websiteRating} stars.</p>} */}
        </div>
        <div className="rating-section">
          <h3>Rate your tender ride:</h3>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= tenderRating ? "filled" : ""}`}
                onClick={() => handleTenderRatingClick(star)}
              >
                ★
              </span>
            ))}
          </div>
          {/* {tenderRating > 0 && <p>You rated the tender service {tenderRating} stars.</p>} */}
        </div>
        <div className="comment-section">
          <h3>Comments:</h3>
          <textarea
            value={comments}
            onChange={handleCommentsChange}
            placeholder="Would you like to leave us a comment?"
            rows="4"
          />
        </div>
      </div>
      <button
        onClick={handleSubmitFeedback}
        disabled={websiteRating === 0 || tenderRating === 0}
      >
        Submit Feedback
      </button>
      {submissionStatus && (
        <p className="submission-status">{submissionStatus}</p>
      )}
    </div>
  );
}

export default Rating;
