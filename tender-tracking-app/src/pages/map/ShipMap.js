import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import boat from '../../assets/shipimg.png';
import Location from "../../assets/position.png";
import tender3IconImg from '../../assets/evrimatender.png';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import * as VIAM from '@viamrobotics/sdk';
import './ShipMap.css';
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

const ShipMap = ({ pierLocation }) => {
    const [mapCenter, setMapCenter] = useState(null);
    const [shipPosition, setShipPosition] = useState(null);
    const [tender3Position, setTender3Position] = useState(null);
    const [tender4Position, setTender4Position] = useState(null);
    const [shipHeading, setShipHeading] = useState(0);


    const [tender3SOG, setTender3SOG] = useState(0);
    const [tender3COG, setTender3COG] = useState(0);
    const [tender3LastReceived, setTender3LastReceived] = useState(null);

    const [shipLastReceived, setShipLastReceived] = useState(null);
    const [tender4LastReceived, setTender4LastReceived] = useState(null);
    const [tender4SOG, setTender4SOG] = useState(0);
    const [tender4COG, setTender4COG] = useState(0);

    const shipMarkerRef = useRef(null);
    const tender3MarkerRef = useRef(null);
    const tender4MarkerRef = useRef(null);
    const animationRef = useRef();
    const lastAnimatedPositionRef = useRef(null);

    const ANIMATION_DURATION = 5000;

    useEffect(() => {
        let machine = null;
        let allPgnClient = null;
        let isMounted = true;
        let interval = null;

        const connectViam = async () => {
            machine = await VIAM.createRobotClient({
                host: 'njordlinkplus.u1ho16k8rd.viam.cloud',
                credentials: {
                    type: 'api-key',
                    payload: 'g7wj2rvi8jzujdacjw4kifr4nh2e3qs1',
                    authEntity: '42e9d6a7-549d-4d88-8897-6b088eaeadc5',
                },
                signalingAddress: 'https://app.viam.com:443',
            });
            allPgnClient = new VIAM.SensorClient(machine, 'all-pgn');
        };

        const fetchViamData = async () => {
            if (!allPgnClient) return;
            try {
                const data = await allPgnClient.getReadings();

                // Ship
                const ship = Object.values(data).find(
                    v => v["User ID"] === 215001000 && v.Latitude && v.Longitude
                );
                if (ship && isMounted) {
                    setShipPosition([ship.Latitude, ship.Longitude]);
                    setShipHeading(ship.Heading || 0);
                    setShipLastReceived(new Date());
                    console.log("Ship position:", [ship.Latitude, ship.Longitude], "Ship Heading:", ship.Heading, "Ship Speed:", ship.SOG);
                }

                // Tender 3
                const tender3 = Object.values(data).find(
                    v => v["User ID"] === 982150013 && v.Latitude && v.Longitude
                );
                if (tender3 && isMounted) {
                    setTender3SOG(tender3.SOG ?? 0);
                    setTender3COG(prev => tender3.COG != null ? tender3.COG : prev);
                    setTender3LastReceived(new Date());

                    setTender3Position(prev => {
                        if (!prev || prev[0] !== tender3.Latitude || prev[1] !== tender3.Longitude) {
                            return [tender3.Latitude, tender3.Longitude];
                        }
                        return prev; // Don't update if position hasn't changed
                    });
                    console.log("Tender 3 position:", [tender3.Latitude, tender3.Longitude], "Tender 3 Heading:", tender3.COG, "Tender 3 Speed:", tender3.SOG);
                }

                // Tender 4
                const tender4 = Object.values(data).find(
                    v => v["User ID"] === 982150014 && v.Latitude && v.Longitude
                );
                if (tender4 && isMounted) {
                    setTender4SOG(tender4.SOG ?? 0);
                    setTender4COG(prev => tender4.COG != null ? tender4.COG : prev);
                    setTender4LastReceived(new Date());

                    setTender4Position(prev => {
                        if (!prev || prev[0] !== tender4.Latitude || prev[1] !== tender4.Longitude) {
                            return [tender4.Latitude, tender4.Longitude];
                        }
                        return prev;
                    });
                    console.log("Tender 4 position:", [tender4.Latitude, tender4.Longitude], "Tender 4 Heading:", tender4.COG, "Tender 4 Speed:", tender4.SOG);
                }

            } catch (err) {
                console.error("Error fetching VIAM data:", err);
            }
        };

        connectViam().then(() => {
            fetchViamData();
            interval = setInterval(fetchViamData, 2000);
        });

        return () => {
            isMounted = false;
            if (interval) clearInterval(interval);
            if (machine && machine.close) machine.close();
        };
    }, []);

    useEffect(() => {
        if (!mapCenter && shipPosition && Array.isArray(shipPosition)) {
            setMapCenter(shipPosition);
            lastAnimatedPositionRef.current = shipPosition;
        }
    }, [shipPosition, mapCenter]);

    const animateMarker = (to, duration = ANIMATION_DURATION) => {
        const from = lastAnimatedPositionRef.current;
        if (!from || !to || !shipMarkerRef.current) {
            if (to) {
                shipMarkerRef.current?.setLatLng(to);
                lastAnimatedPositionRef.current = to;
            }
            return;
        }

        const marker = shipMarkerRef.current;
        const start = performance.now();

        function step(now) {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const lat = from[0] + (to[0] - from[0]) * t;
            const lng = from[1] + (to[1] - from[1]) * t;
            const newLatLng = [lat, lng];
            marker.setLatLng(newLatLng);
            lastAnimatedPositionRef.current = newLatLng;

            if (t < 1) {
                animationRef.current = requestAnimationFrame(step);
            }
        }

        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(step);
    };

    useEffect(() => {
        if (shipPosition) {
            animateMarker(shipPosition);
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [shipPosition]);



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

            {/* {tender3Position && (
                <Marker
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
            )} */}

            {pierLocation && (
                <Marker position={pierLocation} icon={locationIcon} rotationAngle={0} rotationOrigin="center">
                    <Popup className="custom-popup">Pier Location</Popup>
                </Marker>
            )}

            {shipPosition && <CenterMapButton position={shipPosition} />}
            {pierLocation && <CenterPierButton position={pierLocation} />}


            {tender3Position && (
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
            )}

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

export default ShipMap;
