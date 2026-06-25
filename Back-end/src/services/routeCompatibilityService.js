const AVERAGE_URBAN_SPEED_KMH = 30;
const MAX_EXTRA_ROUTE_MINUTES = 5;
const BOARDING_MINUTES = 3;

// HP-MAPS-001 | Compatibilidade de rota no backend. O frontend coleta pontos
// pelo Google Maps; aqui usamos coordenadas para estimar o desvio maximo.

function toNumber(value) {
    if (value === null || value === undefined || value === '') return null;

    const numberValue = Number(value);

    return Number.isNaN(numberValue) ? null : numberValue;
}

function hasCoordinates(point) {
    return (
        toNumber(point?.latitude) !== null
        && toNumber(point?.longitude) !== null
    );
}

function distanceKm(pointA, pointB) {
    const earthRadiusKm = 6371;
    const latA = toNumber(pointA.latitude) * Math.PI / 180;
    const latB = toNumber(pointB.latitude) * Math.PI / 180;
    const deltaLat = (toNumber(pointB.latitude) - toNumber(pointA.latitude)) * Math.PI / 180;
    const deltaLng = (toNumber(pointB.longitude) - toNumber(pointA.longitude)) * Math.PI / 180;

    const haversine =
        Math.sin(deltaLat / 2) ** 2
        + Math.cos(latA) * Math.cos(latB) * Math.sin(deltaLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function minutesFromKm(km) {
    return (km / AVERAGE_URBAN_SPEED_KMH) * 60;
}

function calculateCompatibility(ride, passengerRoute = {}) {
    // HP-MAPS-002 | Simula compatibilidade por coordenadas ate o backend usar
    // Directions API. Se faltar coordenada, nao bloqueia busca por texto.
    const driverOrigin = {
        latitude: ride.originLat,
        longitude: ride.originLng
    };
    const driverDestination = {
        latitude: ride.destinationLat,
        longitude: ride.destinationLng
    };
    const pickup = {
        latitude: passengerRoute.pickupLatitude ?? passengerRoute.originLat,
        longitude: passengerRoute.pickupLongitude ?? passengerRoute.originLng
    };
    const dropoff = {
        latitude: passengerRoute.dropoffLatitude ?? passengerRoute.destinationLat,
        longitude: passengerRoute.dropoffLongitude ?? passengerRoute.destinationLng
    };

    if (
        !hasCoordinates(driverOrigin)
        || !hasCoordinates(driverDestination)
        || !hasCoordinates(pickup)
        || !hasCoordinates(dropoff)
    ) {
        return {
            compatible: true,
            estimatedExtraRouteMinutes: 0,
            estimatedBoardingMinutes: BOARDING_MINUTES,
            estimatedTotalOperationalMinutes: BOARDING_MINUTES * 2,
            reason: 'coordinates_unavailable'
        };
    }

    const directMinutes = minutesFromKm(distanceKm(driverOrigin, driverDestination));
    const withPassengerMinutes = minutesFromKm(
        distanceKm(driverOrigin, pickup)
        + distanceKm(pickup, dropoff)
        + distanceKm(dropoff, driverDestination)
    );
    const estimatedExtraRouteMinutes = Math.max(0, withPassengerMinutes - directMinutes);

    return {
        compatible: estimatedExtraRouteMinutes <= MAX_EXTRA_ROUTE_MINUTES,
        estimatedExtraRouteMinutes: Number(estimatedExtraRouteMinutes.toFixed(2)),
        estimatedBoardingMinutes: BOARDING_MINUTES,
        estimatedTotalOperationalMinutes: BOARDING_MINUTES * 2,
        reason: estimatedExtraRouteMinutes <= MAX_EXTRA_ROUTE_MINUTES
            ? 'within_limit'
            : 'extra_route_above_limit'
    };
}

module.exports = {
    calculateCompatibility,
    MAX_EXTRA_ROUTE_MINUTES,
    BOARDING_MINUTES
};
