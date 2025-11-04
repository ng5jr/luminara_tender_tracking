import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import boat from '../../assets/shipimg.png';
import Location from "../../assets/position.png";
import tender3IconImg from '../../assets/Luminaratender.png';
import 'leaflet-rotatedmarker'
import 'leaflet/dist/leaflet.css';
import * as VIAM from '@viamrobotics/sdk';
import './ShipMap.css';

const shipIcon = L.icon({
    iconUrl: boat,
    iconSize: [80, 17], // Adjusted size for better visibility
    iconAnchor: [40, 9],
    popupAnchor: [0, -9],
});

const locationIcon = L.icon({
    iconUrl: Location,
    iconSize: [24, 32],
    iconAnchor: [12, 16],
    popupAnchor: [0, -16],
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
    const [tender3Target, setTender3Target] = useState(null);
    const [tender4Position, setTender4Position] = useState(null);
    const [shipHeading, setShipHeading] = useState(0);
    const [shipLastReceived, setShipLastReceived] = useState(null);

    useEffect(() => {
        let machine = null;
        let allPgnClient = null;
        let isMounted = true;

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
                const allPgnReturnValue = await allPgnClient.getReadings();

                // Ship
                const ship = Object.values(allPgnReturnValue).find(
                    v => v["User ID"] === 215001000 && v.Latitude && v.Longitude
                );
                if (ship && isMounted) {
                    setShipPosition([ship.Latitude, ship.Longitude]);
                    setShipHeading(ship.Heading || 0);
                    setShipLastReceived(new Date()); // Guarda el momento actual
                    console.log("Ship position:", [ship.Latitude, ship.Longitude], "Ship Heading:", ship.Heading);
                }

                // Tender 3
                const tender3 = Object.values(allPgnReturnValue).find(
                    v => v["User ID"] === 982150013 && v.Latitude && v.Longitude
                );
                if (tender3 && isMounted) {
                    const newPos = [tender3.Latitude, tender3.Longitude];
                    setTender3Target(newPos);
                    setTender3Position(newPos); // Always update position
                    console.log("Tender 3 position:", [tender3.Latitude, tender3.Longitude]);
                } else if (isMounted) {
                    // Do NOT set to null, keep previous position

                }

                // Tender 4
                const tender4 = Object.values(allPgnReturnValue).find(
                    v => v["User ID"] === 982150014 && v.Latitude && v.Longitude
                );
                if (tender4 && isMounted) {
                    setTender4Position([tender4.Latitude, tender4.Longitude]); // Always update position
                    console.log("Tender 4 position:", [tender4.Latitude, tender4.Longitude]);
                } else if (isMounted) {
                    // Do NOT set to null, keep previous position

                }


            } catch (err) {
                console.error("Error fetching VIAM data:", err);
            }
        };

        connectViam().then(() => {
            fetchViamData(); // Initial fetch
            const interval = setInterval(fetchViamData, 5000); // Refresh every 10 seconds

            // Cleanup
            return () => {
                isMounted = false;
                clearInterval(interval);
                if (machine) machine.close && machine.close();
            };
        });

        return () => {
            isMounted = false;
            if (machine) machine.close && machine.close();
        };
    }, []);

    // Only set map center the first time shipPosition is set
    useEffect(() => {
        if (!mapCenter && shipPosition && Array.isArray(shipPosition)) {
            setMapCenter(shipPosition);
        }
    }, [shipPosition, mapCenter]);

    if (!mapCenter || !shipPosition) {
        return (
            <div
                className="loading-container"
            >
                <span className="loader"></span>
            </div>
        );
    }

    function CenterMapButton({ position }) {
        const map = useMap();
        return (
            <button
                className="center-map-btn"
                onClick={() => {
                    if (position) map.setView(position, map.getZoom());
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle' }}>
                    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="#fff" />
                    <line x1="12" y1="2" x2="12" y2="6" stroke="#fff" strokeWidth="2" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="#fff" strokeWidth="2" />
                    <line x1="2" y1="12" x2="6" y2="12" stroke="#fff" strokeWidth="2" />
                    <line x1="18" y1="12" x2="22" y2="12" stroke="#fff" strokeWidth="2" />
                </svg>
                <span>Luminara</span>
            </button>
        );
    }

    function CenterPierButton({ position }) {
        const map = useMap();
        return (
            <button
                className="center-map-btn pier-btn"
                style={{ top: 60 }} // Para que no se superponga con el otro botón
                onClick={() => {
                    if (position) map.setView(position, map.getZoom());
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ verticalAlign: 'middle' }}>
                    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill="#fff" />
                    <line x1="12" y1="2" x2="12" y2="6" stroke="#fff" strokeWidth="2" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke="#fff" strokeWidth="2" />
                    <line x1="2" y1="12" x2="6" y2="12" stroke="#fff" strokeWidth="2" />
                    <line x1="18" y1="12" x2="22" y2="12" stroke="#fff" strokeWidth="2" />
                </svg>
                <span>Pier</span>
            </button>
        );
    }

    return (
        <MapContainer
            center={mapCenter}
            zoom={16}
            minZoom={10}
            maxZoom={20}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg"
                attribution='&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker
                position={shipPosition}
                icon={shipIcon}
                rotationAngle={shipHeading - 90}
                rotationOrigin="center"
            >
                <Popup className="custom-popup">
                    Luminara<br />
                    {shipLastReceived && (
                        <span style={{ fontSize: '0.7em', color: '#aaa' }}>
                            LAST RECEIVED: {shipLastReceived.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                    )}
                </Popup>
            </Marker>
            {tender3Position && (
                <Marker position={tender3Position} icon={tenderIcon}>
                    <Popup className="custom-popup">
                        Tender 3
                    </Popup>
                </Marker>
            )}
            {tender4Position && (
                <Marker position={tender4Position} icon={tenderIcon}>
                    <Popup className="custom-popup">
                        Tender 4
                    </Popup>
                </Marker>
            )}
            {pierLocation && (
                <Marker position={pierLocation} icon={locationIcon}>
                    <Popup className="custom-popup">
                        Pier Location
                    </Popup>
                </Marker>
            )}
            {shipPosition && <CenterMapButton position={shipPosition} />}
            {pierLocation && <CenterPierButton position={pierLocation} />}
        </MapContainer>
    );
};

export default ShipMap;