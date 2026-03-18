# trade-imports-defra-id-stub

![Build](https://github.com/defra/trade-imports-defra-id-stub/actions/workflows/publish.yml/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_trade-imports-defra-id-stub&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=DEFRA_trade-imports-defra-id-stub)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_trade-imports-defra-id-stub&metric=bugs)](https://sonarcloud.io/summary/new_code?id=DEFRA_trade-imports-defra-id-stub)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_trade-imports-defra-id-stub&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=DEFRA_trade-imports-defra-id-stub)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_trade-imports-defra-id-stub&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=DEFRA_trade-imports-defra-id-stub)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DEFRA_trade-imports-defra-id-stub&metric=coverage)](https://sonarcloud.io/summary/new_code?id=DEFRA_trade-imports-defra-id-stub)

Defra Identity stub for Trade Imports.

There are two existing Defra Identity stubs:

- [Official Defra Identity stub](https://dev.azure.com/defragovuk/DEFRA-Common-Platform-Improvements/_wiki/wikis/DEFRA-Common-Platform-Improvements.wiki/32274/IDM-stub)
- [CDP Defra Identity stub](https://github.com/DEFRA/cdp-defra-id-stub)

Neither of these support the `signupsigninsfi` policy used in Trade Imports.

This policy enables authentication with a CRN/Password combination and changes the content of the default Defra Identity token.

> NOTE: this stub is still a work in progress. Feedback and issues welcome.

## Supported Defra Identity features

- CRN/Password authentication
- Exposes all Defra Identity endpoints including well-known endpoints
- Organisation selection ( -- TODO --)
- Signed JWT token generation consistent with `signupsigninsfi` policy
- Token exchange from authorisation
- Refresh token exchange
- Single Sign-On (SSO) support (Session lasts one hour, extended on each re-authentication/organisation change)
- Sign out including ending SSO session


## Using the stub locally

### Docker

This application is intended to be run in a Docker container to ensure consistency across environments.

Docker can be installed from [Docker's official website](https://docs.docker.com/get-docker/).

### Run from source

After cloning the repository, run the below commands to start the container.

By default, the application will run on port 3007.  However, this can be overridden by setting the `TRADE_IMPORTS_DEFRA_ID_STUB_PORT` environment variable.

```bash
# Build the image
docker compose build

# Run the application
npm run docker:dev
```

A `.env` will automatically be read by the Docker compose files allowing to customise the data available.

```
AUTH_MODE=mock
AUTH_OVERRIDE=9999999999:John:Watson:9999999:888888888:John Watson & Co.
AUTH_OVERRIDE_FILE=example.data.json
```

> NOTE: if providing a different custom, file the [`compose.override.yml`](./compose.override.yml) file volume may need updating.

### Docker

Images of this stub are available in DockerHub, [defradigital/trade-imports-defra-id-stub](https://hub.docker.com/repository/docker/defradigital/trade-imports-defra-id-stub).

```bash
# Pull the latest image
docker pull defradigital/trade-imports-defra-id-stub

docker run -p 3007:3007 defradigital/trade-imports-defra-id-stub
```

By default, the application will run on port 3007, however this can be overridden by setting the `PORT` environment variable.

```bash
docker run -p 3008:3008 -e PORT=3008 defradigital/trade-imports-defra-id-stub
```

### Docker Compose

The image can be added to your application's existing Docker Compose file.

```yaml
trade-imports-defra-id-stub:
  image: defradigital/trade-imports-defra-id-stub
  environment:
    PORT: 3007
    AUTH_MODE: ${AUTH_MODE}
    AUTH_OVERRIDE: ${AUTH_OVERRIDE}
    AUTH_OVERRIDE_FILE: ${AUTH_OVERRIDE_FILE}
  ports:
    - "3007:3007"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3007/health"]
    interval: 1m30s
    timeout: 30s
    retries: 5
    start_period: 3s
```

## Using the stub in your application

The stub has the same endpoints and expectations as the real Defra Identity.

The simplest way to switch between the stub is to update your application to use the well known endpoint of the stub.

For example, let's say your application has the following environment variables for a real Defra Identity instance.

```
DEFRA_ID_WELL_KNOWN_URL=https://your-account.cpdev.cui.defra.gov.uk/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/.well-known/openid-configuration
DEFRA_ID_CLIENT_ID=<your Client ID GUID>
DEFRA_ID_CLIENT_SECRET=<Your Client Secret>
DEFRA_ID_SERVICE_ID=<your Service ID GUID>
DEFRA_ID_POLICY=b2c_1a_cui_cpdev_signupsigninsfi
```

Only the first environment variable needs to change, to repoint to the stub.

```
DEFRA_ID_WELL_KNOWN_URL=http://trade-imports-defra-id-stub:3007/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/.well-known/openid-configuration
DEFRA_ID_CLIENT_ID=<your Client ID GUID>
DEFRA_ID_CLIENT_SECRET=<Your Client Secret>
DEFRA_ID_SERVICE_ID=<your Service ID GUID>
DEFRA_ID_POLICY=b2c_1a_cui_cpdev_signupsigninsfi
```

**IMPORTANT** if not running in the same Docker network as your app, then the host must be set as `host.docker.internal` to enable the containerised app access localhost.

```
DEFRA_ID_WELL_KNOWN_URL=http://host.docker.internal:3007/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/.well-known/openid-configuration
DEFRA_ID_CLIENT_ID=<your Client ID GUID>
DEFRA_ID_CLIENT_SECRET=<Your Client Secret>
DEFRA_ID_SERVICE_ID=<your Service ID GUID>
DEFRA_ID_POLICY=b2c_1a_cui_cpdev_signupsigninsfi
```

Example Docker Compose file

```yaml
services:
  my-app:
    image: my-app
    ports:
      - "3000:3000"
    environment:
      DEFRA_ID_WELL_KNOWN_URL: ${DEFRA_ID_WELL_KNOWN_URL}
      DEFRA_ID_CLIENT_ID: ${DEFRA_ID_CLIENT_ID}
      DEFRA_ID_CLIENT_SECRET: ${DEFRA_ID_CLIENT_SECRET}
      DEFRA_ID_SERVICE_ID: ${DEFRA_ID_SERVICE_ID}
      DEFRA_ID_POLICY: ${DEFRA_ID_POLICY}
    depends_on:
      trade-imports-defra-id-stub:
        condition: service_healthy

  trade-imports-defra-id-stub:
    image: defradigital/trade-imports-defra-id-stub
    ports:
      - "3007:3007"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3007/health"]
      interval: 1m30s
      timeout: 30s
      retries: 5
      start_period: 3s
```

### Trade Imports Defra Identity example

The [Trade_Imports Defra Identity example repository](https://github.com/DEFRA/trade-imports-defra-id-example) includes the stub as part of it's Docker Compose setup for optional use.

## CDP environments

The stub is deployed to all CDP environments and can be used by any application.

> Note: the deployed version uses the Basic authentication setup where any CRN is accepted and a basic list of organisations is provided.

- [https://trade-imports-defra-id-stub.dev.cdp-int.defra.cloud](https://trade-imports-defra-id-stub.dev.cdp-int.defra.cloud)

Example configuration file for CDP `dev` environment.

```
DEFRA_ID_WELL_KNOWN_URL=https://trade-imports-defra-id-stub.dev.cdp-int.defra.cloud/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/.well-known/openid-configuration
DEFRA_ID_CLIENT_ID=<your Client ID GUID>
DEFRA_ID_CLIENT_SECRET=<Your Client Secret>
DEFRA_ID_SERVICE_ID=<your Service ID GUID>
DEFRA_ID_POLICY=b2c_1a_cui_cpdev_signupsigninsfi
```

> NOTE: CDP environments cannot be used from outside of CDP as the complex redirection url will be rejected.

### Basic (Default)

This option allows authentication of predefined 10 digit CRN and password to be successful.  

### Mock

The option works the same as basic other than only a predefined list of mock CRNs are accepted. 

Each of the CRNs are associated with varying mock organisations.

This allows for more variation of automated tests and scenarios.

Current mock data available can be viewed [here](./src/data/mock.json).

> NOTE: as per limitations above, mock data is limited.

To enable this option set the `AUTH_MODE` environment variable to `mock`.

### Simple override

This option allows for a simple override of the default behaviour by providing a single CRN and organisation as a string environment variable.

The provided CRN will be the only one permitted to authenticate and the provided organisation will be the only one available for selection.

To enable this option set the `AUTH_OVERRIDE` environment variable to a string in the format `crn:firstName:lastName:organisationId:sbi:organisationName`.

Where crn is 10 digits, firstName/lastName are letters and spaces, organisationId is a number, sbi is 9 digits, and organisationName can be anything

This is validated against the following regular expression

```javascript
/^(\d{10}):([a-zA-Z\s]+):([a-zA-Z\s]+):(\d+):(\d{9}):(.+)$/
```

If this environment variable is provided, it will take precedence over Basic and Mock modes.

To enable this option set the `AUTH_OVERRIDE_FILE` environment variable to the filename of the JSON file within the directory.

For example: `AUTH_OVERRIDE_FILE: auth-override.json`

If provided, this option will take precedence over the above methods.


## Passing CRN and Password

For demo and testing purposes only, the stub can be configured to accept the predefined CRN and Password to authorize.

Where the minimum required parameters are:
- `serviceId` - Your Service ID GUID
- `client_id` - Your Client ID GUID
- `redirect_uri` - Your callback URL (must be URL encoded)
- `scope` - OAuth scope (e.g., `openid`)
- `crn` - Customer Reference Number
- `password` - Password

## Further configuration

### Setting an unsecure cookie

The stub uses cookies to manage an authentication and SSO session.

The cookie is secure by default, meaning it will only be sent over HTTPS or localhost.

For scenarios where the stub is hosted on an HTTP domain other than localhost, the cookie can be set to unsecure by setting the `SECURE_COOKIE` environment variable to `false`.

Example Docker Compose file

```yaml
services:
  trade-imports-defra-id-stub:
    image: defradigital/trade-imports-defra-id-stub
    environment:
      SECURE_COOKIE: false
```

> Note: when building from source using the provided Docker Compose file, this variable is already set to `false` by default so no action is required.

## Testing

To run the tests for the stub:

```bash
npm run docker:test
```

Tests can also be run in watch mode to support Test Driven Development (TDD):

```bash
npm run docker:test:watch
```

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
