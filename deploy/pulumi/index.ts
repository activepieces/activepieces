import * as aws from "@pulumi/aws";
import * as docker from "@pulumi/docker";
import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import { ApplicationLoadBalancer } from "@pulumi/awsx/lb/applicationLoadBalancer";
import { registerAutoTags } from './autotag';
import * as child_process from "child_process";

const stack = pulumi.getStack();
const config = new pulumi.Config();

const apEncryptionKey = config.getSecret("apEncryptionKey")?.apply(secretValue => {
    return secretValue || child_process.execSync("openssl rand -hex 16").toString().trim();
});
const apJwtSecret = config.getSecret("apJwtSecret")?.apply(secretValue => {
    return secretValue || child_process.execSync("openssl rand -hex 32").toString().trim();
});
const containerCpu = config.requireNumber("containerCpu");
const containerMemory = config.requireNumber("containerMemory");
const containerInstances = config.requireNumber("containerInstances");
const addIpToPostgresSecurityGroup = config.get("addIpToPostgresSecurityGroup");
const domain = config.get("domain");
const subDomain = config.get("subDomain");
const usePostgres = config.requireBoolean("usePostgres");
const useRedis = config.requireBoolean("useRedis");
const redisNodeType = config.require("redisNodeType");
const dbIsPublic = config.getBoolean("dbIsPublic");
const dbUsername = config.get("dbUsername");
const dbPassword = config.getSecret("dbPassword");
const dbInstanceClass = config.require("dbInstanceClass");

// Add tags for every resource that allows them, with the following properties.
// Useful to know who or what created the resource/service
registerAutoTags({
    "pulumi:Project": pulumi.getProject(),
    "pulumi:Stack": pulumi.getStack(),
    "Created by": config.get("author") || child_process.execSync("pulumi whoami").toString().trim().replace('\\', '/')
});

let imageName;

// Check if we're deploying a local build or direct from Docker Hub
if (config.getBoolean("deployLocalBuild")) {

    const repoName = config.require("repoName");

    const repo = new aws.ecr.Repository(repoName, {
        name: repoName // https://www.pulumi.com/docs/intro/concepts/resources/names/#autonaming
    }); // Create a private ECR repository

    const repoUrl = pulumi.interpolate`${repo.repositoryUrl}`; // Get registry info (creds and endpoint)
    const name = pulumi.interpolate`${repoUrl}:latest`;

    // Get the repository credentials we use to push the image to the repository
    const repoCreds = repo.registryId.apply(async (registryId) => {
        const credentials = await aws.ecr.getCredentials({
            registryId: registryId,
        });
        const decodedCredentials = Buffer.from(credentials.authorizationToken, "base64").toString();
        const [username, password] = decodedCredentials.split(":");
        return {
            server: credentials.proxyEndpoint,
            username,
            password
        };
    });

    // Build and publish the container image.
    const image = new docker.Image(stack, {
        build: {
            context: `../../`,
            dockerfile: `../../Dockerfile`,
            builderVersion: "BuilderBuildKit",
            args: {
                "BUILDKIT_INLINE_CACHE": "1"
            },
        },
        skipPush: pulumi.runtime.isDryRun(),
        imageName: name,
        registry: repoCreds
    });

    imageName = image.imageName;

    pulumi.log.info(`Finished pushing image to ECR`, image);
} else {
    imageName = process.env.IMAGE_NAME || config.get("imageName") || "activepieces/activepieces:latest";
}

const containerEnvironmentVars: awsx.types.input.ecs.TaskDefinitionKeyValuePairArgs[] = [];

// Allocate a new VPC with the default settings:
const vpc = new awsx.ec2.Vpc(`${stack}-vpc`, {
    numberOfAvailabilityZones: 2,
    natGateways: {
        strategy: "Single"
    },
    tags: {
        // For some reason, this is how you name a VPC with AWS:
        // https://github.com/pulumi/pulumi-terraform/issues/38#issue-262186406
        Name: `${stack}-vpc`
    },
    enableDnsHostnames: true,
    enableDnsSupport: true
});

const albSecGroup = new aws.ec2.SecurityGroup(`${stack}-alb-sg`, {
    name: `${stack}-alb-sg`,
    vpcId: vpc.vpcId,
    ingress: [{ // Allow only http & https traffic
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"]
    },
    {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
    }]
})

const fargateSecGroup = new aws.ec2.SecurityGroup(`${stack}-fargate-sg`, {
    name: `${stack}-fargate-sg`,
    vpcId: vpc.vpcId,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecGroup.id]
        }
    ],
    egress: [ // allow all outbound traffic
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"]
        }
    ]
});

if (usePostgres) {
    const rdsSecurityGroupArgs: aws.ec2.SecurityGroupArgs = {
        name: `${stack}-db-sg`,
        vpcId: vpc.vpcId,
        ingress: [{
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [fargateSecGroup.id]  // The id of the Fargate security group
        }],
        egress: [ // allow all outbound traffic
            {
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"]
            }
        ]
    };

    // Optionally add the current outgoing public IP address to the CIDR block
    // so that they can connect directly to the Db during development
    if (addIpToPostgresSecurityGroup) {

        // @ts-ignore
        rdsSecurityGroupArgs.ingress.push({
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [`${addIpToPostgresSecurityGroup}/32`],
            description: `Public IP for local connection`
        });
    }

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(`${stack}-db-sg`, rdsSecurityGroupArgs);

    const rdsSubnets = new aws.rds.SubnetGroup(`${stack}-db-subnet-group`, {
        name: `${stack}-db-subnet-group`,
        subnetIds: dbIsPublic ? vpc.publicSubnetIds : vpc.privateSubnetIds
    });

    const db = new aws.rds.Instance(stack, {
        allocatedStorage: 10,
        engine: "postgres",
        engineVersion: "14.9",
        identifier: stack, // In RDS
        dbName: "postgres", // When connected to the DB host
        instanceClass: dbInstanceClass,
        port: 5432,
        publiclyAccessible: dbIsPublic,
        skipFinalSnapshot: true,
        storageType: "gp2",
        username: dbUsername,
        password: dbPassword,
        dbSubnetGroupName: rdsSubnets.id,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        backupRetentionPeriod: 0,
        applyImmediately: true,
        allowMajorVersionUpgrade: true,
        autoMinorVersionUpgrade: true
    }, {
        protect: dbIsPublic === false,
        deleteBeforeReplace: true
    });

    containerEnvironmentVars.push(
        {
            name: "AP_POSTGRES_DATABASE",
            value: db.dbName
        },
        {
            name: "AP_POSTGRES_HOST",
            value: db.address
        },
        {
            name: "AP_POSTGRES_PORT",
            value: pulumi.interpolate`${db.port}`
        },
        {
            name: "AP_POSTGRES_USERNAME",
            value: db.username
        },
        {
            name: "AP_POSTGRES_PASSWORD",
            value: config.requireSecret("dbPassword")
        },
        {
            name: "AP_POSTGRES_USE_SSL",
            value: "false"
        });

} else {
    containerEnvironmentVars.push(
        {
            name: "AP_DB_TYPE",
            value: "SQLITE3"
        });
}

if (useRedis) {

    const redisCluster = new aws.elasticache.Cluster(`${stack}-redis-cluster`, {
        clusterId: `${stack}-redis-cluster`,
        engine: "redis",
        engineVersion: '7.0',
        nodeType: redisNodeType,
        numCacheNodes: 1,
        parameterGroupName: "default.redis7",
        port: 6379,
        subnetGroupName: new aws.elasticache.SubnetGroup(`${stack}-redis-subnet-group`, {
            name: `${stack}-redis-subnet-group`,
            subnetIds: vpc.privateSubnetIds
        }).id,
        securityGroupIds: [
            new aws.ec2.SecurityGroup(`${stack}-redis-sg`, {
                name: `${stack}-redis-sg`,
                vpcId: vpc.vpcId,
                ingress: [{
                    protocol: "tcp",
                    fromPort: 6379, // The standard port for Redis
                    toPort: 6379,
                    securityGroups: [fargateSecGroup.id]
                }],
                egress: [{
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"]
                }]
            }).id
        ]
    });

    const redisUrl = pulumi.interpolate`${redisCluster.cacheNodes[0].address}:${redisCluster.cacheNodes[0].port}`;
    containerEnvironmentVars.push(
        {
            name: "AP_REDIS_URL",
            value: redisUrl
        });

} else {
    containerEnvironmentVars.push(
        {
            name: "AP_QUEUE_MODE",
            value: "MEMORY"
        });
}

let alb: ApplicationLoadBalancer;
// Export the URL so we can easily access it.
let frontendUrl;

if (subDomain && domain) {
    const fullDomain = `${subDomain}.${domain}`;

    const exampleCertificate = new aws.acm.Certificate(`${stack}-cert`, {
        domainName: fullDomain,
        validationMethod: "DNS",
    });

    const hostedZoneId = aws.route53.getZone({ name: domain }, { async: true }).then(zone => zone.zoneId);

    // DNS records to verify SSL Certificate
    const certificateValidationDomain = new aws.route53.Record(`${fullDomain}-validation`, {
        name: exampleCertificate.domainValidationOptions[0].resourceRecordName,
        zoneId: hostedZoneId,
        type: exampleCertificate.domainValidationOptions[0].resourceRecordType,
        records: [exampleCertificate.domainValidationOptions[0].resourceRecordValue],
        ttl: 600,
    });

    const certificateValidation = new aws.acm.CertificateValidation(`${fullDomain}-cert-validation`, {
        certificateArn: exampleCertificate.arn,
        validationRecordFqdns: [certificateValidationDomain.fqdn],
    });

    // Creates an ALB associated with our custom VPC.
    alb = new awsx.lb.ApplicationLoadBalancer(`${stack}-alb`, {
        securityGroups: [albSecGroup.id],
        name: `${stack}-alb`,
        subnetIds: vpc.publicSubnetIds,
        listeners: [{
            port: 80, // port on the docker container
            protocol: "HTTP",
            defaultActions: [{
                type: "redirect",
                redirect: {
                    protocol: "HTTPS",
                    port: "443",
                    statusCode: "HTTP_301",
                },
            }]
        },
        {
            protocol: "HTTPS",
            port: 443,
            certificateArn: certificateValidation.certificateArn
        }],
        defaultTargetGroup: {
            name: `${stack}-alb-tg`,
            port: 80 // port on the docker container ,
        }
    });

    // Create a DNS record for the load balancer
    const albDomain = new aws.route53.Record(fullDomain, {
        name: fullDomain,
        zoneId: hostedZoneId,
        type: "CNAME",
        records: [alb.loadBalancer.dnsName],
        ttl: 600,
    });

    frontendUrl = pulumi.interpolate`https://${subDomain}.${domain}`;

} else {

    // Creates an ALB associated with our custom VPC.
    alb = new awsx.lb.ApplicationLoadBalancer(`${stack}-alb`, {
        securityGroups: [albSecGroup.id],
        name: `${stack}-alb`,
        subnetIds: vpc.publicSubnetIds,
        listeners: [{
            port: 80, // exposed port from the docker file
            protocol: "HTTP"
        }],
        defaultTargetGroup: {
            name: `${stack}-alb-tg`,
            port: 80, // port on the docker container
            protocol: "HTTP"
        }
    });

    frontendUrl = pulumi.interpolate`http://${alb.loadBalancer.dnsName}`;
}

const environmentVariables = [
    ...containerEnvironmentVars,
    {
        name: "AP_ENGINE_EXECUTABLE_PATH",
        value: "dist/packages/engine/main.js"
    },
    {
        name: "AP_ENCRYPTION_KEY",
        value: apEncryptionKey
    },
    {
        name: "AP_JWT_SECRET",
        value: apJwtSecret
    },
    {
        name: "AP_ENVIRONMENT",
        value: "prod"
    },
    {
        name: "AP_FRONTEND_URL",
        value: frontendUrl
    },
    {
        name: "AP_TRIGGER_DEFAULT_POLL_INTERVAL",
        value: "5"
    },
    {
        name: "AP_EXECUTION_MODE",
        value: "UNSANDBOXED"
    },
    {
        name: "AP_REDIS_USE_SSL",
        value: "false"
    },
    {
        name: "AP_SANDBOX_RUN_TIME_SECONDS",
        value: "600"
    },
    {
        name: "AP_TELEMETRY_ENABLED",
        value: "true"
    },
    {
        name: "AP_TEMPLATES_SOURCE_URL",
        value: "https://cloud.activepieces.com/api/v1/flow-templates"
    }
];

const fargateService = new awsx.ecs.FargateService(`${stack}-fg`, {
    name: `${stack}-fg`,
    cluster: (new aws.ecs.Cluster(`${stack}-cluster`, {
        name: `${stack}-cluster`
    })).arn,
    networkConfiguration: {
        subnets: vpc.publicSubnetIds,
        securityGroups: [fargateSecGroup.id],
        assignPublicIp: true
    },
    desiredCount: containerInstances,
    taskDefinitionArgs: {
        family: `${stack}-fg-task-definition`,
        container: {
            name: "activepieces",
            image: imageName,
            cpu: containerCpu,
            memory: containerMemory,
            portMappings: [{
                targetGroup: alb.defaultTargetGroup,
            }],
            environment: environmentVariables
        }
    }
});

pulumi.log.info("Finished running Pulumi");

export const _ = {
    activePiecesUrl: frontendUrl,
    activepiecesEnv: environmentVariables
};
