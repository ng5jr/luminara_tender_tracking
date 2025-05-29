import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import boat from '../../assets/boat.png';
import Location from "../../assets/location.png";
import tender3IconImg from '../../assets/tender.png';
import tender4IconImg from '../../assets/tender.png';
import 'leaflet/dist/leaflet.css';
import * as VIAM from '@viamrobotics/sdk';

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

const tender3Icon = L.icon({
    iconUrl: tender3IconImg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const tender4Icon = L.icon({
    iconUrl: tender4IconImg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

function ChangeMapCenter({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

const ShipMap = ({ pierLocation }) => {
    const [mapCenter, setMapCenter] = useState(null);
    const [shipPosition, setShipPosition] = useState(null);
    const [tender3Position, setTender3Position] = useState(null);
    const [tender4Position, setTender4Position] = useState(null);
    const [hasCentered, setHasCentered] = useState(false);

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
                    if (!hasCentered) {
                        setMapCenter([ship.Latitude, ship.Longitude]);
                        setHasCentered(true);
                    }
                    console.log("Ship position:", [ship.Latitude, ship.Longitude]);
                }

                // Tender 3
                const tender3 = Object.values(allPgnReturnValue).find(
                    v => v["User ID"] === 982150013 && v.Latitude && v.Longitude
                );
                if (tender3 && isMounted) {
                    setTender3Position([tender3.Latitude, tender3.Longitude]);
                    console.log("Tender 3 position:", [tender3.Latitude, tender3.Longitude]);
                } else if (isMounted) {
                    // Do NOT set to null, keep previous position
                    console.log("Tender 3 position unchanged.");
                }

                // Tender 4
                const tender4 = Object.values(allPgnReturnValue).find(
                    v => v["User ID"] === 982150014 && v.Latitude && v.Longitude
                );
                if (tender4 && isMounted) {
                    setTender4Position([tender4.Latitude, tender4.Longitude]);
                    console.log("Tender 4 position:", [tender4.Latitude, tender4.Longitude]);
                } else if (isMounted) {
                    // Do NOT set to null, keep previous position
                    console.log("Tender 4 position unchanged.");
                }

                console.log("All User IDs in data:", Object.values(allPgnReturnValue).map(v => v["User ID"]));
            } catch (err) {
                console.error("Error fetching VIAM data:", err);
            }
        };

        connectViam().then(() => {
            fetchViamData(); // Initial fetch
            const interval = setInterval(fetchViamData, 10000); // Refresh every 10 seconds

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
    }, [hasCentered]);

    if (!mapCenter || !shipPosition) {
        return (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#222',
                    color: '#fff',
                    fontSize: '1.5rem',
                    borderRadius: '8px'
                }}
            >
                Loading map...
            </div>
        );
    }

    return (
        <MapContainer
            center={mapCenter}
            zoom={14}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            {(!hasCentered && mapCenter) && <ChangeMapCenter center={mapCenter} />}
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={shipPosition} icon={shipIcon}>
                <Popup>
                    Evrima (Ship)
                </Popup>
            </Marker>
            {tender3Position && (
                <Marker position={tender3Position} icon={tender3Icon}>
                    <Popup>
                        Tender 3
                    </Popup>
                </Marker>
            )}
            {tender4Position && (
                <Marker position={tender4Position} icon={tender4Icon}>
                    <Popup>
                        Tender 4
                    </Popup>
                </Marker>
            )}
            {pierLocation && (
                <Marker position={pierLocation} icon={locationIcon}>
                    <Popup>
                        Pier Location
                    </Popup>
                </Marker>
            )}
        </MapContainer>
    );
};

export default ShipMap;