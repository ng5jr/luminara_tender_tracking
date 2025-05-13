import React, { useState, useEffect, useRef } from "react";
import { db } from "../../firebaseconfig";
import { collection, query, orderBy, where, onSnapshot, getDocs, limit } from "firebase/firestore";
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
  const [portName, setPortName] = useState(""); // <-- Add this line
  const latestIdRef = useRef(null);
  const audioRef = useRef(null);
  const [soundEnabled, setIsSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (audioRef.current) {
      audioRef.current.muted = !soundEnabled;
    }
  }, [soundEnabled]);

  useEffect(() => {
    latestIdRef.current = latestNotificationId;
  }, [latestNotificationId]);

  useEffect(() => {
    let unsubscribePortDays = null;
    let unsubscribeNotifications = null;

    unsubscribePortDays = onSnapshot(
      collection(db, "portDays"),
      (portDaysSnapshot) => {
        const activePortDayDoc = portDaysSnapshot.docs.find(doc => doc.data().isActive);

        if (activePortDayDoc) {
          setPortName(activePortDayDoc.data().name || "");

          // Unsubscribe from previous notifications listener if any
          if (unsubscribeNotifications) unsubscribeNotifications();

          const notificationsQuery = query(
            collection(db, "guestNotifications"),
            where("portDayId", "==", activePortDayDoc.id),
            orderBy("timestamp", "desc"),
            limit(10)
          );

          unsubscribeNotifications = onSnapshot(
            notificationsQuery,
            (querySnapshot) => {
              const notificationsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setNotifications(notificationsData);

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
        } else {
          setNotifications([]);
          setPortName("");
          if (unsubscribeNotifications) unsubscribeNotifications();
        }
      },
      (error) => {
        console.error("Error listening for port days: ", error);
      }
    );

    return () => {
      if (unsubscribePortDays) unsubscribePortDays();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, []);

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
      <h2>{portName ? portName : "Waiting for Port Information"}</h2>
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
