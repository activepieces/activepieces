export const IdentityQueries = {
	generalInfo: `
        {
          vehicles(first: 10) {
            totalCount
          }
        }
    `,
	getDeveloperLicenseInfo: `
        {
          developerLicense(by: { tokenId: <devLicenseTokenId> }) {
            owner
            tokenId
            alias
            clientId
            mintedAt
            redirectURIs(first: 10) {
              nodes {
                uri
                enabledAt
              }
            }
          }
        }
    `,
	getVehicleByDevLicense: `
        {
          vehicles(filterBy: { privileged: "<devLicense0x>" }, first: 100) {
            nodes {
              owner
              tokenId
              definition {
                make
                model
                year
              }
            }
          }
        }
    `,
	getTotalVehicleCountForOwner: `
        {
          vehicles(filterBy: { owner: "<ownerAddress>" }, first: 100) {
            totalCount
          }
        }
    `,
	getVehicleMMYByOwner: `
        {
          vehicles(filterBy: { owner: "<ownerAddress>" }, first: 100) {
            nodes {
              tokenId
              definition {
                make
                model
                year
              }
            }
          }
        }
    `,
	getVehicleMMYByTokenId: `
        {
          vehicle(tokenId: <vehicleTokenId>) {
            owner
            definition {
              make
              model
              year
            }
          }
        }
    `,
	getSacdForVehicle: `
        {
          vehicle(tokenId: <vehicleTokenId>) {
            sacds(first: 10) {
              nodes {
                permissions
                grantee
                source
                createdAt
                expiresAt
              }
            }
          }
        }
    `,
	getRewardsByOwner: `
        {
          rewards(user: "<ownerAddress>") {
            totalTokens
          }
        }
    `,
	getRewardHistoryByOwner: `
        {
          vehicles(filterBy: { owner: "<ownerAddress>" }, first: 10) {
            nodes {
              earnings {
                history(first: 10) {
                  edges {
                    node {
                      week
                      aftermarketDeviceTokens
                      syntheticDeviceTokens
                      sentAt
                      beneficiary
                      connectionStreak
                      streakTokens
                    }
                  }
                }
                totalTokens
              }
            }
          }
        }
    `,
	getDeviceDefinitionByTokenId: `
        {
          vehicle(tokenId: <vehicleTokenId>) {
            definition {
              id
            }
          }
        }
    `,
	getDeviceDefinitionByDefinitionId: `
        {
          deviceDefinition(by: { id: "<deviceDefinitionId>" }) {
            year
            model
            attributes {
              name
              value
            }
          }
        }
    `,
	getOwnerVehicles: `
        {
          vehicles(filterBy: { owner: "<ownerAddress>" }, first: 100) {
            nodes {
              tokenId
              privileges(first: 10) {
                nodes {
                  setAt
                  expiresAt
                  id
                }
              }
            }
          }
        }
    `,
	getDeveloperSharedVehiclesFromOwner: `
        {
          vehicles(filterBy: { privileged: "<devLicense0x>", owner: "<ownerAddress>" }, first: 100) {
            totalCount
            nodes {
              tokenId
              definition {
                make
              }
              aftermarketDevice {
                manufacturer {
                  name
                }
              }
            }
          }
        }
    `,
	getDCNsByOwner: `
        {
          vehicles(filterBy: { owner: "<ownerAddress>" }, first: 100) {
            nodes {
              dcn {
                node
                name
                vehicle {
                  tokenId
                }
              }
            }
          }
        }
    `,
};

export const TelemetryQueries = {
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
        timestamp
        currentLocationLatitude(agg: LAST)
        currentLocationLongitude(agg: LAST)
        speed(agg: LAST)
        powertrainType(agg: LAST)
        powertrainRange(agg: LAST)
        exteriorAirTemperature(agg: LAST)
      }
    }
  `,
	getDailyAvgSpeedOfVehicle: `
    query {
      signals(
        tokenId: <tokenId>,
        from: "<startDate>", to: "<endDate>",
        interval: "24h"
      ) {
        timestamp
        avgSpeed: speed(agg: AVG)
      }
    }
  `,
  getEvents: `
    query {
      events(
        tokenId: <tokenId>,
        from: "<startDate>", to: "<endDate>"
      ) {
        name
        metadata
        timestamp
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
