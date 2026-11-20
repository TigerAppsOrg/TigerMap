# TigerMap production infrastructure

TigerMap uses Cloudflare Pages for the web app and the shared TigerApps-Combined EC2 host for the
Fastify API and its local SQLite data.

## AWS resources

- API instance: `i-0b2bfc5624ab3f9bf` (`TigerApps-Combined`)
- API Elastic IP: `3.91.107.148` (preserved, mapped to secondary private IP `172.31.39.135`)
- API security group: `sg-0e59d8cec0a11e75b` (`TigerApps-Combined`)
- Instance profile: `HarnessEc2SsmProfile`
- GitHub OIDC deploy role: `TigerMapGitHubDeployRole`
- Encrypted runtime parameters: `/tigermap/production/*`

The GitHub role is scoped to the `main` branch of the exact TigerAppsOrg
repository ID. It can only send an SSM command to the Combined instance and
read that command's result. No long-lived AWS key is stored in GitHub.

The EC2 environment file remains the runtime source for the current service.
Its values are also backed up as encrypted SSM parameters for recovery. Never
commit decrypted parameter values.

The shared host exposes HTTP/HTTPS through nginx. The TigerMap virtual host
proxies to port 3001. Deployment uses SSM; the shared host also supports SSH.

## GitHub configuration

Repository variables:

- `AWS_REGION=us-east-1`
- `AWS_DEPLOY_ROLE_ARN=arn:aws:iam::104733724423:role/TigerMapGitHubDeployRole`
- `EC2_INSTANCE_ID=i-0b2bfc5624ab3f9bf`
- `CLOUDFLARE_ACCOUNT_ID=e2744783298a24185adfbc07174ba2ae`
- `VITE_CAMPUS_MAP_TOKEN` (public token embedded in the web bundle)
- `VITE_CAMPUS_MAP_STYLE`
- `VITE_TIGERAPPS_MAPBOX_TOKEN` (public token embedded in the web bundle)

Repository secrets:

- `CLOUDFLARE_API_TOKEN`

Backend deployment uses SSM. The production checkout is updated with a
fast-forward-only merge, dependencies are installed from the lockfile, and
the API is restarted only after those steps succeed.

## Consolidation — 2026-11-20

The original API instance was migrated to Combined. `/home/ubuntu/TigerMap`,
its SQLite databases and images, runtime environment, Bun binary, and the
`tigermap-api` systemd service retain their existing paths. The public API IP
and Cloudflare Pages API_HOST continue to work unchanged. Secondary addresses
are persisted in `/etc/netplan/60-consolidated-apps.yaml`.

The GitHub repository variable and `DeployTigerMapOnly` IAM policy must both
target Combined. The workflow supports manual deployment as well as main pushes.
Because this is a shared host, avoid host-wide restarts or cleanup in deployment
commands; restart only `tigermap-api`.
