# Hybrid Authentication

This action is intended to check the Carpentries AWS Secrets Manager for PATs that can be used in workflows.

This can only be called from a controlled set of repositories and branches.

It is not intended for use outside the core Carpentries GitHub organisations.

## Issues

Due to GitHub's policy on masking secrets in outputs across jobs, this action does not work as intended as yet.

It remains here in case GitHub changes this policy, and our main workflows can be simplified to use this reusable workflow.
