"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSheets = exports.getParameters = exports.parameters = void 0;
const googleapis_1 = require("googleapis");
const path_1 = require("path");
const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const auth = new googleapis_1.google.auth.GoogleAuth({
    keyFilename: (0, path_1.join)(__dirname, '..', '..', 'google-creds.json'),
    scopes
});
exports.parameters = [];
const getParameters = () => exports.parameters;
exports.getParameters = getParameters;
const syncSheets = () => {
    return new Promise((resolve) => {
        googleapis_1.google.sheets('v4').spreadsheets.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            auth,
            includeGridData: true
        }).then((res) => {
            const parameterData = res.data.sheets[0].data[0].rowData;
            const newParameters = [];
            for (let i = 1; i < parameterData.length; i++) {
                const row = parameterData[i].values;
                const key = row[0].formattedValue;
                if (!key)
                    continue;
                const value = row[1].formattedValue;
                newParameters.push({
                    key,
                    value
                });
            }
            const data = { newParameters };
            console.log(data);
            resolve(data);
        });
    });
};
exports.syncSheets = syncSheets;
