export const IDENTITY_BASE_URL = "https://identity-api.dimo.zone/query"



export const commonQueries = {
    generalInfo: {
        query: `
    query GetTotalVehicles {
  vehicles (first: 10) {
    totalCount
  }
}
    `,
        label: 'General Info',
    },
    getDeveloperLicenseInfo: {
        query: `
    query GetDevLicenseByTokenId {
  developerLicense (by: { tokenId: <devLicenseTokenId> } ) {
    owner
    tokenId
    alias
    clientId
    mintedAt
    redirectURIs (first: 10) {
      nodes {
        uri
        enabledAt
      }
    }
  }
}
    `,
        label: 'Get Developer License Info',
    },
    getVehicleByDevLicense: {
        query: `
    query GetVehicleByDevLicense {
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
        label: 'Get Vehicle By Dev License',
    },
    getTotalVehicleCountForOwner: {
        query: `
    query GetVehiclesByOwner {
  vehicles(filterBy: {owner: "<ownerAddress>"}, first: 100) {
    totalCount
  }
}
    `,
        label: 'Get Total Vehicle Count For Owner',
    },
    getVehicleMMYByOwner: {
        query: `
    query GetVehicleMMYByOwner {
  vehicles(filterBy: {owner: "<ownerAddress>"}, first: 100) {
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
        label: 'Get Vehicle MMY By Owner',
    },
    getVehicleMMYByTokenId: {
        query: `
    query GetVehicleMMYByTokenId {
  vehicle (tokenId: <vehicleTokenId>) {
    owner
    definition {
      make
      model
      year
    }
  }
}
    `,
        label: 'Get Vehicle MMY By TokenId',
    },
    getSacdForVehicle: {
        query: `
    query GetSacdForVehicle {
  vehicle (tokenId: <vehicleTokenId>) {
    sacds (first: 10) {
      nodes {
        permissions
        grantee
        source
        createdAt
        expiresAt
      }
    }
  }
}`,
        label: 'Get SACD For Vehicle',
    },
    getRewardsByOwner: {
        query: `
query GetRewardsByOwner {
  rewards (user: "<ownerAddress>") {
    totalTokens
  }
}
`,
        label: 'Get Rewards By Owner',
    },
    getRewardHistoryByOwner: {
        query: `
query GetRewardHistoryByOwner {
  vehicles(filterBy: {owner: "<ownerAddress>"}, first: 10) {
    nodes {
      earnings {
        history (first: 10) {
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
        label: 'Get Reward History By Owner',
    },
    getDeviceDefinitionByTokenId: {
        query: `
query GetDDIdByVehicleTokenId {
  vehicle(tokenId: <vehicleTokenId>) {
    definition {
      id
    }
  }
}`,
        label: 'Get Device Definition By TokenId',
    },
    getDeviceDefinitionByDefinitionId: {
        query: `
query GetDefinitionByDeviceId {
  deviceDefinition (by: { id: "<deviceDefinitionId>"})  {
    year
    model
    attributes {
      name
      value
    }
  }
}`,
        label: 'Get Device Definition By DefinitionId',
    },
    getOwnerVehicles: {
        query: `
{
  vehicles(filterBy: {owner: "<ownerAddress>"}, first: 100) {
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
        label: 'Get Owner Vehicles',
    },
    getDeveloperSharedVehiclesFromOwner: {
        query: `
{
  vehicles(filterBy: {privileged: "<devLicense0x>", owner: "<ownerAddress>"} first: 100) {
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
        label: 'Get Developer Shared Vehicles From Owner',
    },
    getDCNsByOwner: {
        query: `
{
  vehicles(filterBy: {owner: "<ownerAddress>"}, first: 100) {
    nodes {
      dcn {
        node
        name
        vehicle {
          tokenId
        }
      }
    }
}}
`,
        label: 'Get DCNs By Owner',
    },

}
