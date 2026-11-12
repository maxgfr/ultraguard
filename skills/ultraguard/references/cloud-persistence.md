# Cloud persistence

A CI stealer that obtains cloud credentials leaves persistence that outlives
a secret rotation. `scan cloud` checks each provider through its own CLI,
only when it is installed and logged in; otherwise that provider is a gap.

| Provider | Check | Severity |
|---|---|---|
| AWS | IAM role trust policies that allow any principal (`"AWS": "*"`) | compromised, or suspicious when a Condition limits it |
| AWS | IAM user access keys created during the window | suspicious |
| GCP | user-managed service-account keys created during the window | suspicious |
| GCP | `generateAccessToken` / `signJwt` calls in the window (Cloud Logging) | suspicious, grouped by caller |
| Azure | federated credentials on your apps whose name matches an `azure_fedcred_prefix` IOC | compromised |
| Azure | federated credentials trusting GitHub Actions OIDC | info: which workflows can get a token |

Only the active profile, project or subscription is read. Ask the user which
other accounts their CI can reach, and re-run with each one selected.

Not checked: CloudTrail and Activity Log history (large, needs a trail).
REMEDIATION.md gives the query to run by hand.
