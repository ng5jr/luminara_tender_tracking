import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';
import { Link } from 'react-router-dom';
import back from '../../assets/back.png'; // Try this import
import L from 'leaflet';
import boat from '../../assets/boat.png'; 
import Logo from '../../components/logo';

const defaultPosition = [26.1340261, -80.0945339];

const myIcon = L.icon({
  // iconUrl: './assets/back.png', // Original - likely incorrect
  // iconUrl: '/assets/back.png', // If back.png is in public/assets/
  iconUrl: boat, // Use the imported image variable
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const MyMap = () => {
  return (
    <div className="guest-notifications">
    <Logo />
     
        <Link to="/">
          <div className="map-icon-containers">
            <img src={back} alt="View Tender Map" className="map-icon" />
          </div>
        </Link>
       
    
      <h2>TENDER TRACKING MAP</h2>
     
      <MapContainer
        center={defaultPosition}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={defaultPosition} icon={myIcon}>
          <Popup>
            Ilma
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MyMap;