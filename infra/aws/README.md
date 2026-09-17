# TigerMap production infrastructure

TigerMap uses Cloudflare Pages for the web app and one EC2 instance for the
Fastify API and its local SQLite data.

## AWS resources

- API instance: `i-0e1651e5f2954427d` (`tigermap-api`)
- API Elastic IP: `3.91.107.148`
- Instance role/profile: `TigerMapInstanceRole`
- GitHub OIDC deploy role: `TigerMapGitHubDeployRole`
- Encrypted runtime parameters: `/tigermap/production/*`

The GitHub role is scoped to the `main` branch of the exact TigerAppsOrg
repository ID. It can only send an SSM command to the TigerMap instance and
read that command's result. No long-lived AWS key is stored in GitHub.

The EC2 environment file remains the runtime source for the current service.
Its values are also backed up as encrypted SSM parameters for recovery. Never
commit decrypted parameter values.

## GitHub configuration

Repository variables:

- `AWS_REGION=us-east-1`
- `AWS_DEPLOY_ROLE_ARN=arn:aws:iam::104733724423:role/TigerMapGitHubDeployRole`
- `EC2_INSTANCE_ID=i-0e1651e5f2954427d`
- `CLOUDFLARE_ACCOUNT_ID=e2744783298a24185adfbc07174ba2ae`
- `VITE_CAMPUS_MAP_TOKEN` (public token embedded in the web bundle)
- `VITE_CAMPUS_MAP_STYLE`
- `VITE_TIGERAPPS_MAPBOX_TOKEN` (public token embedded in the web bundle)

Repository secrets:

- `CLOUDFLARE_API_TOKEN`

Backend deployment uses SSM. The production checkout is updated with a
fast-forward-only merge, dependencies are installed from the lockfile, and
the API is restarted only after those steps succeed.
