const padayon = require("../services/padayon"),
    path = require("path"),
    base = path.basename(__filename, ".js"),
    _ = require("lodash"),
    {
        getAllRegions,
        getAllProvinces,
        getMunicipalitiesByProvince,
        getBarangaysByMunicipality,
        getBarangaysByMunicipalityAndProvince,
    } = require("@aivangogh/ph-address");


module.exports.regions = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        response.data = getAllRegions();
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Address::regions",
            error,
            req,
            res
        );
    }
};

module.exports.provinces = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        response.data = getAllProvinces();
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Address::provinces",
            error,
            req,
            res
        );
    }
};

module.exports.municipalities = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        response.data = getMunicipalitiesByProvince(req.params.psgcCode);
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Address::municipalities",
            error,
            req,
            res
        );
    }
};

module.exports.barangays = async (req, res) => {
    try {
        let response = { success: true, code: 200 };

        response.data = getBarangaysByMunicipality(req.params.psgcCode);
        return response;
    } catch (error) {
        padayon.ErrorHandler(
            "Controller::Address::barangays",
            error,
            req,
            res
        );
    }
};
