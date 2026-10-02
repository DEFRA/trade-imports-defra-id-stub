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

After cloning the repository, run the below commands to start the stub
directly.

By default, the application will run on port 3007. However, this can be
overridden by setting the `PORT` environment variable.

```bash
npm ci
npm run build:frontend
npm run dev
```

Data can be customised via environment variables (e.g. in a `.env` read by
your shell):

```
AUTH_MODE=mock
AUTH_OVERRIDE=9999999999:John:Watson:9999999:888888888:John Watson & Co.
AUTH_OVERRIDE_FILE=example.data.json
```

The stub also runs as part of the trade-imports-animals workspace stack
([DEFRA/trade-imports-animals-workspace](https://github.com/DEFRA/trade-imports-animals-workspace)),
which starts it from the published image alongside the rest of the services:
`./scripts/stack/run-stack.sh` from the workspace root.

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

### Latency profiles

The stub stands in for the `defra-id` integration, and can answer its server-to-server calls with a latency profile, so the services under performance test do not see an instant identity provider.

The profile applies to the OIDC discovery, token and signing-key paths only (`.well-known/openid-configuration`, `oauth2/v2.0/token` and `discovery/v2.0/keys`). The browser-facing authorize, sign-in and sign-out pages answer with no added delay.

Each profile is one of:

- `zero-delay`: adds no delay. This is the default.
- `sla`: delays each answer by a draw from a lognormal distribution fitted to the targets. The median is matched exactly and the tail is the least-squares fit to p95 and p99 in log space. The interim targets are p50 100 ms, p95 400 ms and p99 1,000 ms, which fit to p95 470 ms and p99 892 ms. They are interim and unagreed until section 9.5 of the volumetrics page agrees them.

The profile is chosen when the container starts, so one image serves every environment:

| Variable | Meaning | Default |
|---|---|---|
| `STUB_LATENCY_PROFILE` | Profile for every integration unless its own is set | `zero-delay` |
| `STUB_LATENCY_DEFRA_ID_PROFILE` | Profile for `defra-id` | the stub-wide profile |
| `STUB_LATENCY_DEFRA_ID_P50_MS`, `_P95_MS`, `_P99_MS` | The targets the `sla` profile is fitted to | 100, 400, 1000 |
| `STUB_LATENCY_DEFRA_ID_AGREED` | Whether the targets are agreed | `false` |
| `STUB_LATENCY_DEFRA_ID_LAST_CONFORMED` | Date the profile was last conformed, `YYYY-MM-DD` | unset |

CDP perf-test sets `STUB_LATENCY_PROFILE=sla` in cdp-app-config; that change is made by a person, not by this repo.

`GET /latency-profiles` reports, for each integration: `integration`, `interface`, `owner`, `serviceLevelSource`, `agreed`, `lastConformed`, `profile`, `slaTargets`, `fitted`, `targets` (the targets the running profile aims for, zero for `zero-delay`) and `answered` (`count`, `peakPerSecond`, `p50Ms`, `p95Ms`, `p99Ms`). `answered` is measured from the stub receiving a request to its response being ready, on the instance that answers the read. `peakPerSecond` is the most calls the instance answered within one wall-clock second since it started or was last cleared: the load the integration carried, which the performance tests judge against the stub's measured ceiling. `count` is every call since the stub started or the last clear, and the percentiles are over a random sample of up to 10,000 of them. The percentiles are null until the stub has answered a call since it started or was last cleared. `DELETE /latency-profiles/answered` forgets them all and returns 204. It is the same contract `trade-imports-stub` serves.

## Testing

A single `npm test` runs the whole suite — unit and integration together.
Build the frontend assets first, as the static-file tests serve them:

```bash
npm run build:frontend
npm test
```

Tests can also be run in watch mode to support Test Driven Development (TDD):

```bash
npm run test:watch
```

The S3 data tests under `test/integration/data/` run as part of `npm test` —
they spin up their own Floci via [Testcontainers](https://testcontainers.com/)
on a dynamic port, so no separate stack is needed. **Docker must be running** for
them to pass.

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
