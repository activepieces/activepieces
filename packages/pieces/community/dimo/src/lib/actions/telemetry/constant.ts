export const TELEMETRY_API_BASE_URL = "https://telemetry-api.dimo.zone/query";

export const commonQueries = {
  avaiableSignals: `
    query {
      availableSignals(tokenId: <tokenId>)
    }
  `,
  signals: `
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
  getDailyAvgSpeedOfVehicle: `
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
  getMaxSpeedOfVehicle: `
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
  getVinVcLatest: `
    query {
      vinVCLatest(tokenId: <tokenId>) {
        vin
      }
    }
  `,
};
