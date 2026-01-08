# Validate Organisation and Workflow

This action will check that the repository and workflow currently running is part of an allowed set of options.

Its function is to ensure that we can skip steps in workflows if they are not part of this allowed set.

### Allowed set of repos and workflows:

```
ALLOWED_ORGS=(
    "carpentries"
    "swcarpentry"
    "datacarpentry"
    "librarycarpentry"
    "carpentries-incubator"
    "carpentries-lab"
    "fishtree-attempt"
    "froggleston"
)

ALLOWED_WORKFLOWS=(
    "01 Maintain: Build and Deploy Site"
    "02 Maintain: Check for Updated Packages"
    "03 Maintain: Apply Package Cache"
    "04 Maintain: Update Workflow Files"
    "Bot: Receive Pull Request"
)
```


## Inputs

### repo

The repository where the workflow is calling this action.
This is typially passed from the calling workflow as `${{ github.repository }}`.

- required: true

### workflow

The workflow that is calling this action.
This is typically passed from the calling workflow as `${{ github.workflow }}`.

- required: true


## Outputs

### is_valid

Set to `'true'` if the repository and workflow are within the allowed set.
Any repo or workflow not in this set will return `'false'`

- value: `true` or `false`
