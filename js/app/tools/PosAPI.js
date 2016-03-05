/**
 * @class PosAPI
 * @description Position API library
 */
define([], {
    /**
     * @public
     * @description SGP4 algorithm realisation
     * @param {Object}              sat_record          Satellite record object
     * @param {Number}              mins_since_epoch    Minutes since epoch.
     *                                                  Used to determine satellite parameters in desired time.
     * @param {Cesium.JulianDate}   jd_now              Julian Date now
     * @returns {{
         *      record: {Object},
         *      pos: {{
         *          cartesian: {Array},
         *          cartographic: {{
         *              lon: {String},
         *              lat: {String},
         *              alt: {String}
         *          }}
         *       }},
         *       vel: {Array},
         *       coverage_angle: Number   Angle (in degrees) of terrain that is covered by satellite
         * }}
     */
    useSGP4: function (sat_record, mins_since_epoch, jd_now) {
        var sgp_result          = sgp4lib.sgp4(sat_record, mins_since_epoch),
            pos_array           = sgp_result[1],
        // sgp4 algorithm returns position in TEME format
            cartesian_pos       = this.convertECITEMEtoECEF(Cesium.Cartesian3.fromArray([
                pos_array[0] * 1000,
                pos_array[1] * 1000,
                pos_array[2] * 1000
            ]), jd_now),
            cartographic_pos    = this.convertCartesianToCartographicDegrees(cartesian_pos),
            alt                 = Number(cartographic_pos.alt),
        // angle between two radius-lines held from earth center to tangent point in same X axis
            coverage_angle      = 2 * Math.asin(
                Math.sqrt(2 * sgp4lib.RADIUS * alt + Math.pow(alt, 2)) /
                    (sgp4lib.RADIUS + alt)) * 180 / Math.PI;

        return {
            record          : sgp_result[0],
            pos             : {
                cartesian       : cartesian_pos,
                cartographic    : cartographic_pos
            },
            vel             : sgp_result[2],
            coverage_angle  : coverage_angle
        };
    },
    /**
     * @public
     * @description Convert Earth-Centered Inertial (ECI) True Equator Mean Equanox (TEME) position format to
     *              Earth-Centered Earth-Fixed (ECEF)
     * @param {Cesium.Cartesian3}   cart3   Position to be converted
     * @param {Cesium.JulianDate}   jd_now  Julian Date now
     * @returns {Array} Cartesian3 position
     */
    convertECITEMEtoECEF: function (cart3, jd_now) {
        var transformed_matrix = Cesium.Matrix4.fromRotationTranslation(
                Cesium.Transforms.computeTemeToPseudoFixedMatrix(jd_now), Cesium.Cartesian3.ZERO),
            cart2 = Cesium.Transforms.pointToWindowCoordinates(Cesium.Matrix4.IDENTITY,
                transformed_matrix, cart3);

        return [ cart2.x, cart2.y, cart3.z ];
    },
    /**
     * @public
     * @description Convert XYZ position object from Cartesian to Cartographic coordinate system
     * @param {Array.<Number>} cart3 Cartesian position array (x, y, z)
     * @returns {{lon: String|Number, lat: String|Number, alt: String|Number}} Cartographic position object (in degrees)
     */
    convertCartesianToCartographicDegrees: function (cart3) {
        var cartg,
            degrees_in_rad = 180 / Math.PI;

        if (Array.isArray(cart3)) {
            cart3 = Cesium.Cartesian3.fromArray(cart3);
        }

        cartg = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cart3);

        return {
            lon: (cartg.longitude * degrees_in_rad).toFixed(3),
            lat: (cartg.latitude * degrees_in_rad).toFixed(3),
            alt: parseInt(cartg.height)
        };
    },
    /**
     * @public
     * @descriptoin Convert position from Cartographic (in degrees) to Cartesian coordinate system
     * @param {{lon: String|Number, lat: String|Number, alt: String|Number}} cartg_deg Cartographic position in degrees
     * @returns {Cesium.Cartesian3}
     */
    convertCartographicDegreesToCartesian: function (cartg_deg) {
        var cartg = Cesium.Cartographic.fromDegrees(
            cartg_deg.lon, cartg_deg.lat, cartg_deg.alt);

        return Cesium.Ellipsoid.WGS84.cartographicToCartesian(cartg);
    }
});