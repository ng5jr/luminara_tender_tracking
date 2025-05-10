import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseconfig";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import notificationSound from "../../assets/notification.mp3";
import volume from "../../assets/volume.png";
import mute from "../../assets/mute.png";
import { Link } from "react-router-dom";
import "./guestnotifications.css";
import Logo from "../../components/logo.js";
import rating from "../../assets/rating.png";

function GuestNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [latestNotificationId, setLatestNotificationId] = useState(null);
  const latestIdRef = useRef(null);
  const audioRef = useRef(null);
  const [soundEnabled, setIsSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);

  // Keep soundEnabledRef in sync
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (audioRef.current) {
      audioRef.current.muted = !soundEnabled;
    }
  }, [soundEnabled]);

  // Track latestNotificationId in a ref to avoid re-creating listener
  useEffect(() => {
    latestIdRef.current = latestNotificationId;
  }, [latestNotificationId]);

  // Set up Firestore listener ONCE
  useEffect(() => {
    const notificationsColRef = collection(db, "guestNotifications");
    const q = query(notificationsColRef, orderBy("timestamp", "desc"), limit(10));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notificationsData);

        // Play sound only for new notification
        if (
          notificationsData.length > 0 &&
          notificationsData[0].id !== latestIdRef.current
        ) {
          setLatestNotificationId(notificationsData[0].id);
          if (audioRef.current && soundEnabledRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
          }
        }
      },
      (error) => {
        console.error("Error listening for guest notifications: ", error);
      }
    );

    return () => unsubscribe();
  }, []); // Only run once

  // Toggle sound and mute/unmute audio element
  const enableSound = () => {
    setIsSoundEnabled((prev) => !prev);
  };

  return (
    <div className="guest-notifications">
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
        muted={!soundEnabled}
      />
      <ul className="notification-list">
        {notifications.map((notification) => (
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
              }`}
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
