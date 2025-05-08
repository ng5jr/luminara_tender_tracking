import React, { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../../firebaseconfig"; // Adjust path if needed
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import notificationSound from "../../assets/notification.mp3"; // Adjust path if needed
// import mapIcon from "../../assets/map.png";
import volume from "../../assets/volume.png"; // Adjust path if needed
import mute from "../../assets/mute.png"; // Adjust path if needed
import { Link } from "react-router-dom"; // Import Link
import "./guestnotifications.css"; // Or your CSS file
import Logo from "../../components/logo.js"; // Adjust path if needed
import rating from "../../assets/rating.png"; // Adjust path if needed

function GuestNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [latestNotificationId, setLatestNotificationId] = useState(null);
  const audioRef = useRef(null);
  const [soundEnabled, setIsSoundEnabled] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio(notificationSound);
    if (audioRef.current) {
      audioRef.current.muted = true;
    }
  }, []); // Removed notificationSound from the dependency array

  const playNotificationSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current
        .play()
        .catch((error) => console.warn("Audio playback failed:", error));
    }
  }, [soundEnabled]);

  useEffect(() => {
    const initializeListener = () => {
      const notificationsColRef = collection(db, "guestNotifications");
      const q = query(notificationsColRef, orderBy("timestamp", "desc"));

      return onSnapshot(
        q,
        (querySnapshot) => {
          const notificationsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(notificationsData);

          if (
            notificationsData.length > 0 &&
            notificationsData[0].id !== latestNotificationId
          ) {
            setLatestNotificationId(notificationsData[0].id);
            playNotificationSound();
          }
        },
        (error) => {
          console.error("Error listening for guest notifications: ", error);
          setTimeout(initializeListener, 5000); // Reconnect after 5 seconds
        }
      );
    };

    const unsubscribe = initializeListener();

    return () => unsubscribe && unsubscribe();
  }, [playNotificationSound, latestNotificationId]);

  const enableSound = () => {
    setIsSoundEnabled(!soundEnabled);
    if (audioRef.current) {
      audioRef.current.muted = false;
    }
  };

  const getLast10Notifications = () => {
    return notifications.slice(0, 10);
  };

  return (
    <div className="guest-notifications">
      {/* <Link to="/map">
         <div className="map-icon-container">
         <img src={mapIcon} alt="View Tender Map" className="map-icon" />
         </div>
         </Link>  */}
      <Link to="/feedback">
        <div className="feedback-icon-container">
          <img src={rating} alt="View Tender Map" className="rating-icon" />
        </div>
      </Link>
      <div onClick={enableSound} className="volume">
        {soundEnabled ? (
          <img src={volume} alt="volume" className="volume-icon" />
        ) : (
          <img src={mute} alt="volume" className="volume-icon" />
        )}
      </div>
      <Logo />
      <h2>TENDER STATUS NOTIFICATIONS</h2>
      <audio
        ref={audioRef}
        src={notificationSound}
        style={{ display: "none" }}
      />{" "}
      {/* Add audio element, hide it */}
      <ul className="notification-list">
        {getLast10Notifications().map((notification) => (
          <li
            key={notification.id}
            className={`notification-item ${notification.direction === "SHORESIDE"
              ? "shoreside-notification"
              : notification.direction === "SHIPSIDE"
                ? "shipside-notification"
                : "custom-notification"
              } ${notification.id === latestNotificationId
                ? "blinking-notification"
                : ""
              }`} // Add blinking class conditionally
          >
            <p className="notification-message">{notification.message}</p>
            <p className="notification-time">
              {notification.timestamp?.toDate()?.toLocaleString(undefined, {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GuestNotifications;
