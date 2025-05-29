import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';
import { Link } from 'react-router-dom';
import back from '../../assets/back.png';
import L from 'leaflet';
import boat from '../../assets/boat.png';
import Logo from '../../components/logo';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseconfig";
import Location from "../../assets/location.png";
import ShipMap from './ShipMap.js';



const SHIP_POSITION = [38.88103801028676, 1.4653436262053756];

const MyMap = () => {
  const [pierLocation, setPierLocation] = useState(null);

  useEffect(() => {
    const fetchPierLocation = async () => {
      const portDaysSnapshot = await getDocs(collection(db, "portDays"));
      if (!portDaysSnapshot.empty) {
        const doc = portDaysSnapshot.docs[0];
        const pierLoc = doc.data().pierLocation;
        if (pierLoc && pierLoc.lat && pierLoc.lng) {
          setPierLocation([pierLoc.lat, pierLoc.lng]);
        }
      }
    };
    fetchPierLocation();
  }, []);

  return (
    <div className="guest-notifications">
      <Logo page="no-sound" />
      <h1>TENDER TRACKING MAP</h1>
      <div style={{ height: '80vh', width: '100%' }}>
        <ShipMap pierLocation={pierLocation} />
      </div>
    </div>
  );
};

export default MyMap;