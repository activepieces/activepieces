export const IDENTITY_BASE_URL = "https://identity-api.dimo.zone/query"

export const commonQueries = {
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
}
