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

const shipIcon = L.icon({
  iconUrl: boat,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const locationIcon = L.icon({
  iconUrl: Location,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const SHIP_POSITION = [38.88103801028676, 1.4653436262053756];

const MyMap = () => {
  const [pierLocation, setPierLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(SHIP_POSITION);

  useEffect(() => {
    const fetchPierLocation = async () => {
      const portDaysSnapshot = await getDocs(collection(db, "portDays"));
      if (!portDaysSnapshot.empty) {
        const doc = portDaysSnapshot.docs[0];
        const pierLoc = doc.data().pierLocation;
        if (pierLoc && pierLoc.lat && pierLoc.lng) {
          const pierPos = [pierLoc.lat, pierLoc.lng];
          setPierLocation(pierPos);

          // Calculate midpoint
          const midLat = (SHIP_POSITION[0] + pierLoc.lat) / 2;
          const midLng = (SHIP_POSITION[1] + pierLoc.lng) / 2;
          setMapCenter([midLat, midLng]);
        } else {
          setMapCenter(SHIP_POSITION);
        }
      }
    };
    fetchPierLocation();
  }, []);

  return (
    <div className="guest-notifications">
      <Logo page="no-sound" />
      {/* 
      <Link to="/">
        <div className="map-icon-containers">
          <img src={back} alt="View Tender Map" className="map-icon" />
        </div>
      </Link> */}

      <h1>TENDER TRACKING MAP</h1>

      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeMapCenter center={mapCenter} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Ship icon at the fixed center */}
        <Marker position={SHIP_POSITION} icon={shipIcon}>
          <Popup>
            Evrima (Ship)
          </Popup>
        </Marker>
        {/* Location icon at the database location */}
        {pierLocation && (
          <Marker position={pierLocation} icon={locationIcon}>
            <Popup>
              Pier Location
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

function ChangeMapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default MyMap;