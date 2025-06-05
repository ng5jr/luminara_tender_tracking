import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import boat from '../../assets/shipimg.png';
import Location from "../../assets/position.png";
import tender3IconImg from '../../assets/evrimatender.png';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { rtdb } from '../../firebaseconfig'; import './ShipMap.css';
import PredictedMovingMarker from './PredictedMovingMarker.js';

const shipIcon = L.icon({
    iconUrl: boat,
    iconSize: [80, 17],
    iconAnchor: [40, 9],
    popupAnchor: [0, -9],
});

const locationIcon = L.icon({
    iconUrl: Location,
    iconSize: [24, 32],
    iconAnchor: [12, 32], // <-- bottom center
    popupAnchor: [0, -32],
});

const tenderIcon = L.icon({
    iconUrl: tender3IconImg,
    iconSize: [30, 15],
    iconAnchor: [15, 7],
    popupAnchor: [0, -7],
});

const ShipMapRTDB = ({ pierLocation }) => {
    const [mapCenter, setMapCenter] = useState(null);
    const [shipPosition, setShipPosition] = useState(null);
    const [shipHeading, setShipHeading] = useState(0);
    const [shipLastReceived, setShipLastReceived] = useState(null);
    const [tender3Position, setTender3Position] = useState(null);
    const [tender3Heading, setTender3Heading] = useState(0);
    const [tender3LastReceived, setTender3LastReceived] = useState(null);
    const [tender4Position, setTender4Position] = useState(null);
    const [tender4Heading, setTender4Heading] = useState(0);
    const [tender4LastReceived, setTender4LastReceived] = useState(null);

    const shipMarkerRef = useRef(null);
    const tender3MarkerRef = useRef(null);
    const tender4MarkerRef = useRef(null);
    const animationRef = useRef();
    const lastAnimatedPositionRef = useRef(null);

    const ANIMATION_DURATION = 5000;

    useEffect(() => {
        const db = rtdb;
        const shipRef = ref(db, 'positions/ship/latest');
        const tender3Ref = ref(db, 'positions/tender3/latest');
        const tender4Ref = ref(db, 'positions/tender4/latest');

        const handleShipUpdate = (snapshot) => {
            const data = snapshot.val();
            if (data && data.lat && data.lon) {
                setShipPosition([data.lat, data.lon]);
                setShipHeading(data.heading || 0);
                setShipLastReceived(new Date(data.timestamp));
                console.log('RTDB Ship position:', [data.lat, data.lon], 'Ship Heading:', data.heading, 'Ship Speed:', data.speed, "Received at:", new Date().toLocaleTimeString());
            }
        };
        const handleTender3Update = (snapshot) => {
            const data = snapshot.val();
            if (data && data.lat && data.lon) {
                setTender3Position([data.lat, data.lon]);
                setTender3Heading(data.heading || 0);
                setTender3LastReceived(new Date(data.timestamp));
                console.log('Tender 3 position:', [data.lat, data.lon], 'Tender 3 Heading:', data.heading, 'Tender 3 Speed:', data.speed);
            }
        };
        const handleTender4Update = (snapshot) => {
            const data = snapshot.val();
            if (data && data.lat && data.lon) {
                setTender4Position([data.lat, data.lon]);
                setTender4Heading(data.heading || 0);
                setTender4LastReceived(new Date(data.timestamp));
                console.log('Tender 4 position:', [data.lat, data.lon], 'Tender 4 Heading:', data.heading, 'Tender 4 Speed:', data.speed);
            }
        };

        onValue(shipRef, handleShipUpdate);
        onValue(tender3Ref, handleTender3Update);
        onValue(tender4Ref, handleTender4Update);

        return () => {
            off(shipRef, 'value', handleShipUpdate);
            off(tender3Ref, 'value', handleTender3Update);
            off(tender4Ref, 'value', handleTender4Update);
        };
    }, []);

    useEffect(() => {
        if (!mapCenter && shipPosition && Array.isArray(shipPosition)) {
            setMapCenter(shipPosition);
            lastAnimatedPositionRef.current = shipPosition;
        }
    }, [shipPosition, mapCenter]);

    if (!mapCenter || !shipPosition) {
        return (
            <div className="loading-container">
                <span className="loader"></span>
            </div>
        );
    }

    function CenterMapButton({ position }) {
        const map = useMap();
        return (
            <button className="center-map-btn" onClick={() => map.flyTo(position, map.getZoom(), { animate: true, duration: 1.5 })}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="#fff" />
                    <line x1="12" y1="2" x2="12" y2="6" stroke="#fff" strokeWidth="2" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="#fff" strokeWidth="2" />
                    <line x1="2" y1="12" x2="6" y2="12" stroke="#fff" strokeWidth="2" />
                    <line x1="18" y1="12" x2="22" y2="12" strokeWidth="2" />
                </svg>
                <span>Evrima</span>
            </button>
        );
    }

    function CenterPierButton({ position }) {
        const map = useMap();
        return (
            <button
                className="center-map-btn pier-btn"
                style={{ top: 60 }}
                onClick={() => map.flyTo(position, 16, { animate: true, duration: 1.5 })}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="#fff" />
                    <line x1="12" y1="2" x2="12" y2="6" stroke="#fff" strokeWidth="2" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="#fff" strokeWidth="2" />
                    <line x1="2" y1="12" x2="6" y2="12" stroke="#fff" strokeWidth="2" />
                    <line x1="18" y1="12" x2="22" y2="12" strokeWidth="2" />
                </svg>
                <span>Pier</span>
            </button>
        );
    }

    return (
        <MapContainer
            center={mapCenter}
            zoom={16}
            minZoom={14}
            maxZoom={16.5}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg??api_key=b86c5acf-0c86-4560-b72f-5657b6b741e5"
                attribution='&copy; CNES, Airbus DS, PlanetObserver, Copernicus | &copy; <a href="https://www.stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker
                key={shipHeading} // <-- Add this line
                position={shipPosition}
                icon={shipIcon}
                rotationAngle={shipHeading - 90}
                rotationOrigin="center"
                ref={shipMarkerRef}
                zIndexOffset={100}
            >
                <Popup className="custom-popup">
                    Evrima<br />
                    {shipLastReceived && (
                        <span style={{ fontSize: '0.7em', color: '#aaa' }}>
                            LAST RECEIVED: {shipLastReceived.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                    )}
                </Popup>
            </Marker>

            {tender3Position && (
                <Marker
                    key={tender3Heading}
                    position={tender3Position}
                    icon={tenderIcon}
                    rotationAngle={tender3Heading - 90}
                    rotationOrigin="center"
                    ref={tender3MarkerRef}
                    zIndexOffset={1001}
                >
                    <Popup className="custom-popup">
                        Tender 3<br />
                        {tender3LastReceived && (
                            <span style={{ fontSize: '0.7em', color: '#aaa' }}>
                                LAST RECEIVED: {tender3LastReceived.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                        )}
                    </Popup>
                </Marker>
            )}
            {tender4Position && (
                <Marker
                    key={tender4Heading}
                    position={tender4Position}
                    icon={tenderIcon}
                    rotationAngle={tender4Heading - 90}
                    rotationOrigin="center"
                    ref={tender4MarkerRef}
                    zIndexOffset={1002}
                >
                    <Popup className="custom-popup">
                        Tender 4<br />
                        {tender4LastReceived && (
                            <span style={{ fontSize: '0.7em', color: '#aaa' }}>
                                LAST RECEIVED: {tender4LastReceived.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                        )}
                    </Popup>
                </Marker>
            )}

            {pierLocation && (
                <Marker position={pierLocation} icon={locationIcon} rotationAngle={0} rotationOrigin="center">
                    <Popup className="custom-popup">Pier Location</Popup>
                </Marker>
            )}

            {shipPosition && <CenterMapButton position={shipPosition} />}
            {pierLocation && <CenterPierButton position={pierLocation} />}


            {/* {tender3Position && (
                <PredictedMovingMarker
                    position={tender3Position}
                    sog={tender3SOG}
                    cog={tender3COG}
                    lastReceived={tender3LastReceived}
                    icon={tenderIcon}
                    zIndexOffset={1001}
                    name="Tender 3"
                    markerRef={tender3MarkerRef}
                    shipPosition={shipPosition}
                    pierLocation={pierLocation}
                />
            )}
            {tender4Position && (
                <PredictedMovingMarker
                    position={tender4Position}
                    sog={tender4SOG}
                    cog={tender4COG}
                    lastReceived={tender4LastReceived}
                    icon={tenderIcon}
                    zIndexOffset={2002}
                    name="Tender 4"
                    markerRef={tender4MarkerRef}
                    shipPosition={shipPosition}
                    pierLocation={pierLocation}
                />
            )} */}

            <LogZoom />
        </MapContainer>
    );
};

const LogZoom = () => {
    const map = useMap();
    useEffect(() => {
        const onZoom = () => {
            console.log('Current zoom:', map.getZoom());
        };
        map.on('zoomend', onZoom);
        // Log initial zoom
        console.log('Initial zoom:', map.getZoom());
        return () => {
            map.off('zoomend', onZoom);
        };
    }, [map]);
    return null;
};

export default ShipMapRTDB;
