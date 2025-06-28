export const TELEMETRY_API_BASE_URL = "https://telemetry-api.dimo.zone/query";
export const commonQueries = {
  avaiableSignals: {
    label: "Getting a list of available signals for a specific vehicle",
    query: `
    query {
      availableSignals(tokenId: <tokenId>)
    }
    `,
  },
  signals: {
    label: "Getting a selection of available signals for a specific vehicle",
    query: `
      query {
        signals(
          tokenId: <tokenId>,
          interval: "<interval>",
          from: "<startDate>", to: "<endDate>"
        ) {
          speed(agg: MED)
          powertrainType(agg: RAND)
          powertrainRange(agg: MIN)
          exteriorAirTemperature(agg: MAX)
          vehicleIdentificationModel(agg: RAND)
          chassisAxleRow1WheelLeftTirePressure(agg: MIN)
          timestamp
        }
      }
    `,
  },
  getDailyAvgSpeedOfVehicle: {
    label: "Getting the average speed of a vehicle over a specific time period",
    query: `
      query {
        signals(
          tokenId: <tokenId>,
          from: "<startDate>", to: "<endDate>",
          interval: "<interval>"
        ) {
          timestamp
          avgSpeed: speed(agg: AVG)
        }
      }
    `,
  },
  getMaxSpeedOfVehicle: {
    label: "Getting the maximum speed of a vehicle over a specific time period",
    query: `
      query {
        signals(
          tokenId: <tokenId>,
          from: "<startDate>", to: "<endDate>",
          interval: "<interval>"
        ) {
          timestamp
          maxSpeed: speed(agg: MAX)
        }
      }
    `,
  },
  getVinVcLatest: {
    label: "Getting the latest VIN and Vehicle Configuration for a specific vehicle. You should use this after generating vinVc from the Attestation API",
    query: `
      query {
        vinVCLatest(tokenId: <tokenId>) {
          vin
        }
      }
    `,
  },
};
