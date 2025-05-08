import React, { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../../firebaseconfig";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import notificationSound from "../../assets/notification.mp3";

import "./GuestNotificationsTV.css";
import Logo from "../../components/logo.js";
import FullScren from "../../assets/fullscreen.png"; // Adjust path if needed
import Minimize from "../../assets/minimize.png"; // Adjust path if needed
function GuestNotificationsTV() {
    const [notifications, setNotifications] = useState([]);
    const [latestNotificationId, setLatestNotificationId] = useState(null);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [isImageUploaded, setIsImageUploaded] = useState(false); // New state
    const [imageDisplayMode, setImageDisplayMode] = useState('contain'); // New state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const tvLayoutRef = useRef(null);
    const audioRef = useRef(null);
    // const [soundEnabled, setIsSoundEnabled] = useState(false);

    // useEffect(() => {
    //     audioRef.current = new Audio(notificationSound);
    //     if (audioRef.current) {
    //         audioRef.current.muted = true;
    //     }
    // }, []);

    // const playNotificationSound = useCallback(() => {
    //     if (audioRef.current && soundEnabled) {
    //         audioRef.current
    //             .play()
    //             .catch((error) => console.warn("Audio playback failed:", error));
    //     }
    // }, [soundEnabled]);

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
                        // playNotificationSound();
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
    }, [latestNotificationId]);

    // const enableSound = () => {
    //     setIsSoundEnabled(!soundEnabled);
    //     if (audioRef.current) {
    //         audioRef.current.muted = false;
    //     }
    // };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setUploadedImage(reader.result);
                setIsImageUploaded(true); // Hide upload elements
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleImageDisplayMode = () => {
        setImageDisplayMode(prevMode => prevMode === 'contain' ? 'cover' : 'contain');
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (tvLayoutRef.current.requestFullscreen) {
                tvLayoutRef.current.requestFullscreen()
                    .then(() => setIsFullscreen(true))
                    .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
            } else if (tvLayoutRef.current.mozRequestFullScreen) { /* Firefox */
                tvLayoutRef.current.mozRequestFullScreen();
                setIsFullscreen(true);
            } else if (tvLayoutRef.current.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
                tvLayoutRef.current.webkitRequestFullscreen();
                setIsFullscreen(true);
            } else if (tvLayoutRef.current.msRequestFullscreen) { /* IE/Edge */
                tvLayoutRef.current.msRequestFullscreen();
                setIsFullscreen(true);
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen()
                    .then(() => setIsFullscreen(false))
                    .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
            } else if (document.mozCancelFullScreen) { /* Firefox */
                document.mozCancelFullScreen();
                setIsFullscreen(false);
            } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
                document.webkitExitFullscreen();
                setIsFullscreen(false);
            } else if (document.msExitFullscreen) { /* IE/Edge */
                document.msExitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const getLast10Notifications = () => {
        return notifications.slice(0, 10);
    };

    return (
        <div className="tv-layout" ref={tvLayoutRef}>
            {/* Left side: Image upload and display */}
            <div className={`image-section ${isImageUploaded ? "full-screen" : ""}`}>
                {!isImageUploaded && (
                    <>
                        <h2>Upload and Display Image</h2>
                        <input type="file" accept="image/*" onChange={handleImageUpload} />
                    </>
                )}
                {uploadedImage && (
                    <div className="image-container">
                        <img
                            src={uploadedImage}
                            alt="Uploaded"
                            className={`image-${imageDisplayMode}`}
                            onClick={toggleImageDisplayMode}
                        />
                    </div>
                )}
            </div>

            {/* Right side: Notifications */}
            <div className="guest-notificationstv">
                {/* <Link to="/feedback">
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
        </div> */}
                <Logo />
                <h2>TENDER STATUS NOTIFICATIONS</h2>
                <div onClick={toggleFullscreen} className="screen-toggle">
                    {!isFullscreen ? (
                        <img src={FullScren} alt="fulscreen" className="screen-icon" />
                    ) : (
                        <img src={Minimize} alt="minimize" className="screen-icon" />
                    )}
                </div>

                <audio
                    ref={audioRef}
                    src={notificationSound}
                    style={{ display: "none" }}
                />
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
        </div>
    );
}

export default GuestNotificationsTV;