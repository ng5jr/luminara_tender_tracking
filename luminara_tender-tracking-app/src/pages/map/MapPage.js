import React, { useEffect, useState } from 'react';

import 'leaflet/dist/leaflet.css';
import './MapPage.css';

import Logo from '../../components/logo.js';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebaseconfig.js";

// import ShipMap from './ShipMap.js';
import ShipMapRTDB from './MapRTDB.js';





const MyMap = () => {
  const [pierLocation, setPierLocation] = useState(null);

  useEffect(() => {
    const fetchPierLocation = async () => {
      const q = query(
        collection(db, "portDays"),
        where("isActive", "==", true)
      );
      const portDaysSnapshot = await getDocs(q);
      if (!portDaysSnapshot.empty) {
        const doc = portDaysSnapshot.docs[0];
        const pierLoc = doc.data().pierLocation;
        if (pierLoc && pierLoc.lat && pierLoc.lng) {
          setPierLocation([pierLoc.lat, pierLoc.lng]);
          console.log("Pier Location:", pierLoc);
        }
      }
    };
    fetchPierLocation();
  }, []);

  return (
    <div className="guest-notifications">
      <Logo page="no-sound" />
      <h1>TENDER TRACKING MAP</h1>
      <h2 className='map-h2'>Interact with the tenders for Arrival Times</h2>
      <div style={{ height: '80vh', width: '100%' }}>
        <ShipMapRTDB pierLocation={pierLocation} />
      </div>
      {/* <div style={{ height: '80vh', width: '100%' }}>
        <ShipMap pierLocation={pierLocation} />
      </div> */}
    </div>
  );
};

export default MyMap;