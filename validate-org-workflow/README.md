# Validate Organisation and Workflow

This action will check that the repository and workflow currently running is part of an allowed set of options.

Its function is to ensure that we can skip steps in workflows if they are not part of this allowed set.

## Usage

Inputs available:

- `repo` : The repository where the workflow is calling this action. This is typially passed from the calling workflow as `${{ github.repository }}`
- `workflow` : The workflow that is calling this action. This is typically passed from the calling workflow as `${{ github.workflow }}`

Allowed set:

```
ALLOWED_ORGS=(
    "carpentries"
    "swcarpentry"
    "datacarpentry"
    "librarycarpentry"
    "carpentries-incubator"
    "froggleston"
)

ALLOWED_WORKFLOWS=(
    "02 Maintain: Check for Updated Packages"
    "04 Maintain: Update Workflow Files"
)
```

## Outputs

`is_valid` : Set to `'true'` if the repository and workflow are within the allowed set.

Any repo or workflow not in this set will return `'false'`
