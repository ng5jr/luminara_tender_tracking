import React, { useEffect, useState } from 'react';

import 'leaflet/dist/leaflet.css';
import './MapPage.css';

import Logo from '../../components/logo.js';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseconfig.js";
import { onSnapshot } from "firebase/firestore"; // added
// import ShipMap from './ShipMap.js';
import ShipMapRTDB from './MapRTDB.js';





const MyMap = () => {
  const [pierLocation, setPierLocation] = useState(null);
  const [portName, setPortName] = useState(""); // added

  useEffect(() => {
    // Replace one-off fetch with real-time listener to know when there's no active port
    const unsubscribe = onSnapshot(
      collection(db, "portDays"),
      (portDaysSnapshot) => {
        const activeDoc = portDaysSnapshot.docs.find(doc => doc.data().isActive);
        if (activeDoc) {
          const pierLoc = activeDoc.data().pierLocation;
          setPortName(activeDoc.data().name || "");
          if (pierLoc && pierLoc.lat && pierLoc.lng) {
            setPierLocation([pierLoc.lat, pierLoc.lng]);
            console.log("Pier Location:", pierLoc);
          } else {
            setPierLocation(null);
          }
        } else {
          // no active port day
          setPierLocation(null);
          setPortName("");
        }
      },
      (error) => {
        console.error("Error listening to portDays:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="guest-notifications">
      <Logo page="no-sound" />
      <h1>TENDER TRACKING MAP</h1>
      <h2 className='map-h2'>Interact with the tenders for Arrival Times</h2>

      <div style={{ position: 'relative', height: '80vh', width: '100%' }}>


        {(!portName || !pierLocation) ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#c7ddf3',
              zIndex: 1000,
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#333',
            }}
          >
            WAITING FOR PORT INFORMATION
          </div>
        ) : <ShipMapRTDB pierLocation={pierLocation} />}
      </div>
      {/* <div style={{ height: '80vh', width: '100%' }}>
        <ShipMap pierLocation={pierLocation} />
      </div> */}
    </div>
  );
};

export default MyMap;